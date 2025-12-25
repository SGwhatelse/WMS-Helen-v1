import type { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '@wms/database'
import { 
  getPlatformPermissions, 
  getTenantPermissions,
  PermissionAction 
} from '../services/permissions.js'

type PermissionActionType = typeof PermissionAction[keyof typeof PermissionAction]

declare module 'fastify' {
  interface FastifyRequest {
    tenantId: string | null
    userId: string | null
    userRole: string | null
    userType: 'platform' | 'tenant' | null
    permissions: PermissionActionType[]
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const token = request.cookies.wms_session

  if (!token) {
    return reply.status(401).send({ error: 'Authentication required' })
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

  if (!session.user.isActive || session.user.tenant.status !== 'active') {
    return reply.status(403).send({ error: 'Account suspended' })
  }

  request.tenantId = session.user.tenantId
  request.userId = session.user.id
  request.userRole = session.user.role
  request.userType = 'tenant'
  request.permissions = getTenantPermissions(session.user.role as any)
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(request, reply)
    if (!request.userRole || !roles.includes(request.userRole)) {
      return reply.status(403).send({ error: 'Insufficient permissions' })
    }
  }
}

export async function requirePlatformAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.cookies.wms_admin_id
  const token = request.cookies.wms_admin_session

  if (!userId || !token) {
    return reply.status(401).send({ error: 'Platform authentication required' })
  }

  const user = await prisma.platformUser.findUnique({
    where: { id: userId, isActive: true },
  })

  if (!user) {
    reply.clearCookie('wms_admin_session')
    reply.clearCookie('wms_admin_id')
    return reply.status(401).send({ error: 'Invalid session' })
  }

  request.tenantId = null
  request.userId = user.id
  request.userRole = user.role
  request.userType = 'platform'
  request.permissions = getPlatformPermissions(user.role as any)
}

export function requirePlatformRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requirePlatformAuth(request, reply)
    if (!request.userRole || !roles.includes(request.userRole)) {
      return reply.status(403).send({ error: 'Insufficient permissions' })
    }
  }
}

export function requirePermission(permission: PermissionActionType) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const adminId = request.cookies.wms_admin_id
    if (adminId) {
      await requirePlatformAuth(request, reply)
    } else {
      await requireAuth(request, reply)
    }

    if (!request.permissions?.includes(permission)) {
      return reply.status(403).send({ 
        error: 'Permission denied',
        required: permission 
      })
    }
  }
}

export { PermissionAction }

