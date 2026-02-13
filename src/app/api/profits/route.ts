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

    const permissionCheck = checkPermission(session.user?.role, Permission.VIEW_PROFITS);
    if (!permissionCheck.allowed) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
    }

    const profits = await prisma.profit.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(profits);
  } catch (error) {
    console.error('Error fetching profits:', error);
    return NextResponse.json({ error: 'Failed to fetch profits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissionCheck = checkPermission(session.user?.role, Permission.CREATE_PROFITS);
    if (!permissionCheck.allowed) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
    }

    const body = await request.json();
    const { date, amount, type, description } = body;

    if (!date || amount === undefined || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const profit = await prisma.profit.create({
      data: {
        date,
        amount: parseFloat(amount),
        type,
        description: description || null,
      },
    });

    return NextResponse.json(profit, { status: 201 });
  } catch (error) {
    console.error('Error creating profit:', error);
    return NextResponse.json({ error: 'Failed to create profit' }, { status: 500 });
  }
}

