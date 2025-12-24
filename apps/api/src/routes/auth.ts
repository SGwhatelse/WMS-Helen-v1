import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { nanoid } from 'nanoid'
import { prisma } from '@wms/database'

// =============================================================================
// Schemas
// =============================================================================

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  companyName: z.string().min(1),
})

// =============================================================================
// Routes
// =============================================================================

const authRoutes: FastifyPluginAsync = async (app) => {
  // ---------------------------------------------------------------------------
  // POST /api/auth/login
  // ---------------------------------------------------------------------------
  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)
    
    // Find user
    const user = await prisma.tenantUser.findFirst({
      where: { email: body.email },
      include: { tenant: true },
    })
    
    if (!user || !user.isActive) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }
    
    // Verify password
    const valid = await bcrypt.compare(body.password, user.password)
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }
    
    // Check tenant status
    if (user.tenant.status !== 'active') {
      return reply.status(403).send({ error: 'Account suspended' })
    }
    
    // Create session
    const token = nanoid(32)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    
    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      },
    })
    
    // Update last login
    await prisma.tenantUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })
    
    // Set cookie
    reply.setCookie('wms_session', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })
    
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
      },
    }
  })
  
  // ---------------------------------------------------------------------------
  // POST /api/auth/register
  // ---------------------------------------------------------------------------
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body)
    
    // Check if email exists
    const existing = await prisma.tenantUser.findFirst({
      where: { email: body.email },
    })
    
    if (existing) {
      return reply.status(409).send({ error: 'Email already registered' })
    }
    
    // Get trial plan
    const trialPlan = await prisma.subscriptionPlan.findUnique({
      where: { slug: 'free-trial' },
    })
    
    if (!trialPlan) {
      return reply.status(500).send({ error: 'No trial plan configured' })
    }
    
    // Create slug from company name
    const slug = body.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    // Check slug uniqueness
    const existingTenant = await prisma.tenant.findUnique({ where: { slug } })
    const finalSlug = existingTenant ? `${slug}-${nanoid(6)}` : slug
    
    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 12)
    
    // Create tenant, settings, subscription, and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date()
      const trialEnd = new Date(now.getTime() + trialPlan.trialDays * 24 * 60 * 60 * 1000)
      
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: body.companyName,
          slug: finalSlug,
          status: 'active',
          contactEmail: body.email,
          companyName: body.companyName,
        },
      })
      
      // Create settings
      await tx.tenantSettings.create({
        data: { tenantId: tenant.id },
      })
      
      // Create subscription
      await tx.tenantSubscription.create({
        data: {
          tenantId: tenant.id,
          planId: trialPlan.id,
          status: 'trialing',
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
          trialEndsAt: trialEnd,
        },
      })
      
      // Create user
      const user = await tx.tenantUser.create({
        data: {
          tenantId: tenant.id,
          email: body.email,
          password: passwordHash,
          firstName: body.firstName,
          lastName: body.lastName,
          role: 'owner',
          emailVerified: false,
        },
      })
      
      return { tenant, user }
    })
    
    // Create session
    const token = nanoid(32)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    
    await prisma.userSession.create({
      data: {
        userId: result.user.id,
        token,
        expiresAt,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      },
    })
    
    reply.setCookie('wms_session', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    })
    
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
    }
  })
  
  // ---------------------------------------------------------------------------
  // GET /api/auth/me
  // ---------------------------------------------------------------------------
  app.get('/me', async (request, reply) => {
    const token = request.cookies.wms_session
    
    if (!token) {
      return reply.status(401).send({ error: 'Not authenticated' })
    }
    
    const session = await prisma.userSession.findUnique({
      where: { token },
      include: {
        user: {
          include: { tenant: true },
        },
      },
    })
    
    if (!session || session.expiresAt < new Date()) {
      reply.clearCookie('wms_session')
      return reply.status(401).send({ error: 'Session expired' })
    }
    
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        role: session.user.role,
      },
      tenant: {
        id: session.user.tenant.id,
        name: session.user.tenant.name,
        slug: session.user.tenant.slug,
      },
    }
  })
  
  // ---------------------------------------------------------------------------
  // POST /api/auth/logout
  // ---------------------------------------------------------------------------
  app.post('/logout', async (request, reply) => {
    const token = request.cookies.wms_session
    
    if (token) {
      await prisma.userSession.deleteMany({ where: { token } })
    }
    
    reply.clearCookie('wms_session')
    return { success: true }
  })
// =============================================================================
  // PLATFORM ADMIN AUTH
  // =============================================================================

  // POST /api/auth/admin/login
  app.post('/admin/login', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string }

    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password required' })
    }

    const user = await prisma.platformUser.findUnique({
      where: { email },
    })

    if (!user || !user.isActive) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const bcrypt = await import('bcryptjs')
    const valid = await bcrypt.compare(password, user.password)

    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    // Create session token
    const token = crypto.randomUUID()

    // Store in cookie (for platform users we use a different approach)
    reply.setCookie('wms_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    })

    // Update last login
    await prisma.platformUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Store token -> userId mapping (simple approach: in cookie value)
    // For production: use Redis or session table
    reply.setCookie('wms_admin_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    }
  })

  // POST /api/auth/admin/logout
  app.post('/admin/logout', async (request, reply) => {
    reply.clearCookie('wms_admin_session')
    reply.clearCookie('wms_admin_id')
    return { success: true }
  })

  // GET /api/auth/admin/me
  app.get('/admin/me', async (request, reply) => {
    const userId = request.cookies.wms_admin_id
    const token = request.cookies.wms_admin_session

    if (!userId || !token) {
      return reply.status(401).send({ error: 'Not authenticated' })
    }

    const user = await prisma.platformUser.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    })

    if (!user) {
      reply.clearCookie('wms_admin_session')
      reply.clearCookie('wms_admin_id')
      return reply.status(401).send({ error: 'User not found' })
    }

    return { user }
  })
}

export default authRoutes
