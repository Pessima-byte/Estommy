import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CURRENT_IP = '192.168.1.69';

async function main() {
    console.log('--- CORRECTING HARDCODED IPs IN DATABASE ---');

    // Correct User images
    const users = await prisma.user.findMany({
        where: { image: { contains: '192.168.1.' } }
    });
    for (const user of users) {
        const newImage = user.image?.replace(/192\.168\.1\.\d+/, CURRENT_IP);
        await prisma.user.update({
            where: { id: user.id },
            data: { image: newImage }
        });
        console.log(`Updated user ${user.email} image to ${newImage}`);
    }

    // Correct Product images
    const products = await prisma.product.findMany({
        where: { image: { contains: '192.168.1.' } }
    });
    for (const product of products) {
        const newImage = product.image?.replace(/192\.168\.1\.\d+/, CURRENT_IP);
        await prisma.product.update({
            where: { id: product.id },
            data: { image: newImage }
        });
        console.log(`Updated product ${product.name} image to ${newImage}`);
    }

    console.log('--- DONE ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
