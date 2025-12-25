
# Permissions & Rollen System (Admin-Spear)

## Übersicht

Das WMS verwendet ein RBAC-System (Role-Based Access Control) mit zwei User-Typen:
- **Platform Users** (Just3PL intern)
- **Tenant Users** (Kunden)

---

## Platform Rollen

| Rolle | Beschreibung | Kann Impersonieren |
|-------|--------------|-------------------|
| super_admin | Vollzugriff | Ja |
| admin | Admin ohne Impersonation | Nein |
| finance | Billing & Abrechnung | Nein |
| developer | Technischer Zugriff | Nein |
| packer | Pack-Station | Nein |
| picker | Pick-Station | Nein |

## Tenant Rollen

| Rolle | Beschreibung |
|-------|--------------|
| owner | Tenant-Besitzer, volle Rechte |
| admin | Tenant-Admin |
| manager | Lager-Manager |
| user | Standard-User |
| viewer | Nur Lesen |y
---

## Permissions (Actions)

### System
- `impersonate_user` - Als User agieren (nur super_admin)

### Users
- `users_read`, `users_create`, `users_update`, `users_delete`

### Tenants
- `tenants_read`, `tenants_create`, `tenants_update`, `tenants_delete`

### Products
- `products_read`, `products_create`, `products_update`, `products_delete`

### Orders
- `orders_read`, `orders_update`, `orders_delete`

### Inventory
- `inventory_read`, `inventory_adjust`

### Warehouses
- `warehouses_read`, `warehouses_create`, `warehouses_update`, `warehouses_delete`

### Zones & Locations
- `zones_read`, `zones_create`, `zones_update`, `zones_delete`
- `locations_read`, `locations_create`, `locations_update`, `locations_delete`

### Weitere
- `shipments_read`, `shipments_create`
- `returns_read`, `returns_update`
- `inventory_counts_read`, `inventory_counts_create`, `inventory_counts_update`
- `mhd_read`
- `billing_read`, `billing_manage`
- `wro_read`, `wro_create`, `wro_update`

---

## Verwendung im Code

### Route mit Permission schützen
```typescript
import { requirePermission, PermissionAction } from '../middleware/auth.js'

app.get('/products', {
  preHandler: requirePermission(PermissionAction.PRODUCTS_READ)
}, async (request, reply) => {
  // ...
})
```

### Route mit Rolle schützen
```typescript
import { requireRole, requirePlatformRole } from '../middleware/auth.js'

// Tenant-Route
app.post('/products', {
  preHandler: requireRole('owner', 'admin')
}, handler)

// Platform-Route
app.get('/admin/tenants', {
  preHandler: requirePlatformRole('super_admin', 'admin')
}, handler)
```

---

## Neue Permission hinzufügen

1. **Schema erweitern** (`packages/database/prisma/schema.prisma`):
```prisma
enum PermissionAction {
  // ... bestehende
  neue_action
}
```

2. **Permission Service** (`apps/api/src/services/permissions.ts`):
```typescript
export const PermissionAction = {
  // ... bestehende
  NEUE_ACTION: 'neue_action',
}

// Zu PLATFORM_PERMISSIONS oder TENANT_PERMISSIONS hinzufügen
```

3. **Migration**:
```bash
cd packages/database
pnpm prisma db push
```

---

## Test-Accounts

### Platform
| Email | Rolle | Passwort |
|-------|-------|----------|
| daniel@just3pl.com | super_admin | admin123! |
| admin@just3pl.ch | admin | test123! |
| support@just3pl.ch | support | test123! |
| finance@just3pl.ch | finance | test123! |

### Tenant
| Email | Rolle | Passwort |
|-------|-------|----------|
| demo@example.com | owner | demo123! |
