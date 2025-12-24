import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { prisma } from '@wms/database'
import adminRoutes from './routes/admin.js'

// Routes
import authRoutes from './routes/auth.js'
import tenantsRoutes from './routes/tenants.js'
import productsRoutes from './routes/products.js'
import ordersRoutes from './routes/orders.js'
import warehousesRoutes from './routes/warehouses.js'
import inventoryRoutes from './routes/inventory.js'
import shopifyRoutes from './routes/shopify.js'
import shopifyWebhooksRoutes from './routes/shopify-webhooks.js'
import wrosRoutes from './routes/wros.js'

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    transport: process.env.NODE_ENV === 'development' 
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
})

// =============================================================================
// Plugins
// =============================================================================

await app.register(cors, {
  origin: process.env.APP_URL ?? 'http://localhost:3000',
  credentials: true,
})

await app.register(cookie, {
  secret: process.env.AUTH_SECRET,
  hook: 'onRequest',
})

await app.register(helmet)

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
})

// =============================================================================
// Decorators
// =============================================================================

// Add Prisma client to request
app.decorate('prisma', prisma)

// Add tenant context
app.decorateRequest('tenantId', null)
app.decorateRequest('userId', null)
app.decorateRequest('userRole', null)

// =============================================================================
// Health Check
// =============================================================================

app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

app.get('/health/db', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'ok', database: 'connected' }
  } catch (error) {
    return { status: 'error', database: 'disconnected' }
  }
})

// =============================================================================
// Routes
// =============================================================================

await app.register(authRoutes, { prefix: '/api/auth' })
await app.register(tenantsRoutes, { prefix: '/api/tenants' })
await app.register(productsRoutes, { prefix: '/api/products' })
await app.register(wrosRoutes, { prefix: '/api/wros' })
await app.register(ordersRoutes, { prefix: '/api/orders' })
await app.register(warehousesRoutes, { prefix: '/api/warehouses' })
await app.register(inventoryRoutes, { prefix: '/api/inventory' })
await app.register(shopifyRoutes, { prefix: '/api/shopify' })
await app.register(shopifyWebhooksRoutes, { prefix: '/api/shopify/webhooks' })
await app.register(adminRoutes, { prefix: '/api/admin' })

// =============================================================================
// Error Handler
// =============================================================================

app.setErrorHandler((error, request, reply) => {
  app.log.error(error)
  
  // Zod validation errors
  if (error.name === 'ZodError') {
    return reply.status(400).send({
      error: 'Validation Error',
      details: error.issues,
    })
  }
  
  // Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    if ((error as any).code === 'P2002') {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'A record with this value already exists',
      })
    }
    if ((error as any).code === 'P2025') {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Record not found',
      })
    }
  }
  
  // Default error
  const statusCode = error.statusCode ?? 500
  return reply.status(statusCode).send({
    error: error.name ?? 'Error',
    message: error.message ?? 'An unexpected error occurred',
  })
})

// =============================================================================
// Start Server
// =============================================================================

const port = parseInt(process.env.PORT ?? '3001', 10)
const host = process.env.HOST ?? '0.0.0.0'

try {
  await app.listen({ port, host })
  console.log(`
  🚀 WMS API Server running!
  
  Local:    http://localhost:${port}
  Health:   http://localhost:${port}/health
  
  `)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'] as const
for (const signal of signals) {
  process.on(signal, async () => {
    console.log(`\n${signal} received, shutting down...`)
    await app.close()
    await prisma.$disconnect()
    process.exit(0)
  })
}
