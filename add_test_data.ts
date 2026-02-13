import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- ADDING TEST SYNC DATA ---');

    // 1. Create a Customer
    const customer = await prisma.customer.upsert({
        where: { name: 'Test Customer Sync' },
        update: {},
        create: {
            name: 'Test Customer Sync',
            email: 'sync@test.com',
            phone: '123456789',
            status: 'Active'
        }
    });
    console.log('Customer synced:', customer.name);

    // 2. Find a Product
    const product = await prisma.product.findFirst();
    if (!product) {
        console.log('No products found to create a sale!');
        return;
    }

    // 3. Create a Sale
    const sale = await prisma.sale.create({
        data: {
            customerId: customer.id,
            productId: product.id,
            amount: 500,
            quantity: 1,
            date: new Date().toISOString(),
            status: 'Completed'
        }
    });
    console.log('Sale synced for amount:', sale.amount);

    const stats = {
        customers: await prisma.customer.count(),
        sales: await prisma.sale.count(),
        products: await prisma.product.count()
    };
    console.log('New stats:', JSON.stringify(stats, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
