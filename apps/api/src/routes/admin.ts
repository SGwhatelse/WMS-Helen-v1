
import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '@wms/database'
import { requirePlatformUser, requirePermission, PermissionAction } from '../middleware/authorization.js'

const adminRoutes: FastifyPluginAsync = async (app) => {
  
  // =============================================================================
  // IMPERSONATION
  // =============================================================================
  
  // POST /api/admin/impersonate/:userId - Start impersonating a tenant user
  app.post('/impersonate/:userId', { 
    preHandler: requirePermission(PermissionAction.IMPERSONATE_USER) 
  }, async (request, reply) => {
    const { userId } = request.params as { userId: string }
    
    // Find target user
    const targetUser = await prisma.tenantUser.findUnique({
      where: { id: userId },
      include: { tenant: true },
    })
    
    if (!targetUser) {
      return reply.status(404).send({ error: 'User not found' })
    }
    
    // Create impersonation session
    const session = await prisma.userSession.create({
      data: {
        userId: targetUser.id,
        token: `imp_${crypto.randomUUID()}`,
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'] || null,
      },
    })
    
    // Set cookie
    reply.setCookie('wms_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 4 * 60 * 60, // 4 hours
    })
    
    // Store original admin session in separate cookie
    const originalToken = request.cookies.wms_session
    reply.setCookie('wms_original_session', originalToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 4 * 60 * 60,
    })
    
    return {
      success: true,
      impersonating: {
        id: targetUser.id,
        email: targetUser.email,
        name: `${targetUser.firstName} ${targetUser.lastName}`,
        tenant: targetUser.tenant.name,
      },
    }
  })
  
  // POST /api/admin/impersonate/stop - Stop impersonating
  app.post('/impersonate/stop', async (request, reply) => {
    const originalToken = request.cookies.wms_original_session
    
    if (!originalToken) {
      return reply.status(400).send({ error: 'Not impersonating' })
    }
    
    // Delete impersonation session
    const currentToken = request.cookies.wms_session
    if (currentToken?.startsWith('imp_')) {
      await prisma.userSession.delete({
        where: { token: currentToken },
      }).catch(() => {}) // Ignore if not found
    }
    
    // Restore original session
    reply.setCookie('wms_session', originalToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    })
    
    // Clear original session cookie
    reply.clearCookie('wms_original_session')
    
    return { success: true, message: 'Impersonation ended' }
  })
  
  // =============================================================================
  // DASHBOARD STATS
  // =============================================================================
  
  // GET /api/admin/dashboard/stats
  app.get('/dashboard/stats', { 
    preHandler: requirePlatformUser 
  }, async (request, reply) => {
    const [
      totalTenants,
      activeTenants,
      totalProducts,
      totalOrders,
      totalReturns,
      pendingWros,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'active' } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.return.count(),
      prisma.warehouseReceivingOrder.count({ where: { status: 'awaiting' } }),
    ])
    
    return {
      tenants: { total: totalTenants, active: activeTenants },
      products: totalProducts,
      orders: totalOrders,
      returns: totalReturns,
      pendingWros,
    }
  })
  
  // =============================================================================
  // TENANTS MANAGEMENT
  // =============================================================================
  
  // GET /api/admin/tenants
  app.get('/tenants', { 
    preHandler: requirePermission(PermissionAction.TENANTS_READ) 
  }, async (request, reply) => {
    const { search, status, page = '1', limit = '20' } = request.query as any
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    
    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status) {
      where.status = status
    }
    
    const [data, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          _count: { select: { users: true, products: true, orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.tenant.count({ where }),
    ])
    
    return {
      data,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    }
  })
  
  // GET /api/admin/tenants/:id
  app.get('/tenants/:id', { 
    preHandler: requirePermission(PermissionAction.TENANTS_READ) 
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        settings: true,
        subscription: true,
        users: { select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true } },
        warehouses: true,
        _count: { select: { products: true, orders: true, returns: true } },
      },
    })
    
    if (!tenant) {
      return reply.status(404).send({ error: 'Tenant not found' })
    }
    
    return tenant
  })
  
  // POST /api/admin/tenants
  app.post('/tenants', { 
    preHandler: requirePermission(PermissionAction.TENANTS_CREATE) 
  }, async (request, reply) => {
    const { name, slug, contactEmail, contactPhone, companyName } = request.body as any
    
    // Check slug uniqueness
    const existing = await prisma.tenant.findUnique({ where: { slug } })
    if (existing) {
      return reply.status(400).send({ error: 'Slug already exists' })
    }
    
    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        contactEmail,
        contactPhone,
        companyName,
        status: 'active',
        settings: { create: {} },
      },
      include: { settings: true },
    })
    
    return tenant
  })
  
  // PATCH /api/admin/tenants/:id
  app.patch('/tenants/:id', { 
    preHandler: requirePermission(PermissionAction.TENANTS_UPDATE) 
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = request.body as any
    
    const tenant = await prisma.tenant.update({
      where: { id },
      data,
    })
    
    return tenant
  })
  
  // =============================================================================
  // PLATFORM USERS MANAGEMENT
  // =============================================================================
  
  // GET /api/admin/users
  app.get('/users', { 
    preHandler: requirePermission(PermissionAction.USERS_READ) 
  }, async (request, reply) => {
    const { search, role } = request.query as any
    
    const where: any = {}
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (role) {
      where.role = role
    }
    
    const users = await prisma.platformUser.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return { data: users }
  })
  
  // POST /api/admin/users
  app.post('/users', { 
    preHandler: requirePermission(PermissionAction.USERS_CREATE) 
  }, async (request, reply) => {
    const { email, password, firstName, lastName, role } = request.body as any
    const bcrypt = await import('bcryptjs')
    
    const existing = await prisma.platformUser.findUnique({ where: { email } })
    if (existing) {
      return reply.status(400).send({ error: 'Email already exists' })
    }
    
    const passwordHash = await bcrypt.hash(password, 10)
    
    const user = await prisma.platformUser.create({
      data: {
        email,
        password: passwordHash,
        firstName,
        lastName,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    })
    
    return user
  })
  
  // =============================================================================
  // INVITATIONS
  // =============================================================================
  
  // POST /api/admin/tenants/:tenantId/invitations
  app.post('/tenants/:tenantId/invitations', { 
    preHandler: requirePermission(PermissionAction.USERS_CREATE) 
  }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string }
    const { email, role } = request.body as { email: string; role: string }
    
    // Check tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) {
      return reply.status(404).send({ error: 'Tenant not found' })
    }
    
    // Check if user already exists
    const existingUser = await prisma.tenantUser.findUnique({
      where: { tenantId_email: { tenantId, email } },
    })
    if (existingUser) {
      return reply.status(400).send({ error: 'User already exists in this tenant' })
    }
    
    // Generate token
    const token = crypto.randomUUID()
    const bcrypt = await import('bcryptjs')
    const tokenHash = await bcrypt.hash(token, 10)
    
    // For now, use a placeholder inviter (first platform admin)
    // In production, get from request.userContext
    const admin = await prisma.tenantUser.findFirst({
      where: { tenantId, role: 'owner' },
    })
    
    if (!admin) {
      return reply.status(400).send({ error: 'No owner found to send invitation' })
    }
    
    const invitation = await prisma.invitation.create({
      data: {
        tenantId,
        email,
        roleToAssign: role as any,
        tokenHash,
        invitedBy: admin.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })
    
    // TODO: Send email with invitation link
    // const inviteUrl = `${process.env.APP_URL}/invite/accept?token=${token}`
    
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.roleToAssign,
      expiresAt: invitation.expiresAt,
      // In dev, return token for testing
      ...(process.env.NODE_ENV !== 'production' && { token }),
    }
  })
  
  // GET /api/admin/tenants/:tenantId/invitations
  app.get('/tenants/:tenantId/invitations', { 
    preHandler: requirePermission(PermissionAction.USERS_READ) 
  }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string }
    
    const invitations = await prisma.invitation.findMany({
      where: { tenantId, acceptedAt: null },
      select: {
        id: true,
        email: true,
        roleToAssign: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return { data: invitations }
  })
// =============================================================================
  // TENANT INVOICES
  // =============================================================================

  // GET /api/admin/tenants/:tenantId/invoices
  app.get('/tenants/:tenantId/invoices', {
    preHandler: requirePermission(PermissionAction.BILLING_READ)
  }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string }
    const { limit = '10' } = request.query as any

    const invoices = await prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    })

    return { data: invoices }
  })

  // POST /api/admin/tenants/:tenantId/invoices
  app.post('/tenants/:tenantId/invoices', {
    preHandler: requirePermission(PermissionAction.BILLING_MANAGE)
  }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string }
    const { amountCents, currency, periodStart, periodEnd, dueDate, notes } = request.body as any

    // Generate invoice number
    const count = await prisma.invoice.count()
    const invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber,
        amountCents,
        currency: currency || 'CHF',
        periodStart: periodStart ? new Date(periodStart) : null,
        periodEnd: periodEnd ? new Date(periodEnd) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        status: 'draft',
      },
    })

    return invoice
  })

  // PATCH /api/admin/invoices/:id
  app.patch('/invoices/:id', {
    preHandler: requirePermission(PermissionAction.BILLING_MANAGE)
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = request.body as any

    const invoice = await prisma.invoice.update({
      where: { id },
      data,
    })

    return invoice
  })

  // =============================================================================
  // TENANT CONTACT LOGS
  // =============================================================================

  // GET /api/admin/tenants/:tenantId/contacts
  app.get('/tenants/:tenantId/contacts', {
    preHandler: requirePermission(PermissionAction.TENANTS_READ)
  }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string }
    const { limit = '10' } = request.query as any

    const contacts = await prisma.contactLog.findMany({
      where: { tenantId },
      include: {
        contactedByUser: {
          select: { firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    })

    return { data: contacts }
  })

  // POST /api/admin/tenants/:tenantId/contacts
  app.post('/tenants/:tenantId/contacts', {
    preHandler: requirePermission(PermissionAction.TENANTS_UPDATE)
  }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string }
    const { channel, subject, content, status } = request.body as any

    // Get current admin user from cookies
    const adminId = request.cookies.wms_admin_id

    const contactLog = await prisma.contactLog.create({
      data: {
        tenantId,
        channel,
        subject,
        content,
        status: status || 'open',
        contactedBy: adminId || null,
      },
    })

    return contactLog
  })

  // PATCH /api/admin/contacts/:id
  app.patch('/contacts/:id', {
    preHandler: requirePermission(PermissionAction.TENANTS_UPDATE)
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = request.body as any

    if (data.status === 'resolved' || data.status === 'closed') {
      data.resolvedAt = new Date()
    }

    const contactLog = await prisma.contactLog.update({
      where: { id },
      data,
    })

    return contactLog
  })

  // =============================================================================
  // TENANT USERS (within tenant)
  // =============================================================================

  // GET /api/admin/tenants/:tenantId/users
  app.get('/tenants/:tenantId/users', {
    preHandler: requirePermission(PermissionAction.USERS_READ)
  }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string }

    const users = await prisma.tenantUser.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return { data: users }
  })

  // POST /api/admin/tenants/:tenantId/users
  app.post('/tenants/:tenantId/users', {
    preHandler: requirePermission(PermissionAction.USERS_CREATE)
  }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string }
    const { email, firstName, lastName, role, sendInvite = true } = request.body as any

    // Check tenant exists
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) {
      return reply.status(404).send({ error: 'Tenant not found' })
    }

    // Check if user already exists
    const existingUser = await prisma.tenantUser.findUnique({
      where: { tenantId_email: { tenantId, email } },
    })
    if (existingUser) {
      return reply.status(400).send({ error: 'User already exists in this tenant' })
    }

    // Create user with temporary password
    const bcrypt = await import('bcryptjs')
    const tempPassword = crypto.randomUUID()
    const passwordHash = await bcrypt.hash(tempPassword, 10)

    const user = await prisma.tenantUser.create({
      data: {
        tenantId,
        email,
        firstName,
        lastName,
        role: role || 'user',
        password: passwordHash,
        isActive: true,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    })

    // Create invitation for password reset
    if (sendInvite) {
      const token = crypto.randomUUID()
      const tokenHash = await bcrypt.hash(token, 10)

      await prisma.invitation.create({
        data: {
          tenantId,
          email,
          roleToAssign: role || 'user',
          tokenHash,
          invitedBy: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })

      // TODO: Send invitation email
    }

    return user
  })

  // PATCH /api/admin/tenants/:tenantId/users/:userId
  app.patch('/tenants/:tenantId/users/:userId', {
    preHandler: requirePermission(PermissionAction.USERS_UPDATE)
  }, async (request, reply) => {
    const { tenantId, userId } = request.params as { tenantId: string; userId: string }
    const data = request.body as any

    const user = await prisma.tenantUser.update({
      where: { id: userId, tenantId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    })

    return user
  })
// GET /api/admin/tenants/:tenantId/invitations
// =============================================================================
  // WAREHOUSES MANAGEMENT
  // =============================================================================

  // GET /api/admin/warehouses
  app.get('/warehouses', {
    preHandler: requirePermission(PermissionAction.WAREHOUSES_READ)
  }, async (request, reply) => {
    const { tenantId } = request.query as { tenantId?: string }

    const where = tenantId ? { tenantId } : {}

    const warehouses = await prisma.warehouse.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true } },
        _count: { select: { zones: true, locations: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { data: warehouses }
  })

  // POST /api/admin/warehouses
  app.post('/warehouses', {
    preHandler: requirePermission(PermissionAction.WAREHOUSES_CREATE)
  }, async (request, reply) => {
    const data = request.body as any

    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        code: data.code,
        addressLine1: data.addressLine1 || '',
        postalCode: data.postalCode || '',
        city: data.city || '',
        countryCode: data.countryCode || 'CH',
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        isActive: true,
      },
    })

    return warehouse
  })

  // GET /api/admin/warehouses/:id
  app.get('/warehouses/:id', {
    preHandler: requirePermission(PermissionAction.WAREHOUSES_READ)
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, name: true } },
        zones: {
          include: { _count: { select: { locations: true } } },
          orderBy: { code: 'asc' },
        },
        _count: { select: { locations: true } },
      },
    })

    if (!warehouse) {
      return reply.status(404).send({ error: 'Warehouse not found' })
    }

    return warehouse
  })

  // PATCH /api/admin/warehouses/:id
  app.patch('/warehouses/:id', {
    preHandler: requirePermission(PermissionAction.WAREHOUSES_UPDATE)
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = request.body as any

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data,
    })

    return warehouse
  })

  // =============================================================================
  // ZONES MANAGEMENT
  // =============================================================================

  // POST /api/admin/warehouses/:warehouseId/zones
  app.post('/warehouses/:warehouseId/zones', {
    preHandler: requirePermission(PermissionAction.ZONES_CREATE)
  }, async (request, reply) => {
    const { warehouseId } = request.params as { warehouseId: string }
    const { name, code, type } = request.body as any

    const zone = await prisma.warehouseZone.create({
      data: {
        warehouseId,
        name,
        code,
        type: type || 'general',
        isActive: true,
        isPickable: true,
      },
    })

    return zone
  })

  // PATCH /api/admin/zones/:id
  app.patch('/zones/:id', {
    preHandler: requirePermission(PermissionAction.ZONES_UPDATE)
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = request.body as any

    const zone = await prisma.warehouseZone.update({
      where: { id },
      data,
    })

    return zone
  })

  // DELETE /api/admin/zones/:id
  app.delete('/zones/:id', {
    preHandler: requirePermission(PermissionAction.ZONES_DELETE)
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    await prisma.warehouseZone.delete({ where: { id } })

    return { success: true }
  })

  // =============================================================================
  // LOCATIONS MANAGEMENT
  // =============================================================================

  // GET /api/admin/warehouses/:warehouseId/locations
  app.get('/warehouses/:warehouseId/locations', {
    preHandler: requirePermission(PermissionAction.LOCATIONS_READ)
  }, async (request, reply) => {
    const { warehouseId } = request.params as { warehouseId: string }
    const { zoneId, type, search } = request.query as any

    const where: any = { warehouseId }
    if (zoneId) where.zoneId = zoneId
    if (type) where.type = type
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ]
    }

    const locations = await prisma.location.findMany({
      where,
      include: { zone: { select: { id: true, name: true, code: true } } },
      orderBy: [{ zone: { code: 'asc' } }, { level: 'asc' }, { position: 'asc' }],
    })

    return { data: locations }
  })

