import { PrismaClient } from '@prisma/client';
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';

// Setup Prisma with specific adapter - matching src/lib/prisma.ts
const dbPath = './prisma/dev.db';

const adapter = new PrismaBetterSQLite3({
    url: dbPath,
});

const prisma = new PrismaClient({
    adapter: adapter,
});

async function main() {
    const email = 'admin@estommy.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Upserting admin user...');

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: 'ADMIN',
                isActive: true,
                name: 'System Admin',
            },
            create: {
                email,
                name: 'System Admin',
                password: hashedPassword,
                role: 'ADMIN',
                phone: '+23200000000',
                isActive: true,
            },
        });

        console.log(`✅ Admin user created/updated:`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Role: ${user.role}`);
    } catch (e) {
        console.error("Error during upsert:", e);
        throw e;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
