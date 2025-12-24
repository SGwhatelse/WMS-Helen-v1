import { prisma } from '@wms/database'
import { shopifyRequest } from './shopify.js'

// =============================================================================
// Fulfillment Service - Push fulfillment + tracking to Shopify
// =============================================================================

interface FulfillmentData {
  orderId: string
  trackingNumber: string
  trackingUrl?: string
  carrierName?: string
}

/**
 * Create fulfillment in Shopify when order is shipped
 */
export async function createShopifyFulfillment(data: FulfillmentData) {
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: {
      lines: true,
      carrier: true,
      shipments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })
  
  if (!order) {
    throw new Error('Order not found')
  }
  
  if (order.externalSource !== 'shopify' || !order.externalData) {
    // Not a Shopify order, skip
    return null
  }
  
  const externalData = order.externalData as any
  const shopifyOrderId = externalData.shopifyOrderId
  const shop = externalData.shop
  
  if (!shopifyOrderId || !shop) {
    throw new Error('Missing Shopify order data')
  }
  
  // Get integration credentials
  const integration = await prisma.integration.findFirst({
    where: {
      tenantId: order.tenantId,
      platform: 'shopify',
      isActive: true,
      credentials: { path: ['shop'], equals: shop },
    },
  })
  
  if (!integration) {
    throw new Error('Shopify integration not found')
  }
  
  const { accessToken } = integration.credentials as any
  
  // Get Logida fulfillment location
  const locations = await shopifyRequest(shop, accessToken, 'locations.json')
  const fulfillmentLocation = locations.locations.find(
    (loc: any) => loc.name === 'Logida - Fulfillment'
  )
  
  if (!fulfillmentLocation) {
    throw new Error('Fulfillment location not found')
  }
  
  // Get carrier tracking URL template
  const carrier = order.carrier
  let trackingUrl = data.trackingUrl
  
  if (!trackingUrl && carrier?.trackingUrl && data.trackingNumber) {
    trackingUrl = carrier.trackingUrl.replace('{tracking}', data.trackingNumber)
  }
  
  // Get fulfillment orders from Shopify
  const fulfillmentOrders = await shopifyRequest(
    shop, 
    accessToken, 
    `orders/${shopifyOrderId}/fulfillment_orders.json`
  )
  
  const fulfillmentOrder = fulfillmentOrders.fulfillment_orders?.[0]
  
  if (!fulfillmentOrder) {
    throw new Error('No fulfillment order found')
  }
  
  // Create fulfillment
  const fulfillmentPayload = {
    fulfillment: {
      line_items_by_fulfillment_order: [
        {
          fulfillment_order_id: fulfillmentOrder.id,
          fulfillment_order_line_items: fulfillmentOrder.line_items.map((item: any) => ({
            id: item.id,
            quantity: item.fulfillable_quantity,
          })),
        },
      ],
      tracking_info: {
        number: data.trackingNumber,
        url: trackingUrl,
        company: data.carrierName || carrier?.name || 'Carrier',
      },
      notify_customer: true,
    },
  }
  
  const result = await shopifyRequest(shop, accessToken, 'fulfillments.json', {
    method: 'POST',
    body: JSON.stringify(fulfillmentPayload),
  })
  
  // Update order with fulfillment ID
  await prisma.order.update({
    where: { id: order.id },
    data: {
      externalData: {
        ...externalData,
        shopifyFulfillmentId: result.fulfillment.id,
      },
    },
  })
  
  return result.fulfillment
}

/**
 * Update tracking info in Shopify
 */
export async function updateShopifyTracking(data: FulfillmentData) {
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { carrier: true },
  })
  
  if (!order || order.externalSource !== 'shopify') {
    return null
  }
  
  const externalData = order.externalData as any
  const shop = externalData.shop
  const fulfillmentId = externalData.shopifyFulfillmentId
  
  if (!fulfillmentId) {
    // No fulfillment yet, create one
    return createShopifyFulfillment(data)
  }
  
  const integration = await prisma.integration.findFirst({
    where: {
      tenantId: order.tenantId,
      platform: 'shopify',
      isActive: true,
      credentials: { path: ['shop'], equals: shop },
    },
  })
  
  if (!integration) {
    throw new Error('Shopify integration not found')
  }
  
  const { accessToken } = integration.credentials as any
  
  let trackingUrl = data.trackingUrl
  if (!trackingUrl && order.carrier?.trackingUrl && data.trackingNumber) {
    trackingUrl = order.carrier.trackingUrl.replace('{tracking}', data.trackingNumber)
  }
  
  // Update tracking
  const result = await shopifyRequest(
    shop, 
    accessToken, 
    `fulfillments/${fulfillmentId}/update_tracking.json`,
    {
      method: 'POST',
      body: JSON.stringify({
        fulfillment: {
          tracking_info: {
            number: data.trackingNumber,
            url: trackingUrl,
            company: data.carrierName || order.carrier?.name || 'Carrier',
          },
          notify_customer: true,
        },
      }),
    }
  )
  
  return result.fulfillment
}

/**
 * Sync product active status to Shopify
 */
export async function syncProductStatusToShopify(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  })
  
  if (!product || product.externalSource !== 'shopify') {
    return null
  }
  
  const externalData = product.externalData as any
  const shop = externalData?.shop
  const shopifyProductId = externalData?.shopifyProductId
  
  if (!shop || !shopifyProductId) {
    return null
  }
  
  const integration = await prisma.integration.findFirst({
    where: {
      tenantId: product.tenantId,
      platform: 'shopify',
      isActive: true,
      credentials: { path: ['shop'], equals: shop },
    },
  })
  
  if (!integration) {
    return null
  }
  
  const { accessToken } = integration.credentials as any
  
  // Update product status in Shopify
  const result = await shopifyRequest(shop, accessToken, `products/${shopifyProductId}.json`, {
    method: 'PUT',
    body: JSON.stringify({
      product: {
        id: shopifyProductId,
        status: product.isActive ? 'active' : 'draft',
      },
    }),
  })
  
  return result.product
}

/**
 * Update return status in Shopify (if supported)
 */
export async function updateReturnStatusInShopify(returnId: string, status: string) {
  const returnRecord = await prisma.return.findUnique({
    where: { id: returnId },
    include: { order: true },
  })
  
  if (!returnRecord || returnRecord.externalSource !== 'shopify') {
    return null
  }
  
  // Shopify doesn't have a direct return status API, but we can add notes
  // or use the return API if available in the shop's plan
  
  console.log(`Return ${returnRecord.returnNumber} status updated to ${status}`)
  
  return { success: true }
}
