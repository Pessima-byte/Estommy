import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdmin() {
    const email = 'admin@estommy.com';
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log(`🚀 Resetting password for ${email}...`);
    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log('❌ User not found!');
            return;
        }

        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                isActive: true,
                role: 'ADMIN'
            }
        });

        console.log(`✅ Success! You can now log in with:`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${newPassword}`);

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdmin();