// POST /api/admin/warehouses/:warehouseId/locations
  app.post('/warehouses/:warehouseId/locations', {
    preHandler: requirePermission(PermissionAction.LOCATIONS_CREATE)
  }, async (request, reply) => {
    const { warehouseId } = request.params as { warehouseId: string }
    const { 
      regalFrom, regalTo,
      ebeneFrom, ebeneTo,
      platzFrom, platzTo,
      type,
      maxWeightKg,
      lengthMm,
      widthMm,
      heightMm
    } = request.body as any

    const locations = []
    
    // Parse ranges
    const regalStart = parseInt(regalFrom) || 1
    const regalEnd = parseInt(regalTo) || regalStart
    const ebeneStart = parseInt(ebeneFrom) || 1
    const ebeneEnd = parseInt(ebeneTo) || ebeneStart
    const platzStart = parseInt(platzFrom) || 1
    const platzEnd = parseInt(platzTo) || platzStart

    // Create locations for all combinations
    for (let regal = regalStart; regal <= regalEnd; regal++) {
      for (let ebene = ebeneStart; ebene <= ebeneEnd; ebene++) {
        for (let platz = platzStart; platz <= platzEnd; platz++) {
          const regalStr = String(regal).padStart(2, '0')
          const ebeneStr = String(ebene).padStart(2, '0')
          const platzStr = String(platz).padStart(2, '0')
          
          const barcode = `A${regalStr}-${ebeneStr}-${platzStr}`
          const name = barcode

          try {
            const location = await prisma.location.create({
              data: {
                warehouseId,
                zoneId: null,
                name,
                barcode,
                type: type || 'shelf',
                aisle: `A${regalStr}`,
                level: ebeneStr,
                position: platzStr,
                maxWeight: maxWeightKg ? parseInt(maxWeightKg) : null,
                lengthMm: lengthMm ? parseInt(lengthMm) : null,
                widthMm: widthMm ? parseInt(widthMm) : null,
                heightMm: heightMm ? parseInt(heightMm) : null,
                isActive: true,
                isPickable: true,
              },
            })
            locations.push(location)
          } catch (e: any) {
            // Skip duplicates
            if (!e.message?.includes('Unique constraint')) {
              throw e
            }
          }
        }
      }
    }

    return { 
      data: locations, 
      count: locations.length,
      message: `${locations.length} Lagerplätze erstellt`
    }
  })

  // PATCH /api/admin/locations/:id
  app.patch('/locations/:id', {
    preHandler: requirePermission(PermissionAction.LOCATIONS_UPDATE)
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = request.body as any

    const location = await prisma.location.update({
      where: { id },
      data,
    })

    return location
  })

