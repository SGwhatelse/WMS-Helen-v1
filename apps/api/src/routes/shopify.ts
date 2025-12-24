import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma } from '@wms/database'
import { requireAuth } from '../middleware/auth.js'
import crypto from 'crypto'

// =============================================================================
// Shopify Config
// =============================================================================

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID || 'ff56fb90627f2362ebbefeab2bae5636'
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET || ''
const APP_URL = process.env.APP_URL || 'http://localhost:3000'

const SHOPIFY_SCOPES = [
  'read_products',
  'write_products',
  'read_orders',
  'write_orders',
  'read_inventory',
  'write_inventory',
  'read_locations',
  'read_shipping',
  'read_returns',
  'write_returns',
  'read_fulfillments',
  'write_fulfillments',
].join(',')

// =============================================================================
// Helpers
// =============================================================================

function verifyHmac(query: Record<string, string>, secret: string): boolean {
  const { hmac, ...rest } = query
  const message = Object.keys(rest)
    .sort()
    .map(key => `${key}=${rest[key]}`)
    .join('&')
  const hash = crypto.createHmac('sha256', secret).update(message).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmac || ''))
}

function verifyWebhookHmac(body: string, hmac: string, secret: string): boolean {
  const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64')
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmac || ''))
}

async function shopifyRequest(shop: string, accessToken: string, endpoint: string, options: RequestInit = {}) {
  const url = `https://${shop}/admin/api/2024-01/${endpoint}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
      ...options.headers,
    },
  })
  
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Shopify API Error: ${res.status} - ${error}`)
  }
  
  return res.json()
}

// =============================================================================
// Routes
// =============================================================================

