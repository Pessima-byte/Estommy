const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSystemIntegrity() {
    console.log('--- STARTING SYSTEM INTEGRITY CHECK ---');

    // 1. Check Customer Debt Consistency
    console.log('\n[1] Verifying Customer Debt Consistency...');
    const customers = await prisma.customer.findMany({
        include: {
            credits: {
                where: { status: { not: 'Cleared' } }
            }
        }
    });

    let inconsistencies = 0;
    for (const customer of customers) {
        const actualDebt = customer.credits.reduce((sum, c) => sum + (c.amount - c.amountPaid), 0);
        if (Math.abs(customer.totalDebt - actualDebt) > 0.01) {
            console.error(`❌ INCONSISTENCY: Customer "${customer.name}" (ID: ${customer.id})`);
            console.error(`   - DB totalDebt: ${customer.totalDebt}`);
            console.error(`   - Calculated Debt: ${actualDebt}`);
            inconsistencies++;
        }
    }
    if (inconsistencies === 0) console.log('✅ All customer debts are consistent.');

    // 2. Check for Missing Products/Customers in Sales
    console.log('\n[2] Checking for Orphaned Sales References...');
    const sales = await prisma.sale.findMany();
    let orphans = 0;
    for (const sale of sales) {
        const prod = await prisma.product.findUnique({ where: { id: sale.productId } });
        const cust = await prisma.customer.findUnique({ where: { id: sale.customerId } });
        if (!prod || !cust) {
            console.error(`❌ ORPHAN: Sale ID ${sale.id} references missing ${!prod ? 'Product' : 'Customer'}`);
            orphans++;
        }
    }
    if (orphans === 0) console.log('✅ No orphaned sales found.');

    // 3. Check Stock Levels
    console.log('\n[3] Checking for Negative Stock...');
    const lowStock = await prisma.product.findMany({ where: { stock: { lt: 0 } } });
    if (lowStock.length > 0) {
        lowStock.forEach(p => console.error(`❌ NEGATIVE STOCK: ${p.name} (${p.stock})`));
    } else {
        console.log('✅ No products with negative stock.');
    }

    console.log('\n--- SYSTEM INTEGRITY CHECK COMPLETE ---');
    await prisma.$disconnect();
}

checkSystemIntegrity().catch(err => {
    console.error(err);
    process.exit(1);
});
