import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { checkPermission } from '@/lib/permissions';
import { Permission } from '@/lib/roles';
import { verifyJwt } from '@/lib/jwt';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

async function getSession(request: NextRequest) {
  // 1. Try Mobile Bearer Token first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyJwt(token);
    if (decoded) {
      return {
        user: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          name: decoded.name,
        }
      };
    }
  }

  // 2. Fallback to standard session (for website)
  return await auth();
}

export async function GET(request: NextRequest, { params }: any) {
  try {
    const session = await getSession(request);
    const { id } = await params;
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    return NextResponse.json(category, { headers: corsHeaders });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request: NextRequest, { params }: any) {
  try {
    const session = await getSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

    const permissionCheck = checkPermission(session.user?.role, Permission.EDIT_PRODUCTS);
    if (!permissionCheck.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });

    const { id } = await params;
    const body = await request.json();
    const category = await prisma.category.update({
      where: { id },
      data: { name: body.name.trim(), description: body.description?.trim() || null },
    });
    return NextResponse.json(category, { headers: corsHeaders });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: any
) {
  console.log('--- [SERVER] DELETE REQUEST RECEIVED ---');
  try {
    const session = await getSession(request);
    console.log('--- [SERVER] SESSION CHECKED ---');
    console.log('User:', session?.user?.email);
    console.log('Role:', session?.user?.role);

    if (!session) {
      console.log('--- [SERVER] UNAUTHORIZED ---');
      return NextResponse.json({ error: 'Unauthorized login required' }, { status: 401, headers: corsHeaders });
    }

    const permissionCheck = checkPermission(
      session.user?.role,
      Permission.DELETE_PRODUCTS
    );

    if (!permissionCheck.allowed) {
      console.log('--- [SERVER] FORBIDDEN ---');
      return NextResponse.json(
        { error: 'Insufficient permissions. You need to be an admin or manager.' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { id } = await params;
    console.log('--- [SERVER] TARGET ID:', id);

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      console.log('--- [SERVER] CATEGORY NOT FOUND (ALREADY DELETED?) ---');
      return NextResponse.json({ success: true, message: 'Already deleted' }, { headers: corsHeaders });
    }

    const productsUsingCategory = await prisma.product.count({
      where: { category: category.name },
    });
    console.log('--- [SERVER] PRODUCT COUNT:', productsUsingCategory);

    if (productsUsingCategory > 0) {
      console.log('--- [SERVER] SAFETY LOCK TRIGGERED ---');
      return NextResponse.json(
        { error: `Safety Lock: Cannot delete category while ${productsUsingCategory} product(s) are using it.` },
        { status: 400, headers: corsHeaders }
      );
    }

    try {
      await prisma.category.delete({
        where: { id },
      });
      console.log('--- [SERVER] DELETE SUCCESS ---');
    } catch (dbError: any) {
      console.error('--- [SERVER] DB DELETE ERROR:', dbError);
      if (dbError.code === 'P2003') {
        return NextResponse.json(
          { error: 'Cannot delete category because it is referenced by other records (e.g. products or sales).' },
          { status: 400, headers: corsHeaders }
        );
      }
      throw dbError;
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('--- [SERVER] EXCEPTION:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
