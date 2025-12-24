// =============================================================================
// PERMISSIONS & ROLE MAPPING
// =============================================================================

export const PermissionAction = {
  // System
  IMPERSONATE_USER: 'impersonate_user',
  
  // Users
  USERS_READ: 'users_read',
  USERS_CREATE: 'users_create',
  USERS_UPDATE: 'users_update',
  USERS_DELETE: 'users_delete',
  
  // Tenants
  TENANTS_READ: 'tenants_read',
  TENANTS_CREATE: 'tenants_create',
  TENANTS_UPDATE: 'tenants_update',
  TENANTS_DELETE: 'tenants_delete',
  
  // Products
  PRODUCTS_READ: 'products_read',
  PRODUCTS_CREATE: 'products_create',
  PRODUCTS_UPDATE: 'products_update',
  PRODUCTS_DELETE: 'products_delete',
  
  // Orders
  ORDERS_READ: 'orders_read',
  ORDERS_UPDATE: 'orders_update',
  ORDERS_DELETE: 'orders_delete',
  
  // Inventory
  INVENTORY_READ: 'inventory_read',
  INVENTORY_ADJUST: 'inventory_adjust',
  
  // Warehouses
  WAREHOUSES_READ: 'warehouses_read',
  WAREHOUSES_CREATE: 'warehouses_create',
  WAREHOUSES_UPDATE: 'warehouses_update',
  WAREHOUSES_DELETE: 'warehouses_delete',
  
  // Zones
  ZONES_READ: 'zones_read',
  ZONES_CREATE: 'zones_create',
  ZONES_UPDATE: 'zones_update',
  ZONES_DELETE: 'zones_delete',
  
  // Locations
  LOCATIONS_READ: 'locations_read',
  LOCATIONS_CREATE: 'locations_create',
  LOCATIONS_UPDATE: 'locations_update',
  LOCATIONS_DELETE: 'locations_delete',
  
  // Shipments
  SHIPMENTS_READ: 'shipments_read',
  SHIPMENTS_CREATE: 'shipments_create',
  
  // Returns
  RETURNS_READ: 'returns_read',
  RETURNS_UPDATE: 'returns_update',
  
  // Inventory Counts
  INVENTORY_COUNTS_READ: 'inventory_counts_read',
  INVENTORY_COUNTS_CREATE: 'inventory_counts_create',
  INVENTORY_COUNTS_UPDATE: 'inventory_counts_update',
  
  // MHD
  MHD_READ: 'mhd_read',
  
  // Billing
  BILLING_READ: 'billing_read',
  BILLING_MANAGE: 'billing_manage',
  
  // WRO
  WRO_READ: 'wro_read',
  WRO_CREATE: 'wro_create',
  WRO_UPDATE: 'wro_update',
} as const

export type PermissionActionType = typeof PermissionAction[keyof typeof PermissionAction]

// =============================================================================
// PLATFORM ROLE PERMISSIONS (Operator/Just3PL)
// =============================================================================

const ALL_PERMISSIONS = Object.values(PermissionAction)

const PLATFORM_PERMISSIONS = {
  super_admin: ALL_PERMISSIONS,
  
  admin: ALL_PERMISSIONS.filter(p => p !== PermissionAction.IMPERSONATE_USER),
  
  support: [
    PermissionAction.TENANTS_READ,
    PermissionAction.USERS_READ,
    PermissionAction.PRODUCTS_READ,
    PermissionAction.ORDERS_READ,
    PermissionAction.INVENTORY_READ,
    PermissionAction.WAREHOUSES_READ,
    PermissionAction.ZONES_READ,
    PermissionAction.LOCATIONS_READ,
    PermissionAction.SHIPMENTS_READ,
    PermissionAction.RETURNS_READ,
    PermissionAction.WRO_READ,
    PermissionAction.INVENTORY_COUNTS_READ,
    PermissionAction.MHD_READ,
    PermissionAction.BILLING_READ,
  ],
  
  finance: [
    PermissionAction.TENANTS_READ,
    PermissionAction.BILLING_READ,
    PermissionAction.BILLING_MANAGE,
    PermissionAction.ORDERS_READ,
  ],
  
  developer: [
    PermissionAction.TENANTS_READ,
    PermissionAction.USERS_READ,
    PermissionAction.PRODUCTS_READ,
    PermissionAction.ORDERS_READ,
    PermissionAction.INVENTORY_READ,
    PermissionAction.WAREHOUSES_READ,
  ],
}

