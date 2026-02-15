import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
    console.log('🔍 Checking users in Supabase database...');
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                password: true // To see if it exists
            }
        });

        console.log(`📊 Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- ${u.name} (${u.email}) | Role: ${u.role} | Active: ${u.isActive} | Has Password: ${!!u.password}`);
        });

    } catch (error: any) {
        console.error('❌ Error fetching users:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsers();
