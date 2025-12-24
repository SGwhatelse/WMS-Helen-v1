import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '@wms/database'
import { requireAuth } from '../middleware/auth.js'

const tenantsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAuth)

  // GET /api/tenants/current - Get current tenant info
  app.get('/current', async (request) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: request.tenantId! },
      include: {
        settings: true,
        subscription: { include: { plan: true } },
        branding: true,
      },
    })
    return tenant
  })

  // GET /api/tenants/current/settings
  app.get('/current/settings', async (request) => {
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: request.tenantId! },
    })
    return settings
  })

  // PATCH /api/tenants/current/settings
  app.patch('/current/settings', async (request) => {
    const settings = await prisma.tenantSettings.update({
      where: { tenantId: request.tenantId! },
      data: request.body as any,
    })
    return settings
  })

  // GET /api/tenants/current/users
  app.get('/current/users', async (request) => {
    const users = await prisma.tenantUser.findMany({
      where: { tenantId: request.tenantId!, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    })
    return users.map(u => ({ ...u, password: undefined }))
  })
}

export default tenantsRoutes
