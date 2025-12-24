import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '@wms/database'
import { requireAuth } from '../middleware/auth.js'

const inventoryRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAuth)

  // GET /api/inventory
  app.get('/', async (request) => {
    const query = z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(50),
      warehouseId: z.string().uuid().optional(),
      productId: z.string().uuid().optional(),
      status: z.enum(['available', 'reserved', 'quarantine', 'damaged', 'expired']).optional(),
      lowStock: z.coerce.boolean().optional(),
    }).parse(request.query)
    
    // Build where clause
    const where: any = { tenantId: request.tenantId! }
    if (query.warehouseId) {
      where.location = { warehouseId: query.warehouseId }
    }
    if (query.productId) where.productId = query.productId
    if (query.status) where.status = query.status
    
    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          product: { include: { barcodes: { where: { isPrimary: true } } } },
          location: { include: { warehouse: true, zone: true } },
        },
        orderBy: [{ expiryDate: 'asc' }, { receivedAt: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.inventory.count({ where }),
    ])
    
    return {
      data: inventory,
      meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    }
  })

  // GET /api/inventory/summary
  app.get('/summary', async (request) => {
    const query = z.object({
      warehouseId: z.string().uuid().optional(),
    }).parse(request.query)
    
    // Get inventory summary per product
    const products = await prisma.product.findMany({
      where: { tenantId: request.tenantId!, isActive: true },
      include: {
        inventory: {
          where: query.warehouseId ? { location: { warehouseId: query.warehouseId } } : undefined,
        },
      },
    })
    
    const summary = products.map(product => {
      const onHand = product.inventory.reduce((sum, inv) => sum + inv.quantityOnHand, 0)
      const reserved = product.inventory.reduce((sum, inv) => sum + inv.quantityReserved, 0)
      const available = onHand - reserved
      const isLowStock = product.reorderPoint ? available <= product.reorderPoint : false
      
      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        onHand,
        reserved,
        available,
        reorderPoint: product.reorderPoint,
        isLowStock,
      }
    })
    
    return {
      products: summary,
      totals: {
        totalProducts: summary.length,
        lowStockCount: summary.filter(s => s.isLowStock).length,
        outOfStockCount: summary.filter(s => s.available <= 0).length,
      },
    }
  })

  // GET /api/inventory/expiring
  app.get('/expiring', async (request) => {
    const query = z.object({
      days: z.coerce.number().int().positive().default(30),
    }).parse(request.query)
    
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + query.days)
    
    const expiring = await prisma.inventory.findMany({
      where: {
        tenantId: request.tenantId!,
        expiryDate: { lte: futureDate },
        quantityOnHand: { gt: 0 },
      },
      include: {
        product: true,
        location: { include: { warehouse: true } },
      },
      orderBy: { expiryDate: 'asc' },
    })
    
    return expiring
  })

  // POST /api/inventory/adjust
  app.post('/adjust', async (request, reply) => {
    const body = z.object({
      inventoryId: z.string().uuid(),
      quantity: z.number().int(),
      reason: z.string().min(1),
    }).parse(request.body)
    
    const inventory = await prisma.inventory.findFirst({
      where: { id: body.inventoryId, tenantId: request.tenantId! },
    })
    
    if (!inventory) return reply.status(404).send({ error: 'Inventory not found' })
    
    const newQuantity = inventory.quantityOnHand + body.quantity
    if (newQuantity < 0) {
      return reply.status(400).send({ error: 'Cannot adjust below zero' })
    }
    
    const updated = await prisma.$transaction(async (tx) => {
      // Update inventory
      const inv = await tx.inventory.update({
        where: { id: body.inventoryId },
        data: { quantityOnHand: newQuantity },
      })
      
      // Create transaction record
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: body.inventoryId,
          type: body.quantity > 0 ? 'adjust_in' : 'adjust_out',
          quantity: Math.abs(body.quantity),
          notes: body.reason,
          createdBy: request.userId,
        },
      })
      
      return inv
    })
    
    return updated
  })

  // POST /api/inventory/transfer
  app.post('/transfer', async (request, reply) => {
    const body = z.object({
      inventoryId: z.string().uuid(),
      toLocationId: z.string().uuid(),
      quantity: z.number().int().positive(),
    }).parse(request.body)
    
    const inventory = await prisma.inventory.findFirst({
      where: { id: body.inventoryId, tenantId: request.tenantId! },
      include: { location: true },
    })
    
    if (!inventory) return reply.status(404).send({ error: 'Inventory not found' })
    
    const available = inventory.quantityOnHand - inventory.quantityReserved
    if (body.quantity > available) {
      return reply.status(400).send({ error: 'Insufficient available quantity' })
    }
    
    const toLocation = await prisma.location.findUnique({
      where: { id: body.toLocationId },
    })
    
    if (!toLocation || toLocation.warehouseId !== inventory.location.warehouseId) {
      return reply.status(400).send({ error: 'Invalid destination location' })
    }
    
    // Perform transfer in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Reduce from source
      await tx.inventory.update({
        where: { id: body.inventoryId },
        data: { quantityOnHand: { decrement: body.quantity } },
      })
      
      // Find or create at destination
      const existing = await tx.inventory.findFirst({
        where: {
          productId: inventory.productId,
          locationId: body.toLocationId,
          lotNumber: inventory.lotNumber,
          expiryDate: inventory.expiryDate,
        },
      })
      
      if (existing) {
        await tx.inventory.update({
          where: { id: existing.id },
          data: { quantityOnHand: { increment: body.quantity } },
        })
      } else {
        await tx.inventory.create({
          data: {
            tenantId: request.tenantId!,
            productId: inventory.productId,
            warehouseId: inventory.location.warehouseId,
            locationId: body.toLocationId,
            lotNumber: inventory.lotNumber,
            expiryDate: inventory.expiryDate,
            quantityOnHand: body.quantity,
            status: 'available',
          },
        })
      }
      
      // Log transfer
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: body.inventoryId,
          type: 'transfer',
          quantity: body.quantity,
          notes: `Transferred to ${toLocation.name}`,
          createdBy: request.userId,
        },
      })
      
      return { success: true }
    })
    
    return result
  })
}

export default inventoryRoutes
