import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import { Permission } from '@/lib/roles';
import { productSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissionCheck = checkPermission(session.user?.role, Permission.VIEW_PRODUCTS);
    if (!permissionCheck.allowed) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
    }

    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissionCheck = checkPermission(session.user?.role, Permission.CREATE_PRODUCTS);
    if (!permissionCheck.allowed) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
    }

    const body = await request.json();

    // Validate with Zod
    const validation = productSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.format()
      }, { status: 400 });
    }

    const { name, category, price, costPrice, stock, status, image } = validation.data;

    const product = await prisma.product.create({
      data: {
        name,
        category,
        price,
        costPrice,
        stock,
        status: status || 'In Stock',
        image: image || null,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

