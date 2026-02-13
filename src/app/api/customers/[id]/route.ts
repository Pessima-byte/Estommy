import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import { Permission } from '@/lib/roles';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissionCheck = checkPermission(session.user?.role, Permission.VIEW_CUSTOMERS);
    if (!permissionCheck.allowed) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
    }

    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissionCheck = checkPermission(session.user?.role, Permission.EDIT_CUSTOMERS);
    if (!permissionCheck.allowed) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, gender, address, signature, status, avatar, attachment } = body;

    // Check for duplicates if name, email, phone, or signature are being updated
    if (name && name.trim() !== '') {
      const existingName = await prisma.customer.findFirst({
        where: {
          name: name.trim(),
          NOT: { id }
        },
      });
      if (existingName) {
        return NextResponse.json({
          error: `A customer with this name already exists`
        }, { status: 400 });
      }
    }

    if (email && email.trim() !== '') {
      const existingEmail = await prisma.customer.findFirst({
        where: {
          email: email.trim(),
          NOT: { id }
        },
      });
      if (existingEmail) {
        return NextResponse.json({
          error: `A customer with this email already exists`
        }, { status: 400 });
      }
    }

    if (phone && phone.trim() !== '') {
      const existingPhone = await prisma.customer.findFirst({
        where: {
          phone: phone.trim(),
          NOT: { id }
        },
      });
      if (existingPhone) {
        return NextResponse.json({
          error: `A customer with this phone number already exists`
        }, { status: 400 });
      }
    }

    if (signature && signature.trim() !== '') {
      const existingSignature = await prisma.customer.findFirst({
        where: {
          signature: signature.trim(),
          NOT: { id }
        },
      });
      if (existingSignature) {
        return NextResponse.json({
          error: `A customer with this signature already exists`
        }, { status: 400 });
      }
    }

    // Build update data object, only including fields that are provided
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (gender !== undefined) updateData.gender = gender || null;
    if (address !== undefined) updateData.address = address || null;
    if (signature !== undefined) updateData.signature = signature || null;
    if (status !== undefined) updateData.status = status;
    if (avatar !== undefined) updateData.avatar = avatar || null;
    if (attachment !== undefined) updateData.attachment = attachment || null;
    if (body.totalDebt !== undefined) updateData.totalDebt = parseFloat(body.totalDebt);

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('Error updating customer:', error);
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      return NextResponse.json({
        error: `A customer with this ${field} already exists`
      }, { status: 400 });
    }
    const errorMessage = error.message || 'Failed to update customer';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
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

    const permissionCheck = checkPermission(session.user?.role, Permission.DELETE_CUSTOMERS);
    if (!permissionCheck.allowed) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 403 });
    }

    const { id } = await params;
    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}

