import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '@wms/database'
import { requireAuth, requireRole } from '../middleware/auth.js'

const warehousesRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAuth)

  // GET /api/warehouses
  app.get('/', async (request) => {
    const warehouses = await prisma.warehouse.findMany({
      where: { tenantId: request.tenantId! },
      include: {
        zones: true,
        packStations: true,
        _count: { select: { locations: true } },
      },
      orderBy: { priority: 'desc' },
    })
    return warehouses
  })

  // GET /api/warehouses/:id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    
    const warehouse = await prisma.warehouse.findFirst({
      where: { id, tenantId: request.tenantId! },
      include: {
        zones: true,
        packStations: true,
        locations: { take: 100, orderBy: { pickSequence: 'asc' } },
      },
    })
    
    if (!warehouse) return reply.status(404).send({ error: 'Warehouse not found' })
    return warehouse
  })

  // GET /api/warehouses/:id/locations
  app.get('/:id/locations', async (request, reply) => {
    const { id } = request.params as { id: string }
    const query = z.object({
      zoneId: z.string().uuid().optional(),
      search: z.string().optional(),
    }).parse(request.query)
    
    const locations = await prisma.location.findMany({
      where: {
        warehouseId: id,
        ...(query.zoneId && { zoneId: query.zoneId }),
        ...(query.search && { name: { contains: query.search, mode: 'insensitive' } }),
      },
      include: { zone: true },
      orderBy: { pickSequence: 'asc' },
    })
    
    return locations
  })

  // POST /api/warehouses/:id/locations/:locationId/scan
  app.post('/:id/locations/:locationId/scan', async (request, reply) => {
    const { id, locationId } = request.params as { id: string; locationId: string }
    
    const location = await prisma.location.findFirst({
      where: { id: locationId, warehouseId: id },
      include: {
        inventory: {
          where: { quantityOnHand: { gt: 0 } },
          include: { product: { include: { barcodes: true } } },
          orderBy: [{ expiryDate: 'asc' }, { receivedAt: 'asc' }],
        },
      },
    })
    
    if (!location) return reply.status(404).send({ error: 'Location not found' })
    return location
  })
}

export default warehousesRoutes
