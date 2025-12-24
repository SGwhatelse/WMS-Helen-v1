import type { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '@wms/database'

declare module 'fastify' {
  interface FastifyRequest {
    tenantId: string | null
    userId: string | null
    userRole: string | null
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
  
  // Attach to request
  request.tenantId = session.user.tenantId
  request.userId = session.user.id
  request.userRole = session.user.role
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(request, reply)
    
    if (!request.userRole || !roles.includes(request.userRole)) {
      return reply.status(403).send({ error: 'Insufficient permissions' })
    }
  }
}

// Platform admin auth (separate from tenant auth)
export async function requirePlatformAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const token = request.cookies.wms_platform_session
  
  if (!token) {
    return reply.status(401).send({ error: 'Platform authentication required' })
  }
  
  // TODO: Implement platform user session lookup
  // For now, just return unauthorized
  return reply.status(401).send({ error: 'Not implemented' })
}
