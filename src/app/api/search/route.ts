import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const isDev = process.env.NODE_ENV === 'development';

        if (!session && !isDev) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json({ products: [], customers: [], sales: [] });
        }

        const [products, customers, sales] = await Promise.all([
            prisma.product.findMany({
                where: {
                    OR: [
                        { name: { contains: query } },
                        { category: { contains: query } },
                        { id: { contains: query } },
                    ],
                },
                take: 5,
            }),
            prisma.customer.findMany({
                where: {
                    OR: [
                        { name: { contains: query } },
                        { email: { contains: query } },
                        { phone: { contains: query } },
                    ],
                },
                take: 5,
            }),
            prisma.sale.findMany({
                where: {
                    OR: [
                        { id: { contains: query } },
                        { product: { name: { contains: query } } },
                        { customer: { name: { contains: query } } },
                    ],
                },
                include: {
                    product: true,
                    customer: true,
                },
                take: 5,
            }),
        ]);

        return NextResponse.json({
            products,
            customers,
            sales,
        });

    } catch (error) {
        console.error('Global search error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
