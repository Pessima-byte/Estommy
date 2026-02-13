import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const customer = await prisma.customer.create({
        data: {
            name: 'Test Customer Sync ' + Date.now(),
            status: 'Active'
        }
    });
    console.log('Created customer:', customer.name);
    const count = await prisma.customer.count();
    console.log('Total customers now:', count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
