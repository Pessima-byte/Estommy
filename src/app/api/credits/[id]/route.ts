import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import { Permission } from '@/lib/roles';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissionCheck = checkPermission(session.user?.role, Permission.EDIT_CREDITS);
    if (!permissionCheck.allowed) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { customer, amount, amountPaid, dueDate, status, notes, paymentTerms, interestRate, reference, contactPhone, image } = body;

    const updatedCredit = await prisma.$transaction(async (tx) => {
      // 1. Get current credit to calculate debt difference
      const oldCredit = await tx.credit.findUnique({
        where: { id },
      });

      if (!oldCredit) throw new Error('Credit not found');

      // 2. Perform the update
      const credit = await tx.credit.update({
        where: { id },
        data: {
          ...(customer && { customer }),
          ...(amount !== undefined && { amount: parseFloat(amount) }),
          ...(amountPaid !== undefined && { amountPaid: parseFloat(amountPaid) }),
          ...(dueDate && { dueDate }),
          ...(status && { status }),
          ...(notes !== undefined && { notes: notes || null }),
          ...(paymentTerms !== undefined && { paymentTerms: paymentTerms || null }),
          ...(interestRate !== undefined && { interestRate: interestRate ? parseFloat(interestRate) : null }),
          ...(reference !== undefined && { reference: reference || null }),
          ...(contactPhone !== undefined && { contactPhone: contactPhone || null }),
          ...(image !== undefined && { image: image || null }),
        },
        include: {
          customer: true,
        }
      });

      // 3. Update customer total debt based on difference
      const oldOutstanding = oldCredit.amount - (oldCredit.amountPaid || 0);
      const newOutstanding = credit.amount - (credit.amountPaid || 0);
      const diff = newOutstanding - oldOutstanding;

      if (diff !== 0) {
        await tx.customer.update({
          where: { id: credit.customerId },
          data: {
            totalDebt: {
              increment: diff
            }
          }
        });
      }
      // 4. Record Activity
      await tx.activity.create({
        data: {
          userId: session.user?.id || 'system',
          userName: session.user?.name || 'System',
          action: 'UPDATE',
          entityType: 'CREDIT',
          entityId: credit.id,
          entityName: credit.customer.name,
          description: `Updated credit record for ${credit.customer.name}. New status: ${credit.status}. Amount paid: Le ${credit.amountPaid.toLocaleString()}`,
        }
      });

      return credit;
    });

    return NextResponse.json(updatedCredit);
  } catch (error: any) {
    console.error('Error updating credit:', error);
    return NextResponse.json({ error: error.message || 'Failed to update credit' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissionCheck = checkPermission(session.user?.role, Permission.DELETE_CREDITS);
    if (!permissionCheck.allowed) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
    }

    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const credit = await tx.credit.findUnique({
        where: { id }
      });

      if (!credit) return;

      // Subtract remaining debt from customer
      const outstanding = credit.amount - (credit.amountPaid || 0);

      await tx.customer.update({
        where: { id: credit.customerId },
        data: {
          totalDebt: {
            decrement: outstanding
          }
        }
      });

      await tx.credit.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: 'Credit deleted successfully' });
  } catch (error) {
    console.error('Error deleting credit:', error);
    return NextResponse.json({ error: 'Failed to delete credit' }, { status: 500 });
  }
}

