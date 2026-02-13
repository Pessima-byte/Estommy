import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany();
    const customers = await prisma.customer.findMany();
    const sales = await prisma.sale.count();

    console.log('--- DATABASE AUDIT ---');
    console.log('Total Products:', products.length);
    console.log('Total Stock:', products.reduce((acc, p) => acc + p.stock, 0));
    console.log('Total Customers:', customers.length);
    console.log('Total Sales:', sales);

    if (products.length > 0) {
        console.log('First 3 Products:', JSON.stringify(products.slice(0, 3), null, 2));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