const shopifyRoutes: FastifyPluginAsync = async (app) => {
  
  // ---------------------------------------------------------------------------
  // GET /api/shopify/install - Start OAuth flow
  // ---------------------------------------------------------------------------
  app.get('/install', { preHandler: requireAuth }, async (request, reply) => {
    const { shop } = z.object({ shop: z.string() }).parse(request.query)
    
    // Validate shop domain
    if (!shop.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)) {
      return reply.status(400).send({ error: 'Invalid shop domain' })
    }
    
    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex')
    
    // Store state in session (simplified - should use proper session storage)
    // For now we include tenantId in state
    const stateData = `${state}:${request.tenantId}`
    
    const redirectUri = `${APP_URL}/api/shopify/callback`
    const installUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${SHOPIFY_CLIENT_ID}` +
      `&scope=${SHOPIFY_SCOPES}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${stateData}`
    
    return { installUrl }
  })

  // ---------------------------------------------------------------------------
  // GET /api/shopify/callback - OAuth callback
  // ---------------------------------------------------------------------------
  app.get('/callback', async (request, reply) => {
    const query = request.query as Record<string, string>
    const { shop, code, state, hmac } = query
    
    // Verify HMAC
    if (!verifyHmac(query, SHOPIFY_CLIENT_SECRET)) {
      return reply.status(400).send({ error: 'Invalid HMAC' })
    }
    
    // Extract tenantId from state
    const [, tenantId] = (state || '').split(':')
    if (!tenantId) {
      return reply.status(400).send({ error: 'Invalid state' })
    }
    
    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
        code,
      }),
    })
    
    if (!tokenResponse.ok) {
      return reply.status(400).send({ error: 'Failed to get access token' })
    }
    
    const { access_token } = await tokenResponse.json() as { access_token: string }
    
    // Get shop info
    const shopInfo = await shopifyRequest(shop, access_token, 'shop.json')
    
    // Create or update integration
    const existingIntegration = await prisma.integration.findFirst({
      where: {
        tenantId,
        platform: 'shopify',
        credentials: { path: ['shop'], equals: shop },
      },
    })
    
    const credentials = {
      shop,
      accessToken: access_token,
      shopName: shopInfo.shop.name,
      shopEmail: shopInfo.shop.email,
      shopDomain: shopInfo.shop.domain,
    }
    
    if (existingIntegration) {
      await prisma.integration.update({
        where: { id: existingIntegration.id },
        data: {
          credentials,
          isActive: true,
          lastError: null,
          errorCount: 0,
        },
      })
    } else {
      await prisma.integration.create({
        data: {
          tenantId,
          platform: 'shopify',
          name: shopInfo.shop.name,
          credentials,
          isActive: true,
          syncOrders: true,
          syncProducts: true,
          syncInventory: true,
          autoFulfill: true,
        },
      })
    }
    
    // Register webhooks
    await registerWebhooks(shop, access_token, tenantId)
    
    // Create "Logida - Fulfillment" location in Shopify
    await createFulfillmentLocation(shop, access_token)
    
    // Redirect back to app
    return reply.redirect(`${APP_URL}/dashboard/settings/integrations?success=shopify`)
  })

  // ---------------------------------------------------------------------------
  // GET /api/shopify/integrations - List Shopify integrations for tenant
  // ---------------------------------------------------------------------------
  app.get('/integrations', { preHandler: requireAuth }, async (request) => {
    const integrations = await prisma.integration.findMany({
      where: {
        tenantId: request.tenantId!,
        platform: 'shopify',
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        syncOrders: true,
        syncProducts: true,
        syncInventory: true,
        autoFulfill: true,
        lastOrderSyncAt: true,
        lastInventorySyncAt: true,
        lastError: true,
        lastErrorAt: true,
        createdAt: true,
        credentials: true,
      },
    })
    
    // Don't expose access token
    return integrations.map(i => ({
      ...i,
      credentials: {
        shop: (i.credentials as any).shop,
        shopName: (i.credentials as any).shopName,
        shopDomain: (i.credentials as any).shopDomain,
      },
    }))
  })

  // ---------------------------------------------------------------------------
  // PATCH /api/shopify/integrations/:id - Update integration settings
  // ---------------------------------------------------------------------------
  app.patch('/integrations/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const body = z.object({
      isActive: z.boolean().optional(),
      syncOrders: z.boolean().optional(),
      syncProducts: z.boolean().optional(),
      syncInventory: z.boolean().optional(),
      autoFulfill: z.boolean().optional(),
    }).parse(request.body)
    
    const integration = await prisma.integration.findFirst({
      where: { id, tenantId: request.tenantId!, platform: 'shopify' },
    })
    
    if (!integration) {
      return reply.status(404).send({ error: 'Integration not found' })
    }
    
    const updated = await prisma.integration.update({
      where: { id },
      data: body,
    })
    
    return updated
  })

  // ---------------------------------------------------------------------------
  // DELETE /api/shopify/integrations/:id - Disconnect shop
  // ---------------------------------------------------------------------------
  app.delete('/integrations/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }
    
    const integration = await prisma.integration.findFirst({
      where: { id, tenantId: request.tenantId!, platform: 'shopify' },
    })
    
    if (!integration) {
      return reply.status(404).send({ error: 'Integration not found' })
    }
    
    await prisma.integration.delete({ where: { id } })
    
    return { success: true }
  })

  // ---------------------------------------------------------------------------
  // POST /api/shopify/integrations/:id/sync/products - Manual product sync
  // ---------------------------------------------------------------------------
  app.post('/integrations/:id/sync/products', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }
    
    const integration = await prisma.integration.findFirst({
      where: { id, tenantId: request.tenantId!, platform: 'shopify' },
    })
    
    if (!integration) {
      return reply.status(404).send({ error: 'Integration not found' })
    }
    
    const { shop, accessToken } = integration.credentials as any
    
    try {
      await syncProducts(shop, accessToken, request.tenantId!)
      
      await prisma.integration.update({
        where: { id },
        data: { lastError: null, errorCount: 0 },
      })
      
      return { success: true, message: 'Product sync started' }
    } catch (error: any) {
      await prisma.integration.update({
        where: { id },
        data: {
          lastError: error.message,
          lastErrorAt: new Date(),
          errorCount: { increment: 1 },
        },
      })
      return reply.status(500).send({ error: error.message })
    }
  })

  // ---------------------------------------------------------------------------
  // POST /api/shopify/integrations/:id/sync/orders - Manual order sync
  // ---------------------------------------------------------------------------
  app.post('/integrations/:id/sync/orders', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }
    
    const integration = await prisma.integration.findFirst({
      where: { id, tenantId: request.tenantId!, platform: 'shopify' },
    })
    
    if (!integration) {
      return reply.status(404).send({ error: 'Integration not found' })
    }
    
    const { shop, accessToken } = integration.credentials as any
    
    try {
      const count = await syncOrders(shop, accessToken, request.tenantId!, integration.lastOrderSyncAt)
      
      await prisma.integration.update({
        where: { id },
        data: {
          lastOrderSyncAt: new Date(),
          lastError: null,
          errorCount: 0,
        },
      })
      
      return { success: true, message: `${count} orders synced` }
    } catch (error: any) {
      await prisma.integration.update({
        where: { id },
        data: {
          lastError: error.message,
          lastErrorAt: new Date(),
          errorCount: { increment: 1 },
        },
      })
      return reply.status(500).send({ error: error.message })
    }
  })

  // ---------------------------------------------------------------------------
  // POST /api/shopify/integrations/:id/sync/inventory - Push inventory to Shopify
  // ---------------------------------------------------------------------------
  app.post('/integrations/:id/sync/inventory', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }
    
    const integration = await prisma.integration.findFirst({
      where: { id, tenantId: request.tenantId!, platform: 'shopify' },
    })
    
    if (!integration) {
      return reply.status(404).send({ error: 'Integration not found' })
    }
    
    const { shop, accessToken } = integration.credentials as any
    
    try {
      const count = await syncInventoryToShopify(shop, accessToken, request.tenantId!)
      
      await prisma.integration.update({
        where: { id },
        data: {
          lastInventorySyncAt: new Date(),
          lastError: null,
          errorCount: 0,
        },
      })
      
      return { success: true, message: `${count} products inventory synced` }
    } catch (error: any) {
      await prisma.integration.update({
        where: { id },
        data: {
          lastError: error.message,
          lastErrorAt: new Date(),
          errorCount: { increment: 1 },
        },
      })
      return reply.status(500).send({ error: error.message })
    }
  })

  // ---------------------------------------------------------------------------
  // Shipping Method Mapping
  // ---------------------------------------------------------------------------
  app.get('/shipping-mappings', { preHandler: requireAuth }, async (request) => {
    const mappings = await prisma.shippingMethodMapping.findMany({
      where: { tenantId: request.tenantId! },
      include: { carrierService: { include: { carrier: true } } },
    })
    return mappings
  })

  app.post('/shipping-mappings', { preHandler: requireAuth }, async (request, reply) => {
    const body = z.object({
      integrationId: z.string().uuid(),
      externalShippingMethod: z.string(),
      carrierServiceId: z.string().uuid(),
    }).parse(request.body)
    
    const mapping = await prisma.shippingMethodMapping.create({
      data: {
        tenantId: request.tenantId!,
        integrationId: body.integrationId,
        externalShippingMethod: body.externalShippingMethod,
        carrierServiceId: body.carrierServiceId,
      },
      include: { carrierService: { include: { carrier: true } } },
    })
    
    return reply.status(201).send(mapping)
  })

  app.delete('/shipping-mappings/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string }
    
    await prisma.shippingMethodMapping.deleteMany({
      where: { id, tenantId: request.tenantId! },
    })
    
    return { success: true }
  })
}

// =============================================================================
// Webhook Registration
// =============================================================================

async function registerWebhooks(shop: string, accessToken: string, tenantId: string) {
  const webhooks = [
    { topic: 'orders/create', address: `${APP_URL}/api/shopify/webhooks/orders/create` },
    { topic: 'orders/updated', address: `${APP_URL}/api/shopify/webhooks/orders/updated` },
    { topic: 'orders/cancelled', address: `${APP_URL}/api/shopify/webhooks/orders/cancelled` },
    { topic: 'products/create', address: `${APP_URL}/api/shopify/webhooks/products/create` },
    { topic: 'products/update', address: `${APP_URL}/api/shopify/webhooks/products/update` },
    { topic: 'products/delete', address: `${APP_URL}/api/shopify/webhooks/products/delete` },
    { topic: 'refunds/create', address: `${APP_URL}/api/shopify/webhooks/refunds/create` },
    { topic: 'app/uninstalled', address: `${APP_URL}/api/shopify/webhooks/app/uninstalled` },
  ]
  
  for (const webhook of webhooks) {
    try {
      await shopifyRequest(shop, accessToken, 'webhooks.json', {
        method: 'POST',
        body: JSON.stringify({
          webhook: {
            topic: webhook.topic,
            address: webhook.address,
            format: 'json',
          },
        }),
      })
    } catch (error) {
      // Webhook might already exist
      console.log(`Webhook ${webhook.topic} might already exist`)
    }
  }
}

// =============================================================================
// Create Fulfillment Location
// =============================================================================

async function createFulfillmentLocation(shop: string, accessToken: string) {
  try {
    // First check if location already exists
    const locations = await shopifyRequest(shop, accessToken, 'locations.json')
    const existingLocation = locations.locations.find(
      (loc: any) => loc.name === 'Logida - Fulfillment'
    )
    
    if (existingLocation) {
      return existingLocation
    }
    
    // Create new location
    const newLocation = await shopifyRequest(shop, accessToken, 'locations.json', {
      method: 'POST',
      body: JSON.stringify({
        location: {
          name: 'Logida - Fulfillment',
          address1: 'Managed by WMS',
          city: 'Zürich',
          country: 'CH',
        },
      }),
    })
    
    return newLocation.location
  } catch (error) {
    console.error('Failed to create fulfillment location:', error)
  }
}

// =============================================================================
// Sync Functions
// =============================================================================

async function syncProducts(shop: string, accessToken: string, tenantId: string) {
  let pageInfo = null
  let hasMore = true
  
  while (hasMore) {
    const url = pageInfo
      ? `products.json?page_info=${pageInfo}&limit=250`
      : 'products.json?limit=250'
    
    const response = await shopifyRequest(shop, accessToken, url)
    const products = response.products
    
    for (const shopifyProduct of products) {
      for (const variant of shopifyProduct.variants) {
        const sku = variant.sku || `SHOPIFY-${variant.id}`
        
        // Find or create product
        const existingProduct = await prisma.product.findFirst({
          where: { tenantId, sku },
        })
        
        const productData = {
          name: shopifyProduct.title + (variant.title !== 'Default Title' ? ` - ${variant.title}` : ''),
          description: shopifyProduct.body_html?.replace(/<[^>]*>/g, '') || null,
          weightGrams: variant.grams || null,
          priceCents: variant.price ? Math.round(parseFloat(variant.price) * 100) : null,
          isActive: shopifyProduct.status === 'active',
          externalId: variant.id.toString(),
          externalSource: 'shopify',
          externalData: {
            shopifyProductId: shopifyProduct.id,
            shopifyVariantId: variant.id,
            inventoryItemId: variant.inventory_item_id,
            shop,
          },
        }
        
        if (existingProduct) {
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: productData,
          })
        } else {
          await prisma.product.create({
            data: {
              tenantId,
              sku,
              ...productData,
            },
          })
        }
      }
    }
    
    // Check for more pages (simplified - should use Link header)
    hasMore = products.length === 250
    pageInfo = null // Would need to parse Link header for proper pagination
  }
}

async function syncOrders(shop: string, accessToken: string, tenantId: string, since: Date | null) {
  const params = new URLSearchParams({
    status: 'any',
    limit: '250',
  })
  
  if (since) {
    params.set('created_at_min', since.toISOString())
  }
  
  const response = await shopifyRequest(shop, accessToken, `orders.json?${params}`)
  const orders = response.orders
  let count = 0
  
  for (const shopifyOrder of orders) {
    // Check if order already exists
    const existingOrder = await prisma.order.findFirst({
      where: {
        tenantId,
        externalOrderId: shopifyOrder.id.toString(),
        externalSource: 'shopify',
      },
    })
    
    if (existingOrder) continue
    
    // Find or create customer
    let customer = null
    if (shopifyOrder.customer) {
      customer = await prisma.customer.findFirst({
        where: {
          tenantId,
          email: shopifyOrder.customer.email,
        },
      })
      
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            tenantId,
            email: shopifyOrder.customer.email,
            firstName: shopifyOrder.customer.first_name,
            lastName: shopifyOrder.customer.last_name,
            phone: shopifyOrder.customer.phone,
            externalId: shopifyOrder.customer.id.toString(),
            externalSource: 'shopify',
          },
        })
      }
    }
    
    // Get warehouse (use first active warehouse)
    const warehouse = await prisma.warehouse.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { priority: 'desc' },
    })
    
    if (!warehouse) {
      console.error('No warehouse found for tenant', tenantId)
      continue
    }
    
    // Map shipping method
    const shippingLine = shopifyOrder.shipping_lines?.[0]
    let carrierServiceId = null
    
    if (shippingLine) {
      const mapping = await prisma.shippingMethodMapping.findFirst({
        where: {
          tenantId,
          externalShippingMethod: shippingLine.title,
        },
      })
      if (mapping) {
        carrierServiceId = mapping.carrierServiceId
      }
    }
    
    // Create order
    const shipping = shopifyOrder.shipping_address || {}
    const order = await prisma.order.create({
      data: {
        tenantId,
        warehouseId: warehouse.id,
        customerId: customer?.id,
        carrierServiceId,
        orderNumber: `SH-${shopifyOrder.order_number}`,
        externalOrderId: shopifyOrder.id.toString(),
        externalSource: 'shopify',
        externalData: {
          shopifyOrderId: shopifyOrder.id,
          shop,
        },
        status: 'pending',
        priority: shopifyOrder.tags?.includes('priority') ? 10 : 5,
        orderPlacedAt: new Date(shopifyOrder.created_at),
        shippingName: `${shipping.first_name || ''} ${shipping.last_name || ''}`.trim(),
        shippingAddressLine1: shipping.address1,
        shippingAddressLine2: shipping.address2,
        shippingCity: shipping.city,
        shippingPostalCode: shipping.zip,
        shippingCountryCode: shipping.country_code,
        shippingPhone: shipping.phone,
        subtotalCents: Math.round(parseFloat(shopifyOrder.subtotal_price) * 100),
        shippingCents: Math.round(parseFloat(shopifyOrder.total_shipping_price_set?.shop_money?.amount || '0') * 100),
        taxCents: Math.round(parseFloat(shopifyOrder.total_tax) * 100),
        totalCents: Math.round(parseFloat(shopifyOrder.total_price) * 100),
        customerNote: shopifyOrder.note,
      },
    })
    
    // Create order lines
    for (const item of shopifyOrder.line_items) {
      const sku = item.sku || `SHOPIFY-${item.variant_id}`
      
      // Find product
      const product = await prisma.product.findFirst({
        where: { tenantId, sku },
      })
      
      await prisma.orderLine.create({
        data: {
          orderId: order.id,
          productId: product?.id,
          sku,
          name: item.name,
          quantity: item.quantity,
          unitPriceCents: Math.round(parseFloat(item.price) * 100),
          externalLineId: item.id.toString(),
        },
      })
    }
    
    count++
  }
  
  return count
}

async function syncInventoryToShopify(shop: string, accessToken: string, tenantId: string) {
  // Get all products with Shopify external data
  const products = await prisma.product.findMany({
    where: {
      tenantId,
      externalSource: 'shopify',
      externalData: { not: null },
    },
    include: {
      inventory: {
        where: { status: 'available' },
      },
    },
  })
  
  // Get Logida - Fulfillment location ID
  const locations = await shopifyRequest(shop, accessToken, 'locations.json')
  const fulfillmentLocation = locations.locations.find(
    (loc: any) => loc.name === 'Logida - Fulfillment'
  )
  
  if (!fulfillmentLocation) {
    throw new Error('Fulfillment location not found in Shopify')
  }
  
  let count = 0
  
  for (const product of products) {
    const externalData = product.externalData as any
    if (!externalData?.inventoryItemId) continue
    
    // Calculate total available inventory
    const totalAvailable = product.inventory.reduce(
      (sum, inv) => sum + inv.quantityOnHand - inv.quantityReserved,
      0
    )
    
    // Update inventory in Shopify
    try {
      await shopifyRequest(shop, accessToken, 'inventory_levels/set.json', {
        method: 'POST',
        body: JSON.stringify({
          location_id: fulfillmentLocation.id,
          inventory_item_id: externalData.inventoryItemId,
          available: totalAvailable,
        }),
      })
      count++
    } catch (error) {
      console.error(`Failed to update inventory for ${product.sku}:`, error)
    }
  }
  
  return count
}

export default shopifyRoutes

// =============================================================================
// Export sync functions for use in webhooks
// =============================================================================

export {
  shopifyRequest,
  syncProducts,
  syncOrders,
  syncInventoryToShopify,
  verifyWebhookHmac,
}
