import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET current user's profile
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        role: true,
        provider: true,
        notifications: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, password, image, phone, notifications } = body;

    console.log(`[Profile API] Update request for user: ${session.user.id}`, { name, email, image, hasPassword: !!password });

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (image !== undefined) updateData.image = image;
    if (phone !== undefined) updateData.phone = phone;
    if (notifications !== undefined) updateData.notifications = !!notifications;

    if (password && password.trim().length > 0) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id as string },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        image: true,
        role: true,
        provider: true,
        notifications: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`[Profile API] Successfully updated user: ${user.id}`);
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('[Profile API] Error updating profile:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Constraint error: Email/Phone already in use' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

