// 1. Load Environment Variables FIRST
import 'dotenv/config';
import { prisma } from '../src/config/db'

async function main() {
  // 1. Define all possible permissions in the system
  const permissions = [
    { action: 'auction:create', description: 'Can create auctions' },
    { action: 'auction:update', description: 'Can update own auctions' },
    { action: 'auction:delete', description: 'Can delete any auction' }, // Admin only
    { action: 'bid:place', description: 'Can place bids' },
    { action: 'user:ban', description: 'Can ban users' },
  ];

  // 2. Upsert Permissions (Create if not exists)
  // We map them to ensure we have the DB objects
  const permMap: Record<string, any> = {};
  
  for (const perm of permissions) {
    const p = await prisma.permission.upsert({
      where: { action: perm.action },
      update: {},
      create: perm,
    });
    permMap[perm.action] = p;
  }

  // 3. Create Roles and assign Permissions
  
  // ADMIN: Gets everything
  await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      permissions: {
        connect: Object.values(permMap).map((p: any) => ({ id: p.id })),
      },
    },
  });

  // USER: Can create auctions, update own, place bids
  await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      permissions: {
        connect: [
            { id: permMap['auction:create'].id },
            { id: permMap['auction:update'].id },
            { id: permMap['bid:place'].id },
        ],
      },
    },
  });
  
  console.log("✅ Database seeded with Roles & Permissions");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());