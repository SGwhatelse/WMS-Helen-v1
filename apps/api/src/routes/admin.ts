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
}

export default adminRoutes
