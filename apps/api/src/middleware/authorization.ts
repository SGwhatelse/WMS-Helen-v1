import type { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '@wms/database'
import {
  PermissionAction,
  getPlatformPermissions,
  getTenantPermissions,
  hasPermission,
} from '../services/permissions.js'
import type { PlatformRole, TenantRole } from '../services/permissions.js'

type PermissionActionType = typeof PermissionAction[keyof typeof PermissionAction]
// =============================================================================
// TYPES
// =============================================================================

export type UserContext = {
  type: 'platform' | 'tenant'
  userId: string
  role: string
  tenantId: string | null
  permissions: PermissionActionType[]
  isImpersonating: boolean
  originalUserId: string | null
}

declare module 'fastify' {
  interface FastifyRequest {
    userContext: UserContext | null
  }
}

// =============================================================================
// LOAD USER CONTEXT
// =============================================================================

export async function loadUserContext(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Try Platform User first (admin cookies)
  const adminId = request.cookies.wms_admin_id
  const adminSession = request.cookies.wms_admin_session

  if (adminId && adminSession) {
    const platformUser = await prisma.platformUser.findUnique({
      where: { id: adminId, isActive: true },
    })

    if (platformUser) {
      const permissions = getPlatformPermissions(platformUser.role as PlatformRole)
      request.userContext = {
        type: 'platform',
        userId: platformUser.id,
        role: platformUser.role,
        tenantId: null,
        permissions,
        isImpersonating: false,
        originalUserId: null,
      }
      return
    }
  }

  // Try Tenant User
  const token = request.cookies.wms_session

  if (!token) {
    request.userContext = null
    return
  }
  // Try Tenant User
  const session = await prisma.userSession.findUnique({
    where: { token },
    include: { user: true },
  })

  if (session && session.expiresAt > new Date() && session.user.isActive) {
    const permissions = getTenantPermissions(session.user.role as TenantRole)
    request.userContext = {
      type: 'tenant',
      userId: session.user.id,
      role: session.user.role,
      tenantId: session.user.tenantId,
      permissions,
      isImpersonating: false,
      originalUserId: null,
    }
    return
  }

  request.userContext = null
}

// =============================================================================
// REQUIRE AUTH (any authenticated user)
// =============================================================================

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await loadUserContext(request, reply)
  
  if (!request.userContext) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
}

// =============================================================================
// REQUIRE PLATFORM USER
// =============================================================================

export async function requirePlatformUser(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await loadUserContext(request, reply)
  
  if (!request.userContext || request.userContext.type !== 'platform') {
    return reply.status(403).send({ error: 'Platform access required' })
  }
}

// =============================================================================
// REQUIRE PERMISSION
// =============================================================================

export function requirePermission(permission: PermissionActionType) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    await loadUserContext(request, reply)
    
    if (!request.userContext) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
    
    if (!hasPermission(request.userContext.permissions, permission)) {
      return reply.status(403).send({ 
        error: 'Permission denied',
        required: permission,
      })
    }
  }
}

// =============================================================================
// REQUIRE ANY PERMISSION
// =============================================================================

export function requireAnyPermission(permissions: PermissionActionType[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    await loadUserContext(request, reply)
    
    if (!request.userContext) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
    
    const hasAny = permissions.some(p => 
      hasPermission(request.userContext!.permissions, p)
    )
    
    if (!hasAny) {
      return reply.status(403).send({ 
        error: 'Permission denied',
        requiredAny: permissions,
      })
    }
  }
}

// =============================================================================
// REQUIRE TENANT ACCESS
// =============================================================================

export function requireTenantAccess(getTenantId: (request: FastifyRequest) => string | null) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    await loadUserContext(request, reply)
    
    if (!request.userContext) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
    
    // Platform users can access any tenant
    if (request.userContext.type === 'platform') {
      return
    }
    
    // Tenant users can only access their own tenant
    const requestedTenantId = getTenantId(request)
    if (requestedTenantId && requestedTenantId !== request.userContext.tenantId) {
      return reply.status(403).send({ error: 'Tenant access denied' })
    }
  }
}

// =============================================================================
// COMBINED: PERMISSION + TENANT ACCESS
// =============================================================================

export function requirePermissionAndTenant(
  permission: PermissionActionType,
  getTenantId: (request: FastifyRequest) => string | null
) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    await loadUserContext(request, reply)
    
    if (!request.userContext) {
      return reply.status(401).send({ error: 'Unauthorized' })
    }
    
    // Check permission
    if (!hasPermission(request.userContext.permissions, permission)) {
      return reply.status(403).send({ 
        error: 'Permission denied',
        required: permission,
      })
    }
    
    // Platform users can access any tenant
    if (request.userContext.type === 'platform') {
      return
    }
    
    // Tenant users can only access their own tenant
    const requestedTenantId = getTenantId(request)
    if (requestedTenantId && requestedTenantId !== request.userContext.tenantId) {
      return reply.status(403).send({ error: 'Tenant access denied' })
    }
  }
}

// =============================================================================
// EXPORT PERMISSION ACTIONS FOR ROUTES
// =============================================================================

export { PermissionAction }
