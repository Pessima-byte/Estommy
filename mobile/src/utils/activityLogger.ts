import { activitiesAPI } from '../api/client';

export type ActivityAction =
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'EXPORT'
    | 'LOGIN'
    | 'LOGOUT'
    | 'VIEW'
    | 'SETTLE'
    | 'RESTORE'
    | 'BACKUP';

export type ActivityEntityType =
    | 'PRODUCT'
    | 'CUSTOMER'
    | 'SALE'
    | 'CREDIT'
    | 'CATEGORY'
    | 'USER'
    | 'PERMISSION'
    | 'SYSTEM'
    | 'DEBTOR';

export interface ActivityLog {
    action: ActivityAction;
    entityType: ActivityEntityType;
    entityId?: string;
    entityName?: string;
    description?: string;
    metadata?: Record<string, any>;
}

/**
 * Centralized activity logger for mobile
 * Logs all user actions to the activity log
 */
export class ActivityLogger {
    /**
     * Log an activity
     */
    static async log(activity: ActivityLog): Promise<void> {
        try {
            await activitiesAPI.create({
                action: activity.action,
                entityType: activity.entityType,
                entityId: activity.entityId,
                entityName: activity.entityName,
                details: activity.description || this.generateDescription(activity),
                metadata: activity.metadata,
                createdAt: new Date().toISOString(),
            } as any);
        } catch (error) {
            // Silent fail - don't break the app if logging fails
            console.error('[ActivityLogger] Failed to log activity:', error);
        }
    }

    /**
     * Generate a human-readable description from the activity
     */
    private static generateDescription(activity: ActivityLog): string {
        const { action, entityType, entityName } = activity;
        const name = entityName || `${entityType.toLowerCase()}`;

        switch (action) {
            case 'CREATE':
                return `Created new ${entityType.toLowerCase()}: ${name}`;
            case 'UPDATE':
                return `Updated ${entityType.toLowerCase()}: ${name}`;
            case 'DELETE':
                return `Deleted ${entityType.toLowerCase()}: ${name}`;
            case 'EXPORT':
                return `Exported ${entityType.toLowerCase()} data`;
            case 'LOGIN':
                return `User logged into the system`;
            case 'LOGOUT':
                return `User logged out of the system`;
            case 'VIEW':
                return `Viewed ${entityType.toLowerCase()}: ${name}`;
            case 'SETTLE':
                return `Settled payment for ${entityType.toLowerCase()}: ${name}`;
            case 'RESTORE':
                return `Restored system data from backup`;
            case 'BACKUP':
                return `Created system backup`;
            default:
                return `Performed ${action} on ${entityType.toLowerCase()}`;
        }
    }

    // Convenience methods for common actions
    static async logCreate(entityType: ActivityEntityType, entityId: string, entityName: string, metadata?: Record<string, any>) {
        return this.log({ action: 'CREATE', entityType, entityId, entityName, metadata });
    }

    static async logUpdate(entityType: ActivityEntityType, entityId: string, entityName: string, metadata?: Record<string, any>) {
        return this.log({ action: 'UPDATE', entityType, entityId, entityName, metadata });
    }

    static async logDelete(entityType: ActivityEntityType, entityId: string, entityName: string) {
        return this.log({ action: 'DELETE', entityType, entityId, entityName });
    }

    static async logExport(entityType: ActivityEntityType, count?: number) {
        return this.log({
            action: 'EXPORT',
            entityType,
            description: count ? `Exported ${count} ${entityType.toLowerCase()} records` : undefined
        });
    }

    static async logView(entityType: ActivityEntityType, entityId: string, entityName: string) {
        return this.log({ action: 'VIEW', entityType, entityId, entityName });
    }

    static async logSettle(entityType: ActivityEntityType, entityId: string, entityName: string, amount?: number) {
        return this.log({
            action: 'SETTLE',
            entityType,
            entityId,
            entityName,
            metadata: amount ? { amount } : undefined
        });
    }

    static async logLogin() {
        return this.log({ action: 'LOGIN', entityType: 'SYSTEM' });
    }

    static async logLogout() {
        return this.log({ action: 'LOGOUT', entityType: 'SYSTEM' });
    }

    static async logBackup() {
        return this.log({ action: 'BACKUP', entityType: 'SYSTEM' });
    }

    static async logRestore() {
        return this.log({ action: 'RESTORE', entityType: 'SYSTEM' });
    }
}
