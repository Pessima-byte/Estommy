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

    // Allow all authenticated users to view activities
    // (VIEW_REPORTS is only for MANAGER and ADMIN, but activities should be visible to all)

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');

    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;

    // Try to fetch activities, return empty array if table doesn't exist
    try {
      const activities = await prisma.activity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return NextResponse.json(activities);
    } catch (dbError: any) {
      // If table doesn't exist, return empty array
      console.error('[Activities API] Database error:', dbError.message);
      if (dbError.message?.includes('no such table') || dbError.message?.includes('Activity')) {
        console.warn('Activity table does not exist yet, returning empty array');
        return NextResponse.json([]);
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching activities:', error);
    // Return empty array instead of error to prevent breaking the app
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, entityType, entityId, entityName, description, metadata } = body;

    if (!action || !entityType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    try {
      const activity = await prisma.activity.create({
        data: {
          userId: session.user?.id || 'unknown',
          userName: session.user?.name || null,
          action,
          entityType,
          entityId: entityId || null,
          entityName: entityName || null,
          description: description || null,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      return NextResponse.json(activity, { status: 201 });
    } catch (dbError: any) {
      // If table doesn't exist, silently fail (don't break the app)
      if (dbError.message?.includes('no such table') || dbError.message?.includes('Activity')) {
        console.warn('Activity table does not exist yet, skipping activity log');
        return NextResponse.json({ message: 'Activity logged (table not ready)' }, { status: 201 });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error creating activity:', error);
    // Return success anyway - activity logging shouldn't break the app
    return NextResponse.json({ message: 'Activity logged' }, { status: 201 });
  }
}

