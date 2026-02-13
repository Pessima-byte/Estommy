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

    const permissionCheck = checkPermission(session.user?.role, Permission.EDIT_PROFITS);
    if (!permissionCheck.allowed) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { date, amount, type, description } = body;

    const profit = await prisma.profit.update({
      where: { id },
      data: {
        ...(date && { date }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(type && { type }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(profit);
  } catch (error) {
    console.error('Error updating profit:', error);
    return NextResponse.json({ error: 'Failed to update profit' }, { status: 500 });
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

    const permissionCheck = checkPermission(session.user?.role, Permission.DELETE_PROFITS);
    if (!permissionCheck.allowed) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
    }

    const { id } = await params;
    await prisma.profit.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Profit deleted successfully' });
  } catch (error) {
    console.error('Error deleting profit:', error);
    return NextResponse.json({ error: 'Failed to delete profit' }, { status: 500 });
  }
}

