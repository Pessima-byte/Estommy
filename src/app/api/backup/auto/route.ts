import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key-here';

// Ensure backup directory exists
async function ensureBackupDir() {
    try {
        await fs.access(BACKUP_DIR);
    } catch {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
    }
}

// Generate backup filename with timestamp
function getBackupFilename() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    return `backup_auto_${timestamp}_${time}.json`;
}

// Clean old backups (keep only last 30 days)
async function cleanOldBackups() {
    await ensureBackupDir();
    const files = await fs.readdir(BACKUP_DIR);
    const autoBackups = files.filter(f => f.startsWith('backup_auto_') && f.endsWith('.json'));

    const backupsWithStats = await Promise.all(
        autoBackups.map(async (filename) => {
            const filePath = path.join(BACKUP_DIR, filename);
            const stats = await fs.stat(filePath);
            return { filename, created: stats.birthtime };
        })
    );

    // Sort by creation date (newest first)
    backupsWithStats.sort((a, b) => b.created.getTime() - a.created.getTime());

    // Keep only last 30 backups
    const MAX_BACKUPS = 30;
    if (backupsWithStats.length > MAX_BACKUPS) {
        const toDelete = backupsWithStats.slice(MAX_BACKUPS);
        for (const backup of toDelete) {
            const filePath = path.join(BACKUP_DIR, backup.filename);
            await fs.unlink(filePath);
            console.log(`[AutoBackup] Deleted old backup: ${backup.filename}`);
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
        prisma.activity.findMany({
            orderBy: { createdAt: 'desc' },
            take: 1000, // Keep last 1000 activities to prevent huge backups
        }),
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
        type: 'automatic',
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
async function saveBackupToFile(backupData: any) {
    await ensureBackupDir();
    const filename = getBackupFilename();
    const filePath = path.join(BACKUP_DIR, filename);

    await fs.writeFile(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

    const stats = await fs.stat(filePath);
    return { filename, path: filePath, size: stats.size };
}

/**
 * Automatic Daily Backup Cron Job
 * This endpoint should be called daily by a cron service (e.g., Vercel Cron, GitHub Actions)
 * 
 * Security: Requires CRON_SECRET in Authorization header
 * 
 * To set up:
 * 1. Add CRON_SECRET to your .env file
 * 2. Configure your cron service to call this endpoint daily at a specific time
 * 3. Example: Daily at 2 AM UTC
 */
export async function POST(request: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        const providedSecret = authHeader?.replace('Bearer ', '');

        if (providedSecret !== CRON_SECRET) {
            console.error('[AutoBackup] Unauthorized backup attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[AutoBackup] Starting automatic backup...');
        const startTime = Date.now();

        // Create backup data
        const backupData = await createBackupData();

        // Save to file
        const fileInfo = await saveBackupToFile(backupData);

        // Clean old backups
        await cleanOldBackups();

        // Log the backup activity
        await prisma.activity.create({
            data: {
                userId: 'system',
                userName: 'System',
                action: 'BACKUP',
                entityType: 'SYSTEM',
                description: `Automatic daily backup completed: ${fileInfo.filename}`,
                metadata: {
                    filename: fileInfo.filename,
                    size: fileInfo.size,
                    stats: backupData.stats,
                    duration: Date.now() - startTime,
                    type: 'automatic',
                },
            },
        });

        const duration = Date.now() - startTime;
        console.log(`[AutoBackup] Backup completed in ${duration}ms: ${fileInfo.filename}`);

        return NextResponse.json({
            success: true,
            message: 'Automatic backup completed successfully',
            backup: {
                filename: fileInfo.filename,
                size: fileInfo.size,
                stats: backupData.stats,
                duration,
            },
        });
    } catch (error) {
        console.error('[AutoBackup] Failed to create automatic backup:', error);

        // Log the failure
        try {
            await prisma.activity.create({
                data: {
                    userId: 'system',
                    userName: 'System',
                    action: 'BACKUP',
                    entityType: 'SYSTEM',
                    description: 'Automatic backup failed',
                    metadata: {
                        error: error instanceof Error ? error.message : 'Unknown error',
                        type: 'automatic',
                    },
                },
            });
        } catch (logError) {
            console.error('[AutoBackup] Failed to log backup failure:', logError);
        }

        return NextResponse.json({
            success: false,
            error: 'Failed to create automatic backup',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// GET: Check backup status and configuration
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const providedSecret = authHeader?.replace('Bearer ', '');

        if (providedSecret !== CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await ensureBackupDir();
        const files = await fs.readdir(BACKUP_DIR);
        const autoBackups = files.filter(f => f.startsWith('backup_auto_') && f.endsWith('.json'));

        const backupsWithStats = await Promise.all(
            autoBackups.map(async (filename) => {
                const filePath = path.join(BACKUP_DIR, filename);
                const stats = await fs.stat(filePath);
                return {
                    filename,
                    size: stats.size,
                    created: stats.birthtime,
                };
            })
        );

        backupsWithStats.sort((a, b) => b.created.getTime() - a.created.getTime());

        const lastBackup = backupsWithStats[0];
        const totalSize = backupsWithStats.reduce((sum, b) => sum + b.size, 0);

        return NextResponse.json({
            configured: true,
            totalBackups: backupsWithStats.length,
            totalSize,
            lastBackup: lastBackup ? {
                filename: lastBackup.filename,
                size: lastBackup.size,
                created: lastBackup.created,
                age: Date.now() - lastBackup.created.getTime(),
            } : null,
            nextScheduled: 'Daily at 2:00 AM UTC',
            retentionDays: 30,
        });
    } catch (error) {
        console.error('[AutoBackup] Failed to get backup status:', error);
        return NextResponse.json({ error: 'Failed to get backup status' }, { status: 500 });
    }
}
