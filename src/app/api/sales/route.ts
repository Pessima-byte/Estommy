import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { saleSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const isDev = process.env.NODE_ENV === 'development';

    if (!session && !isDev) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const sales = await prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        product: true,
      },
    });

    // Transform to flat structure for frontend compatibility if needed, or update frontend types.
    // Given the frontend expects sales[i].customer to be a name string, I should map it or update frontend.
    // Let's update frontend types instead.

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate with Zod
    const validation = saleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.format()
      }, { status: 400 });
    }

    const { customerId, productId, date, amount, status, quantity } = validation.data;

    // Use a transaction to ensure stock is updated and sale is recorded atomically
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Get current product details for costSnapshot and stock check
      const product = await tx.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new Error('Product not found');
      }

      if (product.stock < quantity) {
        throw new Error(`Insufficient stock. Only ${product.stock} available.`);
      }

      // 2. Create the sale with cost snapshot
      const newSale = await tx.sale.create({
        data: {
          customerId,
          productId,
          date,
          amount,
          quantity,
          costPriceSnapshot: product.costPrice,
          status: status || 'Completed',
        },
        include: {
          customer: true,
          product: true,
        },
      });

      // 3. Update product stock (decrement)
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: {
            decrement: quantity
          },
          // Auto-update status based on new stock level
          status: (product.stock - quantity) === 0 ? 'Out of Stock' : (product.stock - quantity) <= 5 ? 'Low Stock' : product.status
        }
      });
      // 4. Record Activity
      await tx.activity.create({
        data: {
          userId: session.user?.id || 'system',
          userName: session.user?.name || 'System',
          action: 'CREATE',
          entityType: 'SALE',
          entityId: newSale.id,
          entityName: `${product.name} (x${quantity})`,
          description: `Sold ${quantity} unit(s) of ${product.name} for Le ${amount.toLocaleString()}`,
        }
      });

      return newSale;
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error: any) {
    console.error('Error creating sale:', error);
    return NextResponse.json({
      error: error.message || 'Failed to create sale'
    }, { status: error.message === 'Product is out of stock' ? 409 : 500 });
  }
}

