const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.product.count();
    const products = await prisma.product.findMany();
    console.log(`TOTAL_PRODUCTS: ${count}`);
    console.log(JSON.stringify(products, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
