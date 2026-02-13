import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all data
    const [products, customers, sales, credits, profits, categories, activities, users] = await Promise.all([
      prisma.product.findMany(),
      prisma.customer.findMany(),
      prisma.sale.findMany(),
      prisma.credit.findMany(),
      prisma.profit.findMany(),
      prisma.category.findMany(),
      prisma.activity.findMany(),
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          image: true,
          provider: true,
          notifications: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
    ]);

    const backup = {
      version: '1.1',
      timestamp: new Date().toISOString(),
      data: {
        products,
        customers,
        sales,
        credits,
        profits,
        categories,
        activities,
        users,
      },
    };

    return NextResponse.json(backup);
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { data, clearExisting = false } = body;

    if (!data || !data.products || !data.customers) {
      return NextResponse.json({ error: 'Invalid backup format' }, { status: 400 });
    }

    // Use a transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Clear existing data in reverse order of dependencies
      await tx.activity.deleteMany();
      await tx.sale.deleteMany();
      await tx.credit.deleteMany();
      await tx.profit.deleteMany();
      await tx.product.deleteMany();
      await tx.customer.deleteMany();
      await tx.category.deleteMany();
      // We don't delete users to avoid locking out the current session

      // Restore Categories
      if (data.categories?.length > 0) {
        await tx.category.createMany({
          data: data.categories.map((c: any) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
            updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
          })),
        });
      }

      // Restore Products
      if (data.products?.length > 0) {
        await tx.product.createMany({
          data: data.products.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            price: Number(p.price),
            costPrice: Number(p.costPrice || 0),
            stock: Number(p.stock),
            status: p.status,
            image: p.image,
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
            updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          })),
        });
      }

      // Restore Customers
      if (data.customers?.length > 0) {
        await tx.customer.createMany({
          data: data.customers.map((c: any) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            gender: c.gender,
            address: c.address,
            signature: c.signature,
            status: c.status,
            avatar: c.avatar,
            totalDebt: c.totalDebt || 0,
            createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
            updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
          })),
        });
      }

      // Restore Sales
      if (data.sales?.length > 0) {
        await tx.sale.createMany({
          data: data.sales.map((s: any) => ({
            id: s.id,
            customerId: s.customerId,
            productId: s.productId,
            date: s.date,
            amount: Number(s.amount),
            costPriceSnapshot: Number(s.costPriceSnapshot || 0),
            status: s.status,
            createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
            updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
          })),
        });
      }

      // Restore Credits
      if (data.credits?.length > 0) {
        await tx.credit.createMany({
          data: data.credits.map((c: any) => ({
            id: c.id,
            customerId: c.customerId,
            amount: c.amount,
            amountPaid: c.amountPaid || 0,
            dueDate: c.dueDate,
            status: c.status,
            notes: c.notes,
            paymentTerms: c.paymentTerms,
            interestRate: c.interestRate,
            reference: c.reference,
            contactPhone: c.contactPhone,
            createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
            updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
          })),
        });
      }

      // Restore Profits
      if (data.profits?.length > 0) {
        await tx.profit.createMany({
          data: data.profits.map((p: any) => ({
            id: p.id,
            date: p.date,
            amount: p.amount,
            type: p.type,
            description: p.description,
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
            updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          })),
        });
      }

      // Restore Activities
      if (data.activities?.length > 0) {
        await tx.activity.createMany({
          data: data.activities.map((a: any) => ({
            id: a.id,
            userId: a.userId,
            userName: a.userName,
            action: a.action,
            entityType: a.entityType,
            entityId: a.entityId,
            entityName: a.entityName,
            description: a.description,
            metadata: a.metadata,
            createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
          })),
        });
      }
    });

    return NextResponse.json({ message: 'System state architecture restored successfully' });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json({ error: 'Critical system restoration failed' }, { status: 500 });
  }
}


