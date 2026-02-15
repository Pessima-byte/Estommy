import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const MAX_BACKUPS = 30; // Keep last 30 days of backups

// Ensure backup directory exists
async function ensureBackupDir() {
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
}

// Generate backup filename with timestamp
function getBackupFilename(type: 'auto' | 'manual' = 'manual') {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `backup_${type}_${timestamp}_${time}.json`;
}

// Get all backup files
async function getBackupFiles() {
  await ensureBackupDir();
  const files = await fs.readdir(BACKUP_DIR);
  const backupFiles = files.filter(f => f.startsWith('backup_') && f.endsWith('.json'));

  const backups = await Promise.all(
    backupFiles.map(async (filename) => {
      const filePath = path.join(BACKUP_DIR, filename);
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        type: filename.includes('_auto_') ? 'automatic' : 'manual',
        version: data.version || '1.0',
        timestamp: data.timestamp,
      };
    })
  );

  return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
}

// Clean old backups (keep only MAX_BACKUPS most recent)
async function cleanOldBackups() {
  const backups = await getBackupFiles();
  const autoBackups = backups.filter(b => b.type === 'automatic');

  if (autoBackups.length > MAX_BACKUPS) {
    const toDelete = autoBackups.slice(MAX_BACKUPS);
    for (const backup of toDelete) {
      const filePath = path.join(BACKUP_DIR, backup.filename);
      await fs.unlink(filePath);
      console.log(`[Backup] Deleted old backup: ${backup.filename}`);
    }
  }
}

// Create backup data
async function createBackupData() {
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

  return {
    version: '1.2',
    timestamp: new Date().toISOString(),
    stats: {
      products: products.length,
      customers: customers.length,
      sales: sales.length,
      credits: credits.length,
      profits: profits.length,
      categories: categories.length,
      activities: activities.length,
      users: users.length,
    },
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
}

// Save backup to file
async function saveBackupToFile(backupData: any, type: 'auto' | 'manual' = 'manual') {
  await ensureBackupDir();
  const filename = getBackupFilename(type);
  const filePath = path.join(BACKUP_DIR, filename);

  await fs.writeFile(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

  // Clean old backups after saving
  if (type === 'auto') {
    await cleanOldBackups();
  }

  return { filename, path: filePath, size: (await fs.stat(filePath)).size };
}

// GET: Download backup or list backups
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const filename = searchParams.get('filename');

    // List all backups
    if (action === 'list') {
      const backups = await getBackupFiles();
      return NextResponse.json({ backups });
    }

    // Download specific backup
    if (action === 'download' && filename) {
      const filePath = path.join(BACKUP_DIR, filename);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        return new NextResponse(content, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        });
      } catch (error) {
        return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
      }
    }

    // Create and return backup (legacy behavior)
    const backupData = await createBackupData();
    return NextResponse.json(backupData);
  } catch (error) {
    console.error('Error in backup GET:', error);
    return NextResponse.json({ error: 'Failed to process backup request' }, { status: 500 });
  }
}

// POST: Create manual backup or restore from backup
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
    const { action, data, clearExisting = false, filename } = body;

    // Create manual backup
    if (action === 'create') {
      const backupData = await createBackupData();
      const fileInfo = await saveBackupToFile(backupData, 'manual');

      // Log the backup activity
      await prisma.activity.create({
        data: {
          userId: session.user.id,
          userName: session.user.name || 'Admin',
          action: 'BACKUP',
          entityType: 'SYSTEM',
          description: `Manual backup created: ${fileInfo.filename}`,
          metadata: {
            filename: fileInfo.filename,
            size: fileInfo.size,
            stats: backupData.stats,
          },
        },
      });

      return NextResponse.json({
        message: 'Backup created successfully',
        backup: fileInfo,
        stats: backupData.stats,
      });
    }

    // Restore from backup
    if (action === 'restore' && (data || filename)) {
      let backupData = data;

      // If filename provided, load from file
      if (filename) {
        const filePath = path.join(BACKUP_DIR, filename);
        const content = await fs.readFile(filePath, 'utf-8');
        backupData = JSON.parse(content).data;
      }

      if (!backupData || !backupData.products || !backupData.customers) {
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

        // Restore Categories
        if (backupData.categories?.length > 0) {
          await tx.category.createMany({
            data: backupData.categories.map((c: any) => ({
              id: c.id,
              name: c.name,
              description: c.description,
              createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
              updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
            })),
          });
        }

        // Restore Products
        if (backupData.products?.length > 0) {
          await tx.product.createMany({
            data: backupData.products.map((p: any) => ({
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
        if (backupData.customers?.length > 0) {
          await tx.customer.createMany({
            data: backupData.customers.map((c: any) => ({
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
        if (backupData.sales?.length > 0) {
          await tx.sale.createMany({
            data: backupData.sales.map((s: any) => ({
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
        if (backupData.credits?.length > 0) {
          await tx.credit.createMany({
            data: backupData.credits.map((c: any) => ({
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
        if (backupData.profits?.length > 0) {
          await tx.profit.createMany({
            data: backupData.profits.map((p: any) => ({
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

        // Restore Activities (excluding the current restore activity)
        if (backupData.activities?.length > 0) {
          await tx.activity.createMany({
            data: backupData.activities.map((a: any) => ({
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

      // Log the restore activity
      await prisma.activity.create({
        data: {
          userId: session.user.id,
          userName: session.user.name || 'Admin',
          action: 'RESTORE',
          entityType: 'SYSTEM',
          description: filename
            ? `System restored from backup: ${filename}`
            : 'System restored from uploaded backup',
          metadata: filename ? { filename } : {},
        },
      });

      return NextResponse.json({ message: 'System restored successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in backup POST:', error);
    return NextResponse.json({ error: 'Failed to process backup request' }, { status: 500 });
  }
}

// DELETE: Delete specific backup file
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename required' }, { status: 400 });
    }

    // Prevent deletion of automatic backups less than 7 days old
    if (filename.includes('_auto_')) {
      const filePath = path.join(BACKUP_DIR, filename);
      const stats = await fs.stat(filePath);
      const daysSinceCreation = (Date.now() - stats.birthtime.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceCreation < 7) {
        return NextResponse.json({
          error: 'Cannot delete automatic backups less than 7 days old'
        }, { status: 403 });
      }
    }

    const filePath = path.join(BACKUP_DIR, filename);
    await fs.unlink(filePath);

    // Log the deletion
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        userName: session.user.name || 'Admin',
        action: 'DELETE',
        entityType: 'SYSTEM',
        description: `Deleted backup: ${filename}`,
        metadata: { filename },
      },
    });

    return NextResponse.json({ message: 'Backup deleted successfully' });
  } catch (error) {
    console.error('Error deleting backup:', error);
    return NextResponse.json({ error: 'Failed to delete backup' }, { status: 500 });
  }
}
