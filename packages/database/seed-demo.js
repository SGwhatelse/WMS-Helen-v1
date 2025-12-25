const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  
  // Tenant finden
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'demo-company' } });
  console.log('Tenant:', tenant.id);

  // TenantUser erstellen
  const hash = await bcrypt.hash('demo123!', 12);
  const user = await prisma.tenantUser.create({
    data: {
      tenantId: tenant.id,
      email: 'demo@example.com',
      password: hash,
      firstName: 'Demo',
      lastName: 'User',
      role: 'owner',
      isActive: true,
    }
  });
  console.log('User created:', user.email);

  // Admin User
  const adminHash = await bcrypt.hash('admin123!', 12);
  try {
    await prisma.platformUser.create({
      data: {
        email: 'daniel@just3pl.com',
        password: adminHash,
        firstName: 'Daniel',
        lastName: 'Admin',
        role: 'super_admin',
        isActive: true,
      }
    });
    console.log('Admin created');
  } catch (e) {
    console.log('Admin already exists');
  }

  await prisma.$disconnect();
  console.log('Done!');
}

main().catch(e => console.error('Error:', e));
