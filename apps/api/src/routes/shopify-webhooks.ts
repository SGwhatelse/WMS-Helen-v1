import type { FastifyPluginAsync } from 'fastify'
import { prisma } from '@wms/database'
import { verifyWebhookHmac, shopifyRequest, syncInventoryToShopify } from './shopify.js'

const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET || ''

// =============================================================================
// Webhook Routes
// =============================================================================

const shopifyWebhooksRoutes: FastifyPluginAsync = async (app) => {
  
  // Add raw body for webhook verification
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    try {
      const json = JSON.parse(body as string)
      ;(req as any).rawBody = body
      done(null, json)
    } catch (err: any) {
      done(err)
    }
  })

  // Verify webhook middleware
  app.addHook('preHandler', async (request, reply) => {
    const hmac = request.headers['x-shopify-hmac-sha256'] as string
    const rawBody = (request as any).rawBody as string
    
    if (!hmac || !rawBody) {
      return reply.status(401).send({ error: 'Missing HMAC' })
    }
    
    if (!verifyWebhookHmac(rawBody, hmac, SHOPIFY_CLIENT_SECRET)) {
      return reply.status(401).send({ error: 'Invalid HMAC' })
    }
  })

  // ---------------------------------------------------------------------------
  // POST /api/shopify/webhooks/orders/create
  // ---------------------------------------------------------------------------
  app.post('/orders/create', async (request, reply) => {
    const order = request.body as any
    const shop = request.headers['x-shopify-shop-domain'] as string
    
    console.log(`[Shopify Webhook] New order ${order.id} from ${shop}`)
    
    // Find integration
    const integration = await prisma.integration.findFirst({
      where: {
        platform: 'shopify',
        isActive: true,
        credentials: { path: ['shop'], equals: shop },
      },
    })
    
    if (!integration || !integration.syncOrders) {
      return reply.status(200).send({ message: 'Ignored - integration not found or sync disabled' })
    }
    
    const tenantId = integration.tenantId
    
    // Check if order already exists
    const existingOrder = await prisma.order.findFirst({
      where: {
        tenantId,
        externalOrderId: order.id.toString(),
        externalSource: 'shopify',
      },
    })
    
    if (existingOrder) {
      return reply.status(200).send({ message: 'Order already exists' })
    }
    
    // Find or create customer
    let customer = null
    if (order.customer) {
      customer = await prisma.customer.findFirst({
        where: { tenantId, email: order.customer.email },
      })
      
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            tenantId,
            email: order.customer.email,
            firstName: order.customer.first_name,
            lastName: order.customer.last_name,
            phone: order.customer.phone,
            externalId: order.customer.id.toString(),
            externalSource: 'shopify',
          },
        })
      }
    }
    
    // Get warehouse
    const warehouse = await prisma.warehouse.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { priority: 'desc' },
    })
    
    if (!warehouse) {
      console.error('No warehouse found for tenant', tenantId)
      return reply.status(200).send({ error: 'No warehouse' })
    }
    
    // Map shipping method
    const shippingLine = order.shipping_lines?.[0]
    let carrierServiceId = null
    let carrierId = null
    
    if (shippingLine) {
      const mapping = await prisma.shippingMethodMapping.findFirst({
        where: { tenantId, externalShippingMethod: shippingLine.title },
        include: { carrierService: true },
      })
      if (mapping) {
        carrierServiceId = mapping.carrierServiceId
        carrierId = mapping.carrierService.carrierId
      }
    }
    
    // Create order
    const shipping = order.shipping_address || {}
    const newOrder = await prisma.order.create({
      data: {
        tenantId,
        warehouseId: warehouse.id,
        customerId: customer?.id,
        carrierId,
        carrierServiceId,
        orderNumber: `SH-${order.order_number}`,
        externalOrderId: order.id.toString(),
        externalSource: 'shopify',
        externalData: { shopifyOrderId: order.id, shop },
        status: 'pending',
        priority: order.tags?.includes('priority') ? 10 : 5,
        orderPlacedAt: new Date(order.created_at),
        shippingName: `${shipping.first_name || ''} ${shipping.last_name || ''}`.trim(),
        shippingAddressLine1: shipping.address1,
        shippingAddressLine2: shipping.address2,
        shippingCity: shipping.city,
        shippingPostalCode: shipping.zip,
        shippingCountryCode: shipping.country_code,
        shippingPhone: shipping.phone,
        subtotalCents: Math.round(parseFloat(order.subtotal_price) * 100),
        shippingCents: Math.round(parseFloat(order.total_shipping_price_set?.shop_money?.amount || '0') * 100),
        taxCents: Math.round(parseFloat(order.total_tax) * 100),
        totalCents: Math.round(parseFloat(order.total_price) * 100),
        customerNote: order.note,
      },
    })
    
    // Create order lines
    for (const item of order.line_items) {
      const sku = item.sku || `SHOPIFY-${item.variant_id}`
      
      const product = await prisma.product.findFirst({
        where: { tenantId, sku },
      })
      
      await prisma.orderLine.create({
        data: {
          orderId: newOrder.id,
          productId: product?.id,
          sku,
          name: item.name,
          quantity: item.quantity,
          unitPriceCents: Math.round(parseFloat(item.price) * 100),
          externalLineId: item.id.toString(),
        },
      })
    }
    
    console.log(`[Shopify Webhook] Order ${newOrder.orderNumber} created`)
    
    return reply.status(200).send({ success: true, orderId: newOrder.id })
  })

  // ---------------------------------------------------------------------------
  // POST /api/shopify/webhooks/orders/updated
  // ---------------------------------------------------------------------------
  app.post('/orders/updated', async (request, reply) => {
    const order = request.body as any
    const shop = request.headers['x-shopify-shop-domain'] as string
    
    console.log(`[Shopify Webhook] Order updated ${order.id} from ${shop}`)
    
    // Find existing order
    const existingOrder = await prisma.order.findFirst({
      where: {
        externalOrderId: order.id.toString(),
        externalSource: 'shopify',
      },
    })
    
    if (!existingOrder) {
      return reply.status(200).send({ message: 'Order not found' })
    }
    
    // Update shipping address if changed
    const shipping = order.shipping_address || {}
    await prisma.order.update({
      where: { id: existingOrder.id },
      data: {
        shippingName: `${shipping.first_name || ''} ${shipping.last_name || ''}`.trim(),
        shippingAddressLine1: shipping.address1,
        shippingAddressLine2: shipping.address2,
        shippingCity: shipping.city,
        shippingPostalCode: shipping.zip,
        shippingCountryCode: shipping.country_code,
        shippingPhone: shipping.phone,
        customerNote: order.note,
      },
    })
    
    return reply.status(200).send({ success: true })
  })

  // ---------------------------------------------------------------------------
  // POST /api/shopify/webhooks/orders/cancelled
  // ---------------------------------------------------------------------------
  app.post('/orders/cancelled', async (request, reply) => {
    const order = request.body as any
    const shop = request.headers['x-shopify-shop-domain'] as string
    
    console.log(`[Shopify Webhook] Order cancelled ${order.id} from ${shop}`)
    
    const existingOrder = await prisma.order.findFirst({
      where: {
        externalOrderId: order.id.toString(),
        externalSource: 'shopify',
      },
    })
    
    if (!existingOrder) {
      return reply.status(200).send({ message: 'Order not found' })
    }
    
    // Only cancel if not already shipped
    if (!['shipped', 'delivered'].includes(existingOrder.status)) {
      await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: order.cancel_reason || 'Cancelled in Shopify',
        },
      })
    }
    
    return reply.status(200).send({ success: true })
  })

  // ---------------------------------------------------------------------------
  // POST /api/shopify/webhooks/products/create
  // ---------------------------------------------------------------------------
  app.post('/products/create', async (request, reply) => {
    const product = request.body as any
    const shop = request.headers['x-shopify-shop-domain'] as string
    
    console.log(`[Shopify Webhook] Product created ${product.id} from ${shop}`)
    
    const integration = await prisma.integration.findFirst({
      where: {
        platform: 'shopify',
        isActive: true,
        credentials: { path: ['shop'], equals: shop },
      },
    })
    
    if (!integration || !integration.syncProducts) {
      return reply.status(200).send({ message: 'Ignored' })
    }
    
    const tenantId = integration.tenantId
    
    for (const variant of product.variants) {
      const sku = variant.sku || `SHOPIFY-${variant.id}`
      
      const existingProduct = await prisma.product.findFirst({
        where: { tenantId, sku },
      })
      
      if (existingProduct) continue
      
      await prisma.product.create({
        data: {
          tenantId,
          sku,
          name: product.title + (variant.title !== 'Default Title' ? ` - ${variant.title}` : ''),
          description: product.body_html?.replace(/<[^>]*>/g, '') || null,
          weightGrams: variant.grams || null,
          priceCents: variant.price ? Math.round(parseFloat(variant.price) * 100) : null,
          isActive: product.status === 'active',
          externalId: variant.id.toString(),
          externalSource: 'shopify',
          externalData: {
            shopifyProductId: product.id,
            shopifyVariantId: variant.id,
            inventoryItemId: variant.inventory_item_id,
            shop,
          },
        },
      })
    }
    
    return reply.status(200).send({ success: true })
  })

  // ---------------------------------------------------------------------------
  // POST /api/shopify/webhooks/products/update
  // ---------------------------------------------------------------------------
  app.post('/products/update', async (request, reply) => {
    const product = request.body as any
    const shop = request.headers['x-shopify-shop-domain'] as string
    
    console.log(`[Shopify Webhook] Product updated ${product.id} from ${shop}`)
    
    const integration = await prisma.integration.findFirst({
      where: {
        platform: 'shopify',
        isActive: true,
        credentials: { path: ['shop'], equals: shop },
      },
    })
    
    if (!integration || !integration.syncProducts) {
      return reply.status(200).send({ message: 'Ignored' })
    }
    
    const tenantId = integration.tenantId
    
    for (const variant of product.variants) {
      const sku = variant.sku || `SHOPIFY-${variant.id}`
      
      const existingProduct = await prisma.product.findFirst({
        where: { tenantId, sku },
      })
      
      if (!existingProduct) continue
      
      // Sync active status bidirectionally
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          name: product.title + (variant.title !== 'Default Title' ? ` - ${variant.title}` : ''),
          description: product.body_html?.replace(/<[^>]*>/g, '') || null,
          weightGrams: variant.grams || null,
          priceCents: variant.price ? Math.round(parseFloat(variant.price) * 100) : null,
          isActive: product.status === 'active',
        },
      })
    }
    
    return reply.status(200).send({ success: true })
  })

  // ---------------------------------------------------------------------------
  // POST /api/shopify/webhooks/products/delete
  // ---------------------------------------------------------------------------
  app.post('/products/delete', async (request, reply) => {
    const { id } = request.body as { id: number }
    const shop = request.headers['x-shopify-shop-domain'] as string
    
    console.log(`[Shopify Webhook] Product deleted ${id} from ${shop}`)
    
    // Set products as inactive (don't delete, might have order history)
    await prisma.product.updateMany({
      where: {
        externalSource: 'shopify',
        externalData: { path: ['shopifyProductId'], equals: id },
      },
      data: { isActive: false },
    })
    
    return reply.status(200).send({ success: true })
  })

  // ---------------------------------------------------------------------------
  // POST /api/shopify/webhooks/refunds/create
  // ---------------------------------------------------------------------------
  app.post('/refunds/create', async (request, reply) => {
    const refund = request.body as any
    const shop = request.headers['x-shopify-shop-domain'] as string
    
    console.log(`[Shopify Webhook] Refund created for order ${refund.order_id} from ${shop}`)
    
    // Find the original order
    const order = await prisma.order.findFirst({
      where: {
        externalOrderId: refund.order_id.toString(),
        externalSource: 'shopify',
      },
      include: { lines: true },
    })
    
    if (!order) {
      return reply.status(200).send({ message: 'Order not found' })
    }
    
    // Check if return already exists
    const existingReturn = await prisma.return.findFirst({
      where: {
        orderId: order.id,
        externalId: refund.id.toString(),
      },
    })
    
    if (existingReturn) {
      return reply.status(200).send({ message: 'Return already exists' })
    }
    
    // Create return
    const returnRecord = await prisma.return.create({
      data: {
        tenantId: order.tenantId,
        orderId: order.id,
        customerId: order.customerId,
        returnNumber: `RET-${refund.id}`,
        externalId: refund.id.toString(),
        externalSource: 'shopify',
        status: 'pending',
        returnType: 'refund',
        reason: refund.note || 'Refund from Shopify',
        requestedAt: new Date(refund.created_at),
      },
    })
    
    // Create return lines
    for (const refundItem of refund.refund_line_items || []) {
      const orderLine = order.lines.find(
        l => l.externalLineId === refundItem.line_item_id.toString()
      )
      
      await prisma.returnLine.create({
        data: {
          returnId: returnRecord.id,
          orderLineId: orderLine?.id,
          productId: orderLine?.productId,
          sku: orderLine?.sku || 'UNKNOWN',
          name: orderLine?.name || 'Unknown Item',
          quantity: refundItem.quantity,
          reason: refundItem.restock_type === 'return' ? 'Customer Return' : 'Refund',
        },
      })
    }
    
    console.log(`[Shopify Webhook] Return ${returnRecord.returnNumber} created`)
    
    return reply.status(200).send({ success: true, returnId: returnRecord.id })
  })

  // ---------------------------------------------------------------------------
  // POST /api/shopify/webhooks/app/uninstalled
  // ---------------------------------------------------------------------------
  app.post('/app/uninstalled', async (request, reply) => {
    const shop = request.headers['x-shopify-shop-domain'] as string
    
    console.log(`[Shopify Webhook] App uninstalled from ${shop}`)
    
    // Deactivate integration
    await prisma.integration.updateMany({
      where: {
        platform: 'shopify',
        credentials: { path: ['shop'], equals: shop },
      },
      data: { isActive: false },
    })
    
    return reply.status(200).send({ success: true })
  })
}

export default shopifyWebhooksRoutes
