import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '@wms/database'
import { requireAuth } from '../middleware/auth.js'

const wrosRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/wros - List WROs
  app.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const { page = '1', limit = '20', search, status } = request.query as any
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)

    const where: any = { tenantId: request.tenantId }
    
    if (search) {
      where.wroNumber = { contains: search, mode: 'insensitive' }
    }
    if (status) {
      where.status = status
    }

    const [data, total] = await Promise.all([
      prisma.warehouseReceivingOrder.findMany({
        where,
        include: {
          warehouse: true,
          supplier: true,
          _count: { select: { lines: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.warehouseReceivingOrder.count({ where })
    ])

    // Stats
    const [awaiting, arrived, processing, thisWeek] = await Promise.all([
      prisma.warehouseReceivingOrder.count({ where: { tenantId: request.tenantId, status: 'awaiting' } }),
      prisma.warehouseReceivingOrder.count({ where: { tenantId: request.tenantId, status: 'arrived' } }),
      prisma.warehouseReceivingOrder.count({ where: { tenantId: request.tenantId, status: 'processing' } }),
      prisma.warehouseReceivingOrder.count({
        where: {
          tenantId: request.tenantId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),
    ])

    return {
      data,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      },
      stats: { awaiting, arrived, processing, thisWeek }
    }
  })

  // GET /api/wros/:id - Get single WRO
  app.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }

    const wro = await prisma.warehouseReceivingOrder.findFirst({
      where: { id, tenantId: request.tenantId },
      include: {
        warehouse: true,
        supplier: true,
        lines: { include: { product: true } },
        boxes: true,
      }
    })

    if (!wro) {
      return reply.status(404).send({ error: 'WRO not found' })
    }

    return wro
  })

  // POST /api/wros - Create WRO
  app.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const schema = z.object({
      deliveryNumber: z.string().min(1),
      shipmentType: z.enum(['parcel', 'pallet', 'mixed']),
      parcelCount: z.number().min(0),
      palletCount: z.number().min(0),
      expectedDate: z.string(),
      timeWindowStart: z.string().optional(),
      timeWindowEnd: z.string().optional(),
      lines: z.array(z.object({
        productId: z.string().optional(),
        sku: z.string(),
        name: z.string(),
        quantity: z.number().min(1),
      }))
    })

    const data = schema.parse(request.body)

    // Get default warehouse
    const warehouse = await prisma.warehouse.findFirst({
      where: { tenantId: request.tenantId }
    })

    if (!warehouse) {
      return reply.status(400).send({ error: 'No warehouse configured' })
    }

    // Generate WRO number
    const count = await prisma.warehouseReceivingOrder.count({
      where: { tenantId: request.tenantId }
    })
    const wroNumber = `WRO-${String(count + 1).padStart(6, '0')}`

    // Match products by SKU if productId not provided
    const linesWithProducts = await Promise.all(
      data.lines.map(async (line) => {
        let productId = line.productId
        if (!productId && line.sku) {
          const product = await prisma.product.findFirst({
            where: { tenantId: request.tenantId, sku: line.sku }
          })
          productId = product?.id
        }
        return {
          productId: productId || undefined,
          quantityExpected: line.quantity,
        }
      })
    )

    // Filter out lines without valid productId
    const validLines = linesWithProducts.filter(l => l.productId)

    const wro = await prisma.warehouseReceivingOrder.create({
      data: {
        tenantId: request.tenantId!,
        wroNumber,
        warehouseId: warehouse.id,
        status: 'awaiting',
        expectedArrivalDate: new Date(data.expectedDate),
        trackingNumbers: [data.deliveryNumber],
        expectedBoxCount: data.parcelCount + data.palletCount,
        notes: `Art: ${data.shipmentType}, Pakete: ${data.parcelCount}, Paletten: ${data.palletCount}, Zeitfenster: ${data.timeWindowStart || ''} - ${data.timeWindowEnd || ''}`,
        lines: {
          create: validLines.map(line => ({
            productId: line.productId!,
            quantityExpected: line.quantityExpected,
          }))
        }
      },
      include: {
        warehouse: true,
        lines: { include: { product: true } }
      }
    })

    return wro
  })

  // PATCH /api/wros/:id/status - Update WRO status
  app.patch('/:id/status', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status } = request.body as { status: string }

    const wro = await prisma.warehouseReceivingOrder.updateMany({
      where: { id, tenantId: request.tenantId },
      data: { 
        status: status as any,
        ...(status === 'arrived' ? { arrivedAt: new Date() } : {}),
        ...(status === 'completed' ? { completedAt: new Date() } : {}),
      }
    })

    return { success: true }
  })
}

export default wrosRoutes
