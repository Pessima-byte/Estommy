import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signJwt } from '@/lib/jwt';
import { UserRole } from '@/lib/roles';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.password) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isValid = user.password.startsWith('$2')
            ? await bcrypt.compare(password, user.password)
            : password.length >= 6 && password === user.password; // Fallback for seeds

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        if (!user.isActive) {
            return NextResponse.json({ error: 'Account disabled' }, { status: 403 });
        }

        const token = signJwt({
            id: user.id,
            email: user.email,
            role: (user.role as UserRole) || UserRole.USER,
            name: user.name || undefined,
        });

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            }
        });

    } catch (error) {
        console.error('Mobile login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
