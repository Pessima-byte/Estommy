import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SUPABASE_URL = 'https://wvmkuiiktdadezifbrhv.supabase.co';
const BUCKET_NAME = 'uploads';

async function updateDatabaseUrls() {
    console.log('🔄 Updating database image URLs to Supabase Storage...');

    try {
        // 1. Get all products with local URLs
        const products = await prisma.product.findMany({
            where: {
                image: {
                    startsWith: '/uploads/'
                }
            }
        });

        console.log(`📦 Found ${products.length} products to update.`);

        for (const product of products) {
            if (!product.image) continue;
            const fileName = product.image.split('/').pop();
            const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;

            await prisma.product.update({
                where: { id: product.id },
                data: { image: publicUrl }
            });
            console.log(`✅ Updated product: ${product.name}`);
        }

        // 2. Get all customers with local URLs
        const customers = await prisma.customer.findMany({
            where: {
                avatar: {
                    startsWith: '/uploads/'
                }
            }
        });

        console.log(`📦 Found ${customers.length} customers to update.`);

        for (const customer of customers) {
            if (!customer.avatar) continue;
            const fileName = customer.avatar.split('/').pop();
            const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;

            await prisma.customer.update({
                where: { id: customer.id },
                data: { avatar: publicUrl }
            });
            console.log(`✅ Updated customer: ${customer.name}`);
        }

        console.log('✨ All database URLs updated successfully!');
    } catch (error: any) {
        console.error('❌ Update failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

updateDatabaseUrls();
