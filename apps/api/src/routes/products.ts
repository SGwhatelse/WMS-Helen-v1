import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '@wms/database'
import { requireAuth, requireRole } from '../middleware/auth.js'

// =============================================================================
// Schemas
// =============================================================================

const createProductSchema = z.object({
  sku: z.string().min(1).max(100),
  name: z.string().min(1).max(500),
  description: z.string().nullable().optional(),
  weightGrams: z.number().int().positive().nullable().optional(),
  lengthMm: z.number().int().positive().nullable().optional(),
  widthMm: z.number().int().positive().nullable().optional(),
  heightMm: z.number().int().positive().nullable().optional(),
  requiresLotTracking: z.boolean().optional(),
  requiresExpiryTracking: z.boolean().optional(),
  requiresSerialTracking: z.boolean().optional(),
  isHazmat: z.boolean().optional(),
  isActive: z.boolean().optional(),
  costCents: z.number().int().nonnegative().nullable().optional(),
  priceCents: z.number().int().nonnegative().nullable().optional(),
  reorderPoint: z.number().int().nonnegative().nullable().optional(),
  reorderQuantity: z.number().int().nonnegative().nullable().optional(),
  hsCode: z.string().max(20).nullable().optional(),
countryOrigin: z.union([z.string().length(2), z.literal('')]).nullable().optional(),
  barcodes: z.array(z.object({
    barcode: z.string().min(1).max(100),
    type: z.enum(['ean13', 'upc', 'internal', 'manufacturer', 'custom']).default('ean13'),
    isPrimary: z.boolean().default(false),
  })).optional(),
})

const updateProductSchema = createProductSchema.partial()

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  requiresLotTracking: z.coerce.boolean().optional(),
  requiresExpiryTracking: z.coerce.boolean().optional(),
})

// =============================================================================
// Routes
// =============================================================================

