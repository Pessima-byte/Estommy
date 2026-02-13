import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import { Permission } from '@/lib/roles';
import { customerSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const isDev = process.env.NODE_ENV === 'development';

    if (!session && !isDev) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session) {
      const permissionCheck = checkPermission(session.user?.role, Permission.VIEW_CUSTOMERS);
      if (!permissionCheck.allowed) {
        return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    const where: any = {};
    if (email) where.email = email;
    if (phone) where.phone = phone;

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissionCheck = checkPermission(session.user?.role, Permission.CREATE_CUSTOMERS);
    if (!permissionCheck.allowed) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
    }

    const body = await request.json();

    // Validate with Zod
    const validation = customerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.format()
      }, { status: 400 });
    }

    const { name, email, phone, gender, address, signature, status, avatar, attachment } = body; // Keep body for optional fields not in schema or extend schema

    // Check for duplicate name
    const existingName = await prisma.customer.findFirst({
      where: { name },
    });
    if (existingName) {
      return NextResponse.json({
        error: `A customer with this name already exists`
      }, { status: 400 });
    }

    // Check for duplicate email (if provided)
    if (email && email.trim() !== '') {
      const existingEmail = await prisma.customer.findFirst({
        where: { email },
      });
      if (existingEmail) {
        return NextResponse.json({
          error: `A customer with this email already exists`
        }, { status: 400 });
      }
    }

    // Check for duplicate phone (if provided)
    if (phone && phone.trim() !== '') {
      const existingPhone = await prisma.customer.findFirst({
        where: { phone },
      });
      if (existingPhone) {
        return NextResponse.json({
          error: `A customer with this phone number already exists`
        }, { status: 400 });
      }
    }

    // Check for duplicate signature (if provided)
    if (signature && signature.trim() !== '') {
      const existingSignature = await prisma.customer.findFirst({
        where: { signature },
      });
      if (existingSignature) {
        return NextResponse.json({
          error: `A customer with this signature already exists`
        }, { status: 400 });
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        gender: gender || null,
        address: address || null,
        signature: signature || null,
        status: status || 'Active',
        avatar: avatar || null,
        attachment: attachment || null,
        totalDebt: body.totalDebt ? parseFloat(body.totalDebt) : 0,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return NextResponse.json({
        error: `A customer with this ${field} already exists`
      }, { status: 400 });
    }
    // Return more detailed error message
    const errorMessage = error.message || 'Failed to create customer';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