// DELETE /api/admin/locations/:id
  app.delete('/locations/:id', {
    preHandler: requirePermission(PermissionAction.LOCATIONS_DELETE)
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    // Check if location has inventory
    const inventoryCount = await prisma.inventory.count({
      where: { locationId: id, quantityOnHand: { gt: 0 } }
    })

    if (inventoryCount > 0) {
      return reply.status(400).send({ 
        error: 'Lagerplatz kann nicht gelöscht werden',
        message: 'Es sind noch Artikel auf diesem Lagerplatz eingebucht.'
      })
    }

    await prisma.location.delete({ where: { id } })
return { success: true }
  })
// =============================================================================
  // CARRIERS
  // =============================================================================

  // GET /api/admin/carriers
  app.get('/carriers', {
    preHandler: requirePermission(PermissionAction.TENANTS_READ)
  }, async (request, reply) => {
    const carriers = await prisma.carrier.findMany({
      include: {
        services: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    })

    return { data: carriers }
  })

  // GET /api/admin/carriers/:id
  app.get('/carriers/:id', {
    preHandler: requirePermission(PermissionAction.TENANTS_READ)
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const carrier = await prisma.carrier.findUnique({
      where: { id },
      include: {
        services: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!carrier) {
      return reply.status(404).send({ error: 'Carrier not found' })
    }

    return carrier
  })

  // PATCH /api/admin/carriers/:id
  app.patch('/carriers/:id', {
    preHandler: requirePermission(PermissionAction.TENANTS_UPDATE)
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = request.body as any

    const carrier = await prisma.carrier.update({
      where: { id },
      data
    })

    return carrier
  })

  // PATCH /api/admin/carrier-services/:id
  app.patch('/carrier-services/:id', {
    preHandler: requirePermission(PermissionAction.TENANTS_UPDATE)
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = request.body as any

    const service = await prisma.carrierService.update({
      where: { id },
      data
    })

    return service
  })
// =============================================================================
  // SHIPPER ADDRESSES
  // =============================================================================

  // GET /api/admin/shipper-addresses
  app.get('/shipper-addresses', {
    preHandler: requirePermission(PermissionAction.TENANTS_READ)
  }, async (request, reply) => {
    const { tenantId } = request.query as { tenantId?: string }

    const where = tenantId ? { tenantId } : {}

    const shippers = await prisma.shipperAddress.findMany({
      where,
      include: {
        tenant: { select: { id: true, name: true } }
      },
      orderBy: [{ tenant: { name: 'asc' } }, { isDefault: 'desc' }, { name: 'asc' }]
    })

    return { data: shippers }
  })

  // POST /api/admin/shipper-addresses
  app.post('/shipper-addresses', {
    preHandler: requirePermission(PermissionAction.TENANTS_UPDATE)
  }, async (request, reply) => {
    const data = request.body as any

    // If setting as default, unset other defaults for this tenant
    if (data.isDefault) {
      await prisma.shipperAddress.updateMany({
        where: { tenantId: data.tenantId, isDefault: true },
        data: { isDefault: false }
      })
    }

    const shipper = await prisma.shipperAddress.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        company: data.company || null,
        street: data.street,
        street2: data.street2 || null,
        zip: data.zip,
        city: data.city,
        countryCode: data.countryCode || 'CH',
        phone: data.phone || null,
        email: data.email || null,
        isDefault: data.isDefault || false,
        isActive: true,
      },
      include: {
        tenant: { select: { id: true, name: true } }
      }
    })

    return shipper
  })

  // PATCH /api/admin/shipper-addresses/:id
  app.patch('/shipper-addresses/:id', {
    preHandler: requirePermission(PermissionAction.TENANTS_UPDATE)
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = request.body as any

    // Get current shipper to find tenantId
    const current = await prisma.shipperAddress.findUnique({ where: { id } })
    if (!current) {
      return reply.status(404).send({ error: 'Shipper not found' })
    }

    // If setting as default, unset other defaults for this tenant
    if (data.isDefault) {
      await prisma.shipperAddress.updateMany({
        where: { tenantId: current.tenantId, isDefault: true, id: { not: id } },
        data: { isDefault: false }
      })
    }

    const shipper = await prisma.shipperAddress.update({
      where: { id },
      data: {
        name: data.name,
        company: data.company || null,
        street: data.street,
        street2: data.street2 || null,
        zip: data.zip,
        city: data.city,
        countryCode: data.countryCode,
        phone: data.phone || null,
        email: data.email || null,
        isDefault: data.isDefault,
      },
      include: {
        tenant: { select: { id: true, name: true } }
      }
    })

    return shipper
  })

  // DELETE /api/admin/shipper-addresses/:id
  app.delete('/shipper-addresses/:id', {
    preHandler: requirePermission(PermissionAction.TENANTS_UPDATE)
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    // Check if used in any store config
    const usedCount = await prisma.storeShipperConfig.count({
      where: { shipperAddressId: id }
    })

    if (usedCount > 0) {
      return reply.status(400).send({ 
        error: 'Absender wird noch verwendet',
        message: 'Dieser Absender ist noch einem Store zugewiesen.'
      })
    }

    await prisma.shipperAddress.delete({ where: { id } })

    return { success: true }
  })

}

export default adminRoutes
