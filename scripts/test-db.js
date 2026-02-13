const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing DB Connection...');
        const userCount = await prisma.user.count();
        console.log(`Users count: ${userCount}`);

        console.log('Testing Credits table...');
        const credits = await prisma.credit.findMany({
            include: { customer: true }
        });
        console.log(`Successfully fetched ${credits.length} credits.`);
        console.log('Credits:', JSON.stringify(credits, null, 2));

    } catch (e) {
        console.error('Error connecting to DB or fetching credits:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
