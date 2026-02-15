import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signJwt } from '@/lib/jwt';
import { UserRole } from '@/lib/roles';

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
        },
    });
}

export async function POST(request: NextRequest) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    };

    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400, headers: corsHeaders });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.password) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: corsHeaders });
        }

        const isValid = user.password.startsWith('$2')
            ? await bcrypt.compare(password, user.password)
            : password.length >= 6 && password === user.password; // Fallback for seeds

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: corsHeaders });
        }

        if (!user.isActive) {
            return NextResponse.json({ error: 'Account disabled' }, { status: 403, headers: corsHeaders });
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
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('Mobile login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
    }
}
