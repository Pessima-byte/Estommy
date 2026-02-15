import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key-here';
const BACKUP_BUCKET = 'backups';

// Ensure backup bucket exists
async function ensureBackupBucket() {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;

    if (!buckets.find(b => b.name === BACKUP_BUCKET)) {
        console.log('[AutoBackup] Creating backups bucket...');
        const { error: createError } = await supabase.storage.createBucket(BACKUP_BUCKET, {
            public: false, // Keep backups private
            fileSizeLimit: 52428800, // 50MB
        });
        if (createError) throw createError;
    }
}

// Generate backup filename with timestamp
function getBackupFilename() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    return `backup_auto_${timestamp}_${time}.json`;
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
            take: 1000,
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

// Clean old backups (keep only last 30)
async function cleanOldBackups() {
    const { data: files, error } = await supabase.storage
        .from(BACKUP_BUCKET)
        .list('', {
            limit: 100,
            sortBy: { column: 'created_at', order: 'desc' }
        });

    if (error) {
        console.error('[AutoBackup] Error listing backups for cleanup:', error);
        return;
    }

    const autoBackups = files.filter(f => f.name.startsWith('backup_auto_'));
    const MAX_BACKUPS = 30;

    if (autoBackups.length > MAX_BACKUPS) {
        const toDelete = autoBackups.slice(MAX_BACKUPS).map(f => f.name);
        const { error: deleteError } = await supabase.storage
            .from(BACKUP_BUCKET)
            .remove(toDelete);

        if (deleteError) {
            console.error('[AutoBackup] Error deleting old backups:', deleteError);
        } else {
            console.log(`[AutoBackup] Deleted ${toDelete.length} old backups.`);
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const providedSecret = authHeader?.replace('Bearer ', '');

        if (providedSecret !== CRON_SECRET) {
            console.error('[AutoBackup] Unauthorized backup attempt');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[AutoBackup] Starting automatic backup to Supabase...');
        const startTime = Date.now();

        // 1. Ensure bucket exists
        await ensureBackupBucket();

        // 2. Create backup data
        const backupData = await createBackupData();
        const jsonContent = JSON.stringify(backupData, null, 2);
        const filename = getBackupFilename();

        // 3. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from(BACKUP_BUCKET)
            .upload(filename, jsonContent, {
                contentType: 'application/json',
                upsert: true
            });

        if (uploadError) throw uploadError;

        // 4. Clean old backups
        await cleanOldBackups();

        const duration = Date.now() - startTime;
        const fileSize = Buffer.byteLength(jsonContent);

        // 5. Log the backup activity in DB
        await prisma.activity.create({
            data: {
                userId: 'system',
                userName: 'System',
                action: 'BACKUP',
                entityType: 'SYSTEM',
                description: `Automatic daily backup saved to cloud: ${filename}`,
                metadata: JSON.stringify({
                    filename,
                    size: fileSize,
                    stats: backupData.stats,
                    duration,
                    type: 'automatic',
                }),
            },
        });

        console.log(`[AutoBackup] Cloud backup completed in ${duration}ms: ${filename}`);

        return NextResponse.json({
            success: true,
            message: 'Automatic cloud backup completed successfully',
            backup: {
                filename,
                size: fileSize,
                stats: backupData.stats,
                duration,
            },
        });
    } catch (error) {
        console.error('[AutoBackup] Failed to create automatic backup:', error);

        try {
            await prisma.activity.create({
                data: {
                    userId: 'system',
                    userName: 'System',
                    action: 'BACKUP',
                    entityType: 'SYSTEM',
                    description: 'Automatic cloud backup failed',
                    metadata: JSON.stringify({
                        error: error instanceof Error ? error.message : 'Unknown error',
                        type: 'automatic',
                    }),
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

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const providedSecret = authHeader?.replace('Bearer ', '');

        if (providedSecret !== CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: files, error } = await supabase.storage
            .from(BACKUP_BUCKET)
            .list('', {
                limit: 50,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (error && error.message !== 'Bucket not found') {
            throw error;
        }

        const backups = files || [];
        const lastBackup = backups[0];

        return NextResponse.json({
            configured: true,
            storageType: 'Supabase Cloud',
            totalBackups: backups.length,
            lastBackup: lastBackup ? {
                filename: lastBackup.name,
                size: lastBackup.metadata?.size,
                created: lastBackup.created_at,
            } : null,
            nextScheduled: 'Daily at 2:00 AM UTC',
            retention: 'Last 30 days',
        });
    } catch (error) {
        console.error('[AutoBackup] Failed to get backup status:', error);
        return NextResponse.json({ error: 'Failed to get backup status' }, { status: 500 });
    }
}

