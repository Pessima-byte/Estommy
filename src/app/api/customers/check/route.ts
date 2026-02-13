import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const field = searchParams.get('field');
        const value = searchParams.get('value');
        const excludeId = searchParams.get('excludeId');

        if (!field || !value) {
            return NextResponse.json({ error: 'Missing field or value' }, { status: 400 });
        }

        // Only allow checking specific unique fields
        const allowedFields = ['phone', 'email', 'name', 'signature'];
        if (!allowedFields.includes(field)) {
            return NextResponse.json({ error: 'Invalid field' }, { status: 400 });
        }

        const where: any = {
            [field]: value.trim(),
        };

        if (excludeId) {
            where.NOT = { id: excludeId };
        }

        const existing = await prisma.customer.findFirst({
            where,
        });

        return NextResponse.json({ available: !existing });
    } catch (error) {
        console.error('Error checking availability:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
