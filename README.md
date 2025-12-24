# WMS Platform

Ein modernes, multi-tenant Warehouse Management System (WMS) als SaaS-Plattform.

## Tech Stack

| Layer | Technologie |
|-------|-------------|
| **Monorepo** | pnpm Workspaces + Turborepo |
| **Backend** | Fastify (Node.js) |
| **Frontend** | Next.js 15 + React 19 |
| **Database** | PostgreSQL + Prisma ORM |
| **Styling** | Tailwind CSS |
| **State** | TanStack Query + Zustand |
| **Auth** | Custom Session-based |

## Projektstruktur

```
wms-platform/
├── apps/
│   ├── api/                 # Fastify Backend API
│   │   └── src/
│   │       ├── routes/      # API Endpoints
│   │       ├── middleware/  # Auth, Validation
│   │       └── services/    # Business Logic
│   │
│   └── web/                 # Next.js Frontend
│       └── app/
│           ├── auth/        # Login, Register
│           ├── dashboard/   # Main Application
│           └── components/  # UI Components
│
├── packages/
│   └── database/            # Prisma Schema + Client
│       ├── prisma/
│       │   └── schema.prisma
│       └── src/
│           ├── client.ts
│           └── seed.ts
│
├── .env.example
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Quick Start

### Voraussetzungen

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+

### Installation

```bash
# 1. Repository klonen
git clone <repo-url>
cd wms-platform

# 2. Dependencies installieren
pnpm install

# 3. Environment erstellen
cp .env.example .env.local

# 4. .env.local anpassen (DATABASE_URL, AUTH_SECRET)

# 5. Datenbank erstellen und Schema migrieren
pnpm db:push

# 6. Seed-Daten laden
pnpm db:seed

# 7. Development starten
pnpm dev
```

### URLs

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3001
- **Prisma Studio:** `pnpm db:studio`

### Demo-Zugangsdaten

| User | Email | Passwort |
|------|-------|----------|
| Platform Admin | admin@wms.local | admin123! |
| Demo Kunde | demo@example.com | demo123! |

## Features

### Bereits implementiert

- [x] Multi-Tenant Architektur mit Row-Level Security
- [x] Subscription Plans (Free Trial, Starter, Pro, Enterprise)
- [x] Feature Flags (Plan-basiert + Tenant-Einstellungen)
- [x] Auth (Login, Register, Sessions)
- [x] Products CRUD mit Barcode-Support
- [x] Inventory Management (Summary, Adjust, Transfer)
- [x] Order Management (List, Detail, Stats)
- [x] Warehouse & Location Management
- [x] Dashboard mit KPIs
- [x] Responsive Sidebar Navigation

### In Entwicklung

- [ ] Shopify Integration
- [ ] WRO (Warehouse Receiving Orders)
- [ ] Returns Management
- [ ] Inbox/Communication System
- [ ] Pack Station Interface
- [ ] Mobile WMS (PWA)
- [ ] CH-Post Label Generation

## API Endpoints

### Auth
```
POST /api/auth/login      # Login
POST /api/auth/register   # Register new tenant
GET  /api/auth/me         # Current user
POST /api/auth/logout     # Logout
```

### Products
```
GET    /api/products          # List products
GET    /api/products/:id      # Get product
POST   /api/products          # Create product
PATCH  /api/products/:id      # Update product
DELETE /api/products/:id      # Soft delete
GET    /api/products/:id/inventory  # Product inventory
POST   /api/products/lookup   # Lookup by barcode
```

### Orders
```
GET  /api/orders          # List orders
GET  /api/orders/:id      # Get order
GET  /api/orders/stats    # Order statistics
```

### Inventory
```
GET  /api/inventory           # List inventory
GET  /api/inventory/summary   # Inventory summary by product
GET  /api/inventory/expiring  # Expiring inventory
POST /api/inventory/adjust    # Adjust quantity
POST /api/inventory/transfer  # Transfer between locations
```

### Warehouses
```
GET  /api/warehouses              # List warehouses
GET  /api/warehouses/:id          # Get warehouse
GET  /api/warehouses/:id/locations # Get locations
```

## Tenant Feature Toggles

Dein Requirement: Features werden auf Tenant-Ebene aktiviert, dann pro Produkt gewählt.

```typescript
// In TenantSettings
lotTrackingEnabled: boolean      // LOT/Chargen
expiryTrackingEnabled: boolean   // MHD
serialTrackingEnabled: boolean   // Seriennummern
hazmatHandlingEnabled: boolean   // Gefahrgut

// Im Produkt (nur wenn Tenant-Setting aktiv)
requiresLotTracking: boolean
requiresExpiryTracking: boolean
requiresSerialTracking: boolean
isHazmat: boolean
```

Die API validiert automatisch:
```
❌ Produkt mit requiresLotTracking=true wenn Tenant lotTrackingEnabled=false
✅ Produkt mit requiresLotTracking=true wenn Tenant lotTrackingEnabled=true
```

## Commands

```bash
# Development
pnpm dev              # Start all apps
pnpm dev --filter @wms/api   # Only API
pnpm dev --filter @wms/web   # Only Web

# Database
pnpm db:generate      # Generate Prisma Client
pnpm db:push          # Push schema to DB (dev)
pnpm db:migrate       # Create migration (prod)
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed demo data

# Build
pnpm build            # Build all apps
pnpm clean            # Clean all
```

## Deployment

### Railway (Empfohlen)

1. Neues Projekt erstellen
2. PostgreSQL Service hinzufügen
3. Zwei Services aus GitHub:
   - **api**: Root Directory = `apps/api`, Start Command = `pnpm start`
   - **web**: Root Directory = `apps/web`, Start Command = `pnpm start`
4. Environment Variables setzen

### Vercel (Frontend only)

```bash
# Web App
vercel --cwd apps/web
```

## Nächste Schritte

1. **Shopify Integration** - OAuth Flow, Order Sync
2. **Pack Station** - Scan-to-pack, Label Generation
3. **Mobile PWA** - Offline Picking, Inventory Count
4. **CH-Post API** - Label Creation, Tracking

## Lizenz

Proprietär - Nur für internen Gebrauch
