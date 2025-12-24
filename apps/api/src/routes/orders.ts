import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '@wms/database'
import { requireAuth } from '../middleware/auth.js'

const ordersRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAuth)

  // GET /api/orders
  app.get('/', async (request) => {
    const query = z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
      status: z.string().optional(),
      search: z.string().optional(),
    }).parse(request.query)
    
    const where = {
      tenantId: request.tenantId!,
      ...(query.status && { status: query.status as any }),
      ...(query.search && {
        OR: [
          { orderNumber: { contains: query.search, mode: 'insensitive' as const } },
          { externalOrderId: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    }
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          lines: true,
          customer: true,
          warehouse: true,
          _count: { select: { shipments: true } },
        },
        orderBy: { orderPlacedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.order.count({ where }),
    ])
    
    return {
      data: orders,
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    }
  })

  // GET /api/orders/:id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    
    const order = await prisma.order.findFirst({
      where: { id, tenantId: request.tenantId! },
      include: {
        lines: { include: { product: true, allocations: true } },
        customer: true,
        warehouse: true,
        shipments: { include: { items: true } },
        carrier: true,
        carrierService: true,
      },
    })
    
    if (!order) return reply.status(404).send({ error: 'Order not found' })
    return order
  })

  // GET /api/orders/stats
  app.get('/stats', async (request) => {
    const statuses = ['pending', 'processing', 'picking', 'packing', 'shipped', 'exception']
    const counts = await Promise.all(
      statuses.map(status => 
        prisma.order.count({ where: { tenantId: request.tenantId!, status: status as any } })
      )
    )
    return Object.fromEntries(statuses.map((s, i) => [s, counts[i]]))
  })
}

export default ordersRoutes