// =============================================================================
// TENANT ROLE PERMISSIONS (Customer)
// =============================================================================

const TENANT_PERMISSIONS = {
  owner: [
    PermissionAction.USERS_READ,
    PermissionAction.USERS_CREATE,
    PermissionAction.USERS_UPDATE,
    PermissionAction.USERS_DELETE,
    PermissionAction.PRODUCTS_READ,
    PermissionAction.PRODUCTS_CREATE,
    PermissionAction.PRODUCTS_UPDATE,
    PermissionAction.PRODUCTS_DELETE,
    PermissionAction.ORDERS_READ,
    PermissionAction.INVENTORY_READ,
    PermissionAction.WAREHOUSES_READ,
    PermissionAction.ZONES_READ,
    PermissionAction.LOCATIONS_READ,
    PermissionAction.SHIPMENTS_READ,
    PermissionAction.RETURNS_READ,
    PermissionAction.RETURNS_UPDATE,
    PermissionAction.WRO_READ,
    PermissionAction.WRO_CREATE,
    PermissionAction.WRO_UPDATE,
    PermissionAction.BILLING_READ,
    PermissionAction.MHD_READ,
  ],
  
  admin: [
    PermissionAction.USERS_READ,
    PermissionAction.USERS_CREATE,
    PermissionAction.USERS_UPDATE,
    PermissionAction.PRODUCTS_READ,
    PermissionAction.PRODUCTS_CREATE,
    PermissionAction.PRODUCTS_UPDATE,
    PermissionAction.PRODUCTS_DELETE,
    PermissionAction.ORDERS_READ,
    PermissionAction.INVENTORY_READ,
    PermissionAction.WAREHOUSES_READ,
    PermissionAction.ZONES_READ,
    PermissionAction.LOCATIONS_READ,
    PermissionAction.SHIPMENTS_READ,
    PermissionAction.RETURNS_READ,
    PermissionAction.RETURNS_UPDATE,
    PermissionAction.WRO_READ,
    PermissionAction.WRO_CREATE,
    PermissionAction.WRO_UPDATE,
    PermissionAction.BILLING_READ,
    PermissionAction.MHD_READ,
  ],
  
  manager: [
    PermissionAction.PRODUCTS_READ,
    PermissionAction.PRODUCTS_UPDATE,
    PermissionAction.ORDERS_READ,
    PermissionAction.INVENTORY_READ,
    PermissionAction.WAREHOUSES_READ,
    PermissionAction.ZONES_READ,
    PermissionAction.LOCATIONS_READ,
    PermissionAction.SHIPMENTS_READ,
    PermissionAction.RETURNS_READ,
    PermissionAction.WRO_READ,
    PermissionAction.WRO_CREATE,
    PermissionAction.MHD_READ,
  ],
  
  user: [
    PermissionAction.PRODUCTS_READ,
    PermissionAction.ORDERS_READ,
    PermissionAction.INVENTORY_READ,
    PermissionAction.SHIPMENTS_READ,
    PermissionAction.RETURNS_READ,
    PermissionAction.WRO_READ,
  ],
  
  viewer: [
    PermissionAction.PRODUCTS_READ,
    PermissionAction.ORDERS_READ,
    PermissionAction.INVENTORY_READ,
    PermissionAction.SHIPMENTS_READ,
  ],
  
  packer: [
    PermissionAction.ORDERS_READ,
    PermissionAction.ORDERS_UPDATE,
    PermissionAction.PRODUCTS_READ,
    PermissionAction.INVENTORY_READ,
    PermissionAction.SHIPMENTS_READ,
    PermissionAction.SHIPMENTS_CREATE,
    PermissionAction.LOCATIONS_READ,
  ],
  
  picker: [
    PermissionAction.ORDERS_READ,
    PermissionAction.ORDERS_UPDATE,
    PermissionAction.PRODUCTS_READ,
    PermissionAction.INVENTORY_READ,
    PermissionAction.LOCATIONS_READ,
    PermissionAction.ZONES_READ,
  ],
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export type PlatformRole = keyof typeof PLATFORM_PERMISSIONS
export type TenantRole = keyof typeof TENANT_PERMISSIONS

export function getPlatformPermissions(role: PlatformRole): PermissionActionType[] {
  return PLATFORM_PERMISSIONS[role] || []
}

export function getTenantPermissions(role: TenantRole): PermissionActionType[] {
  return TENANT_PERMISSIONS[role] || []
}

export function hasPermission(
  userPermissions: PermissionActionType[],
  requiredPermission: PermissionActionType
): boolean {
  return userPermissions.includes(requiredPermission)
}

export function hasAnyPermission(
  userPermissions: PermissionActionType[],
  requiredPermissions: PermissionActionType[]
): boolean {
  return requiredPermissions.some(p => userPermissions.includes(p))
}

export function hasAllPermissions(
  userPermissions: PermissionActionType[],
  requiredPermissions: PermissionActionType[]
): boolean {
  return requiredPermissions.every(p => userPermissions.includes(p))
}

// =============================================================================
// PERMISSION INFO (for UI)
// =============================================================================

export const PERMISSION_INFO: Record<PermissionActionType, { name: string; description: string; category: string }> = {
  [PermissionAction.IMPERSONATE_USER]: { name: 'Impersonate User', description: 'Als anderer Benutzer agieren', category: 'System' },
  
  [PermissionAction.USERS_READ]: { name: 'Benutzer lesen', description: 'Benutzer anzeigen', category: 'Benutzer' },
  [PermissionAction.USERS_CREATE]: { name: 'Benutzer erstellen', description: 'Neue Benutzer anlegen', category: 'Benutzer' },
  [PermissionAction.USERS_UPDATE]: { name: 'Benutzer bearbeiten', description: 'Benutzer bearbeiten', category: 'Benutzer' },
  [PermissionAction.USERS_DELETE]: { name: 'Benutzer löschen', description: 'Benutzer löschen', category: 'Benutzer' },
  
  [PermissionAction.TENANTS_READ]: { name: 'Tenants lesen', description: 'Mandanten anzeigen', category: 'Tenants' },
  [PermissionAction.TENANTS_CREATE]: { name: 'Tenants erstellen', description: 'Neue Mandanten anlegen', category: 'Tenants' },
  [PermissionAction.TENANTS_UPDATE]: { name: 'Tenants bearbeiten', description: 'Mandanten bearbeiten', category: 'Tenants' },
  [PermissionAction.TENANTS_DELETE]: { name: 'Tenants löschen', description: 'Mandanten löschen', category: 'Tenants' },
  
  [PermissionAction.PRODUCTS_READ]: { name: 'Produkte lesen', description: 'Produkte anzeigen', category: 'Produkte' },
  [PermissionAction.PRODUCTS_CREATE]: { name: 'Produkte erstellen', description: 'Neue Produkte anlegen', category: 'Produkte' },
  [PermissionAction.PRODUCTS_UPDATE]: { name: 'Produkte bearbeiten', description: 'Produkte bearbeiten', category: 'Produkte' },
  [PermissionAction.PRODUCTS_DELETE]: { name: 'Produkte löschen', description: 'Produkte löschen', category: 'Produkte' },
  
  [PermissionAction.ORDERS_READ]: { name: 'Bestellungen lesen', description: 'Bestellungen anzeigen', category: 'Bestellungen' },
  [PermissionAction.ORDERS_UPDATE]: { name: 'Bestellungen bearbeiten', description: 'Bestellungen bearbeiten', category: 'Bestellungen' },
  [PermissionAction.ORDERS_DELETE]: { name: 'Bestellungen löschen', description: 'Bestellungen löschen', category: 'Bestellungen' },
  
  [PermissionAction.INVENTORY_READ]: { name: 'Bestand lesen', description: 'Bestand anzeigen', category: 'Bestand' },
  [PermissionAction.INVENTORY_ADJUST]: { name: 'Bestand anpassen', description: 'Bestand korrigieren', category: 'Bestand' },
  
  [PermissionAction.WAREHOUSES_READ]: { name: 'Lager lesen', description: 'Lager anzeigen', category: 'Lager' },
  [PermissionAction.WAREHOUSES_CREATE]: { name: 'Lager erstellen', description: 'Neue Lager anlegen', category: 'Lager' },
  [PermissionAction.WAREHOUSES_UPDATE]: { name: 'Lager bearbeiten', description: 'Lager bearbeiten', category: 'Lager' },
  [PermissionAction.WAREHOUSES_DELETE]: { name: 'Lager löschen', description: 'Lager löschen', category: 'Lager' },
  
  [PermissionAction.ZONES_READ]: { name: 'Zonen lesen', description: 'Lagerzonen anzeigen', category: 'Lager' },
  [PermissionAction.ZONES_CREATE]: { name: 'Zonen erstellen', description: 'Neue Zonen anlegen', category: 'Lager' },
  [PermissionAction.ZONES_UPDATE]: { name: 'Zonen bearbeiten', description: 'Zonen bearbeiten', category: 'Lager' },
  [PermissionAction.ZONES_DELETE]: { name: 'Zonen löschen', description: 'Zonen löschen', category: 'Lager' },
  
  [PermissionAction.LOCATIONS_READ]: { name: 'Lagerplätze lesen', description: 'Lagerplätze anzeigen', category: 'Lager' },
  [PermissionAction.LOCATIONS_CREATE]: { name: 'Lagerplätze erstellen', description: 'Neue Lagerplätze anlegen', category: 'Lager' },
  [PermissionAction.LOCATIONS_UPDATE]: { name: 'Lagerplätze bearbeiten', description: 'Lagerplätze bearbeiten', category: 'Lager' },
  [PermissionAction.LOCATIONS_DELETE]: { name: 'Lagerplätze löschen', description: 'Lagerplätze löschen', category: 'Lager' },
  
  [PermissionAction.SHIPMENTS_READ]: { name: 'Sendungen lesen', description: 'Sendungen anzeigen', category: 'Versand' },
  [PermissionAction.SHIPMENTS_CREATE]: { name: 'Sendungen erstellen', description: 'Labels erstellen', category: 'Versand' },
  
  [PermissionAction.RETURNS_READ]: { name: 'Retouren lesen', description: 'Retouren anzeigen', category: 'Retouren' },
  [PermissionAction.RETURNS_UPDATE]: { name: 'Retouren bearbeiten', description: 'Retouren bearbeiten', category: 'Retouren' },
  
  [PermissionAction.INVENTORY_COUNTS_READ]: { name: 'Inventur lesen', description: 'Inventuren anzeigen', category: 'Inventur' },
  [PermissionAction.INVENTORY_COUNTS_CREATE]: { name: 'Inventur starten', description: 'Neue Inventur starten', category: 'Inventur' },
  [PermissionAction.INVENTORY_COUNTS_UPDATE]: { name: 'Inventur bearbeiten', description: 'Inventur bearbeiten', category: 'Inventur' },
  
  [PermissionAction.MHD_READ]: { name: 'MHD lesen', description: 'Mindesthaltbarkeit anzeigen', category: 'MHD' },
  
  [PermissionAction.BILLING_READ]: { name: 'Abrechnung lesen', description: 'Abrechnung anzeigen', category: 'Abrechnung' },
  [PermissionAction.BILLING_MANAGE]: { name: 'Abrechnung verwalten', description: 'Abrechnung verwalten', category: 'Abrechnung' },
  
  [PermissionAction.WRO_READ]: { name: 'WRO lesen', description: 'Wareneingang anzeigen', category: 'Wareneingang' },
  [PermissionAction.WRO_CREATE]: { name: 'WRO erstellen', description: 'Wareneingang anlegen', category: 'Wareneingang' },
  [PermissionAction.WRO_UPDATE]: { name: 'WRO bearbeiten', description: 'Wareneingang bearbeiten', category: 'Wareneingang' },
}
