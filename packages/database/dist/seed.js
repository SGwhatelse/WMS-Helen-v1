import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function hashPassword(password) {
    return bcrypt.hash(password, 12);
}
async function main() {
    console.log('🌱 Seeding database...');
    // ==========================================================================
    // 1. Subscription Plans
    // ==========================================================================
    console.log('📦 Creating subscription plans...');
    const plans = await Promise.all([
        prisma.subscriptionPlan.upsert({
            where: { slug: 'free-trial' },
            update: {},
            create: {
                name: 'Free Trial',
                slug: 'free-trial',
                description: '14 Tage kostenlos testen',
                priceMonthly: 0,
                priceYearly: 0,
                maxOrders: 50,
                maxProducts: 100,
                maxUsers: 2,
                maxWarehouses: 1,
                trialDays: 14,
                sortOrder: 0,
            },
        }),
        prisma.subscriptionPlan.upsert({
            where: { slug: 'starter' },
            update: {},
            create: {
                name: 'Starter',
                slug: 'starter',
                description: 'Für kleine Unternehmen',
                priceMonthly: 9900,
                priceYearly: 99000,
                maxOrders: 500,
                maxProducts: 1000,
                maxUsers: 5,
                maxWarehouses: 1,
                trialDays: 14,
                sortOrder: 1,
            },
        }),
        prisma.subscriptionPlan.upsert({
            where: { slug: 'professional' },
            update: {},
            create: {
                name: 'Professional',
                slug: 'professional',
                description: 'Für wachsende Unternehmen',
                priceMonthly: 29900,
                priceYearly: 299000,
                maxOrders: 5000,
                maxProducts: 10000,
                maxUsers: 20,
                maxWarehouses: 3,
                trialDays: 14,
                sortOrder: 2,
            },
        }),
        prisma.subscriptionPlan.upsert({
            where: { slug: 'enterprise' },
            update: {},
            create: {
                name: 'Enterprise',
                slug: 'enterprise',
                description: 'Für Grossunternehmen',
                priceMonthly: 0,
                priceYearly: 0,
                maxOrders: null,
                maxProducts: null,
                maxUsers: null,
                maxWarehouses: null,
                trialDays: 30,
                sortOrder: 3,
            },
        }),
    ]);
    console.log(`   ✓ Created ${plans.length} plans`);
    // ==========================================================================
    // 2. Feature Flags
    // ==========================================================================
    console.log('🚩 Creating feature flags...');
    const features = await Promise.all([
        prisma.featureFlag.upsert({
            where: { code: 'api_access' },
            update: {},
            create: { code: 'api_access', name: 'API Zugang', category: 'integration', flagType: 'plan_feature' },
        }),
        prisma.featureFlag.upsert({
            where: { code: 'webhooks' },
            update: {},
            create: { code: 'webhooks', name: 'Webhooks', category: 'integration', flagType: 'plan_feature' },
        }),
        prisma.featureFlag.upsert({
            where: { code: 'multi_warehouse' },
            update: {},
            create: { code: 'multi_warehouse', name: 'Multi-Warehouse', category: 'warehouse', flagType: 'plan_feature' },
        }),
        prisma.featureFlag.upsert({
            where: { code: 'lot_tracking' },
            update: {},
            create: { code: 'lot_tracking', name: 'LOT-Tracking', category: 'inventory', flagType: 'tenant_setting' },
        }),
        prisma.featureFlag.upsert({
            where: { code: 'expiry_tracking' },
            update: {},
            create: { code: 'expiry_tracking', name: 'MHD-Tracking', category: 'inventory', flagType: 'tenant_setting' },
        }),
        prisma.featureFlag.upsert({
            where: { code: 'serial_tracking' },
            update: {},
            create: { code: 'serial_tracking', name: 'Seriennummern', category: 'inventory', flagType: 'tenant_setting' },
        }),
    ]);
    console.log(`   ✓ Created ${features.length} feature flags`);
    // ==========================================================================
    // 3. Carriers
    // ==========================================================================
    console.log('🚚 Creating carriers...');
    const chPost = await prisma.carrier.upsert({
        where: { code: 'CHPOST' },
        update: {},
        create: {
            name: 'Swiss Post',
            code: 'CHPOST',
            trackingUrl: 'https://www.post.ch/swisspost-tracking?formattedParcelCodes={tracking}',
        },
    });
    await Promise.all([
        prisma.carrierService.upsert({
            where: { carrierId_code: { carrierId: chPost.id, code: 'ECO' } },
            update: {},
            create: { carrierId: chPost.id, name: 'PostPac Economy', code: 'ECO', transitDays: 3 },
        }),
        prisma.carrierService.upsert({
            where: { carrierId_code: { carrierId: chPost.id, code: 'PRI' } },
            update: {},
            create: { carrierId: chPost.id, name: 'PostPac Priority', code: 'PRI', transitDays: 1 },
        }),
    ]);
    console.log('   ✓ Created carriers and services');
    // ==========================================================================
    // 4. Platform Admin
    // ==========================================================================
    console.log('👤 Creating platform admin...');
    await prisma.platformUser.upsert({
        where: { email: 'admin@wms.local' },
        update: {},
        create: {
            email: 'admin@wms.local',
            password: await hashPassword('admin123!'),
            firstName: 'Platform',
            lastName: 'Admin',
            role: 'super_admin',
        },
    });
    console.log('   ✓ Created platform admin (admin@wms.local / admin123!)');
    // ==========================================================================
    // 5. Demo Tenant
    // ==========================================================================
    console.log('🏢 Creating demo tenant...');
    const trialPlan = plans.find(p => p.slug === 'free-trial');
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'demo-company' },
        update: {},
        create: {
            name: 'Demo Company',
            slug: 'demo-company',
            status: 'active',
            contactEmail: 'demo@example.com',
            companyName: 'Demo GmbH',
            addressLine1: 'Musterstrasse 123',
            postalCode: '8000',
            city: 'Zürich',
        },
    });
    await prisma.tenantSettings.upsert({
        where: { tenantId: tenant.id },
        update: {},
        create: {
            tenantId: tenant.id,
            lotTrackingEnabled: true,
            expiryTrackingEnabled: true,
            pickingStrategy: 'FEFO',
        },
    });
    await prisma.tenantSubscription.upsert({
        where: { tenantId: tenant.id },
        update: {},
        create: {
            tenantId: tenant.id,
            planId: trialPlan.id,
            status: 'trialing',
            currentPeriodStart: now,
            currentPeriodEnd: trialEnd,
            trialEndsAt: trialEnd,
        },
    });
    await prisma.tenantUser.upsert({
        where: { tenantId_email: { tenantId: tenant.id, email: 'demo@example.com' } },
        update: {},
        create: {
            tenantId: tenant.id,
            email: 'demo@example.com',
            password: await hashPassword('demo123!'),
            firstName: 'Demo',
            lastName: 'User',
            role: 'owner',
            emailVerified: true,
        },
    });
    console.log('   ✓ Created demo tenant (demo@example.com / demo123!)');
    // ==========================================================================
    // 6. Demo Warehouse
    // ==========================================================================
    console.log('🏭 Creating demo warehouse...');
    const warehouse = await prisma.warehouse.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: 'ZH-01' } },
        update: {},
        create: {
            tenantId: tenant.id,
            name: 'Hauptlager Zürich',
            code: 'ZH-01',
            addressLine1: 'Industriestrasse 50',
            postalCode: '8005',
            city: 'Zürich',
        },
    });
    const pickZone = await prisma.warehouseZone.upsert({
        where: { warehouseId_code: { warehouseId: warehouse.id, code: 'PICK-A' } },
        update: {},
        create: {
            warehouseId: warehouse.id,
            name: 'Picking Zone A',
            code: 'PICK-A',
            type: 'pick_face',
        },
    });
    // Create 24 locations
    let seq = 0;
    for (let rack = 1; rack <= 2; rack++) {
        for (let level = 1; level <= 3; level++) {
            for (let pos = 1; pos <= 4; pos++) {
                seq++;
                const name = `A-${String(rack).padStart(2, '0')}-${String(level).padStart(2, '0')}-${String(pos).padStart(2, '0')}`;
                await prisma.location.upsert({
                    where: { warehouseId_barcode: { warehouseId: warehouse.id, barcode: `LOC-${name}` } },
                    update: {},
                    create: {
                        warehouseId: warehouse.id,
                        zoneId: pickZone.id,
                        name,
                        barcode: `LOC-${name}`,
                        type: 'shelf',
                        aisle: 'A',
                        rack: String(rack).padStart(2, '0'),
                        level: String(level).padStart(2, '0'),
                        position: String(pos).padStart(2, '0'),
                        pickSequence: seq,
                    },
                });
            }
        }
    }
    await prisma.packStation.upsert({
        where: { warehouseId_code: { warehouseId: warehouse.id, code: 'PS-01' } },
        update: {},
        create: {
            warehouseId: warehouse.id,
            name: 'Pack Station 1',
            code: 'PS-01',
            hasScale: true,
            hasLabelPrinter: true,
        },
    });
    console.log('   ✓ Created warehouse with 24 locations');
    // ==========================================================================
    // 7. Demo Products
    // ==========================================================================
    console.log('📦 Creating demo products...');
    const products = [
        { sku: 'TSHIRT-BLK-M', name: 'T-Shirt Schwarz M', weight: 200, cost: 800, price: 2900, lot: false, exp: false },
        { sku: 'TSHIRT-WHT-M', name: 'T-Shirt Weiss M', weight: 200, cost: 800, price: 2900, lot: false, exp: false },
        { sku: 'VITAMIN-D3', name: 'Vitamin D3 90 Stk', weight: 80, cost: 500, price: 1990, lot: true, exp: true },
        { sku: 'PROTEIN-CHOC', name: 'Protein Schokolade 1kg', weight: 1100, cost: 2000, price: 4990, lot: true, exp: true },
    ];
    for (const p of products) {
        const product = await prisma.product.upsert({
            where: { tenantId_sku: { tenantId: tenant.id, sku: p.sku } },
            update: {},
            create: {
                tenantId: tenant.id,
                sku: p.sku,
                name: p.name,
                weightGrams: p.weight,
                costCents: p.cost,
                priceCents: p.price,
                requiresLotTracking: p.lot,
                requiresExpiryTracking: p.exp,
                reorderPoint: 20,
            },
        });
        await prisma.productBarcode.upsert({
            where: { productId_barcode: { productId: product.id, barcode: `EAN-${p.sku}` } },
            update: {},
            create: {
                productId: product.id,
                barcode: `EAN-${p.sku}`,
                type: 'ean13',
                isPrimary: true,
            },
        });
    }
    console.log(`   ✓ Created ${products.length} products`);
    // ==========================================================================
    // Done!
    // ==========================================================================
    console.log('');
    console.log('✅ Seeding completed!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log('   Platform Admin: admin@wms.local / admin123!');
    console.log('   Demo User:      demo@example.com / demo123!');
    console.log('');
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