const productsRoutes: FastifyPluginAsync = async (app) => {
  // Auth required for all routes
  app.addHook('preHandler', requireAuth)

  // ---------------------------------------------------------------------------
  // GET /api/products
  // ---------------------------------------------------------------------------
  app.get('/', async (request) => {
    const query = querySchema.parse(request.query)
    const { page, limit, search, isActive, requiresLotTracking, requiresExpiryTracking } = query
    
    const where = {
      tenantId: request.tenantId!,
      ...(isActive !== undefined && { isActive }),
      ...(requiresLotTracking !== undefined && { requiresLotTracking }),
      ...(requiresExpiryTracking !== undefined && { requiresExpiryTracking }),
      ...(search && {
        OR: [
          { sku: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          barcodes: true,
          _count: { select: { inventory: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])
    
    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  })

  // ---------------------------------------------------------------------------
  // GET /api/products/:id
  // ---------------------------------------------------------------------------
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    
    const product = await prisma.product.findFirst({
      where: { id, tenantId: request.tenantId! },
      include: {
        barcodes: true,
        bundleComponents: {
          include: { component: true },
        },
        partOfBundles: {
          include: { bundle: true },
        },
      },
    })
    
    if (!product) {
      return reply.status(404).send({ error: 'Product not found' })
    }
    
    return product
  })

  // ---------------------------------------------------------------------------
  // POST /api/products
  // ---------------------------------------------------------------------------
  app.post('/', async (request, reply) => {
    const body = createProductSchema.parse(request.body)
    const { barcodes, ...productData } = body
    
    // Get tenant settings to validate tracking requirements
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: request.tenantId! },
    })
    
    if (!settings) {
      return reply.status(500).send({ error: 'Tenant settings not found' })
    }
    
    // Validate tracking settings against tenant settings
    if (body.requiresLotTracking && !settings.lotTrackingEnabled) {
      return reply.status(400).send({ 
        error: 'LOT tracking is not enabled for this tenant. Enable it in settings first.',
      })
    }
    if (body.requiresExpiryTracking && !settings.expiryTrackingEnabled) {
      return reply.status(400).send({ 
        error: 'Expiry tracking is not enabled for this tenant. Enable it in settings first.',
      })
    }
    if (body.requiresSerialTracking && !settings.serialTrackingEnabled) {
      return reply.status(400).send({ 
        error: 'Serial tracking is not enabled for this tenant. Enable it in settings first.',
      })
    }
    if (body.isHazmat && !settings.hazmatHandlingEnabled) {
      return reply.status(400).send({ 
        error: 'Hazmat handling is not enabled for this tenant. Enable it in settings first.',
      })
    }
    
    const product = await prisma.product.create({
      data: {
        tenantId: request.tenantId!,
        ...productData,
        barcodes: barcodes ? {
          create: barcodes,
        } : undefined,
      },
      include: { barcodes: true },
    })
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenantId,
        userId: request.userId,
        action: 'create',
        entityType: 'product',
        entityId: product.id,
        newValues: product as any,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      },
    })
    
    return reply.status(201).send(product)
  })

  // ---------------------------------------------------------------------------
  // PATCH /api/products/:id
  // ---------------------------------------------------------------------------
  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = updateProductSchema.parse(request.body)
    
    const existing = await prisma.product.findFirst({
      where: { id, tenantId: request.tenantId! },
    })
    
    if (!existing) {
      return reply.status(404).send({ error: 'Product not found' })
    }
    
    const { barcodes, ...productData } = body
    
    // Clean up empty strings to null
    const cleanedData: any = {}
    for (const [key, value] of Object.entries(productData)) {
      if (value === '' || value === undefined) {
        cleanedData[key] = null
      } else {
        cleanedData[key] = value
      }
    }
    
    const product = await prisma.product.update({
      where: { id },
      data: cleanedData,
      include: { barcodes: true },
    })
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenantId,
        userId: request.userId,
        action: 'update',
        entityType: 'product',
        entityId: product.id,
        oldValues: existing as any,
        newValues: product as any,
        ipAddress: request.ip,
      },
    })
    
    return product
  })

  // ---------------------------------------------------------------------------
  // DELETE /api/products/:id
  // ---------------------------------------------------------------------------
  app.delete('/:id', { preHandler: requireRole('owner', 'admin') }, async (request, reply) => {
    const { id } = request.params as { id: string }
    
    const existing = await prisma.product.findFirst({
      where: { id, tenantId: request.tenantId! },
    })
    
    if (!existing) {
      return reply.status(404).send({ error: 'Product not found' })
    }
    
    // Check if product has inventory
    const inventoryCount = await prisma.inventory.count({
      where: { productId: id, quantityOnHand: { gt: 0 } },
    })
    
    if (inventoryCount > 0) {
      return reply.status(400).send({ 
        error: 'Cannot delete product with existing inventory',
      })
    }
    
    // Soft delete by setting isActive to false
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    })
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenantId,
        userId: request.userId,
        action: 'delete',
        entityType: 'product',
        entityId: id,
        oldValues: existing as any,
        ipAddress: request.ip,
      },
    })
    
    return { success: true }
  })

  // ---------------------------------------------------------------------------
  // GET /api/products/:id/inventory
  // ---------------------------------------------------------------------------
  app.get('/:id/inventory', async (request, reply) => {
    const { id } = request.params as { id: string }
    
    const product = await prisma.product.findFirst({
      where: { id, tenantId: request.tenantId! },
    })
    
    if (!product) {
      return reply.status(404).send({ error: 'Product not found' })
    }
    
    const inventory = await prisma.inventory.findMany({
      where: { productId: id },
      include: {
        location: {
          include: { warehouse: true, zone: true },
        },
      },
      orderBy: [
        { expiryDate: 'asc' },
        { receivedAt: 'asc' },
      ],
    })
    
    // Calculate totals
    const totals = inventory.reduce((acc, inv) => ({
      onHand: acc.onHand + inv.quantityOnHand,
      reserved: acc.reserved + inv.quantityReserved,
      available: acc.available + (inv.quantityOnHand - inv.quantityReserved),
    }), { onHand: 0, reserved: 0, available: 0 })
    
    return { inventory, totals }
  })

  // ---------------------------------------------------------------------------
  // POST /api/products/:id/barcodes
  // ---------------------------------------------------------------------------
  app.post('/:id/barcodes', async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = z.object({
      barcode: z.string().min(1).max(100),
      type: z.enum(['ean13', 'upc', 'internal', 'manufacturer', 'custom']).default('ean13'),
      isPrimary: z.boolean().default(false),
    }).parse(request.body)
    
    const product = await prisma.product.findFirst({
      where: { id, tenantId: request.tenantId! },
    })
    
    if (!product) {
      return reply.status(404).send({ error: 'Product not found' })
    }
    
    // If setting as primary, unset other primaries
    if (body.isPrimary) {
      await prisma.productBarcode.updateMany({
        where: { productId: id },
        data: { isPrimary: false },
      })
    }
    
    const barcode = await prisma.productBarcode.create({
      data: { productId: id, ...body },
    })
    
    return reply.status(201).send(barcode)
  })

  // ---------------------------------------------------------------------------
  // POST /api/products/lookup
  // ---------------------------------------------------------------------------
  app.post('/lookup', async (request) => {
    const { barcode } = z.object({
      barcode: z.string().min(1),
    }).parse(request.body)
    
    const productBarcode = await prisma.productBarcode.findFirst({
      where: { barcode },
      include: {
        product: {
          include: { barcodes: true },
        },
      },
    })
    
    if (!productBarcode || productBarcode.product.tenantId !== request.tenantId) {
      return { found: false, product: null }
    }
    
    return { found: true, product: productBarcode.product }
  })
}

export default productsRoutes
