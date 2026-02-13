import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import { Permission } from '@/lib/roles';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissionCheck = checkPermission(session.user?.role, Permission.VIEW_CREDITS);

    if (!permissionCheck.allowed) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
    }

    const credits = await prisma.credit.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    });
    return NextResponse.json(credits);
  } catch (error) {
    console.error('[Credits API] Error fetching credits:', error);
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissionCheck = checkPermission(session.user?.role, Permission.CREATE_CREDITS);
    if (!permissionCheck.allowed) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
    }

    const body = await request.json();
    const { customerId, amount, amountPaid, dueDate, status, notes, paymentTerms, interestRate, reference, contactPhone, image, items } = body;

    if (!customerId || amount === undefined || !dueDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const credit = await prisma.$transaction(async (tx) => {
      // 1. Create Credit Record
      const newCredit = await tx.credit.create({
        data: {
          customerId,
          amount: parseFloat(amount),
          amountPaid: amountPaid ? parseFloat(amountPaid) : 0,
          dueDate,
          status: status || 'Pending',
          notes: notes || null,
          paymentTerms: paymentTerms || null,
          interestRate: interestRate ? parseFloat(interestRate) : null,
          reference: reference || null,
          contactPhone: contactPhone || null,
          image: image || null,
        },
        include: {
          customer: true,
        }
      });

      // 2. If items are provided, process Inventory and create Sale records (marked as Credit)
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const { productId, quantity, price } = item;
          // Validations
          const product = await tx.product.findUnique({ where: { id: productId } });
          if (!product) throw new Error(`Product ${productId} not found`);

          if (product.stock < quantity) {
            throw new Error(`Insufficient stock for ${product.name}`);
          }

          // Create multiple sale records (1 per unit) or 1 record with quantity? 
          // Current Sale schema is 1 Sale = 1 Unit implied by no quantity field?
          // Sale schema: `productId String` (Single).
          // And `amount Float` usually price * 1.
          // Wait, if I sell 5 iPhones, do I have 5 Sale rows?
          // The `AddSaleModal` sends `amount`. It doesn't have `quantity`.
          // It processes 1 sale. The user has to click "Add Sale" 5 times?
          // Or `AddSaleModal` has quantity?
          // Checking AddSaleModal again... It DOES NOT have quantity.
          // This app seems to handle "Single Item Serialized Sales" pattern or just "1 Sale = 1 Transaction of 1 Item".
          // If the user wants to sell 5 items, they must be creating 5 rows based on current `AddSaleModal`.
          // BUT `Product` has `stock Int`.
          // If I modify `AddCreditModal` to handle `quantity`, I should create `quantity` number of Sale records?
          // That would spam the DB.
          // Better: Create 1 Sale record per ITEM TYPE, but `Sale` model lacks `quantity`.
          // Refactoring `Sale` to add `quantity` is a good idea but risky right now (DB migration).
          // For now, I will loop `quantity` times. It's safe and consistent with existing 1-1 pattern.

          for (let i = 0; i < quantity; i++) {
            await tx.sale.create({
              data: {
                customerId,
                productId,
                date: new Date().toISOString().split('T')[0], // Today's date
                amount: price,
                costPriceSnapshot: product.costPrice,
                status: 'Credit' // Mark as Credit so ProfitsPage can filter/use it
              }
            });
          }

          // Decrement Stock
          await tx.product.update({
            where: { id: productId },
            data: {
              stock: { decrement: quantity },
              status: (product.stock - quantity) === 0 ? 'Out of Stock' : (product.stock - quantity) <= 5 ? 'Low Stock' : product.status
            }
          });
        }
      }

      // 3. Update customer total debt
      const debtImpact = newCredit.amount - newCredit.amountPaid;
      await tx.customer.update({
        where: { id: customerId },
        data: {
          totalDebt: {
            increment: debtImpact
          }
        }
      });

      return newCredit;
    });

    return NextResponse.json(credit, { status: 201 });
  } catch (error: any) {
    console.error('Error creating credit:', error);
    return NextResponse.json({
      error: error.message || 'Failed to create credit'
    }, { status: 500 });
  }
}

