// Utility function to log activities
// This can be called from anywhere in the app

export async function logActivity(data: {
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: any;
  description?: any;
  metadata?: any;
}) {
  try {
    // Sanitize data to ensure strings are passed for name and description
    const sanitizedData = {
      ...data,
      entityName: typeof data.entityName === 'object' && data.entityName !== null
        ? (data.entityName.name || data.entityName.label || JSON.stringify(data.entityName))
        : String(data.entityName || ''),
      description: typeof data.description === 'object' && data.description !== null
        ? JSON.stringify(data.description)
        : String(data.description || ''),
    };

    await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedData),
    });
  } catch (error) {
    // Silently fail - activity logging shouldn't break the app
    console.error('Failed to log activity:', error);
  }
}

// Helper functions for common activity types
export const ActivityLogger = {
  product: {
    created: (name: string, id: string) => logActivity({
      action: 'CREATE',
      entityType: 'PRODUCT',
      entityId: id,
      entityName: name,
      description: `Product "${name}" was created`,
    }),
    updated: (name: string, id: string) => logActivity({
      action: 'UPDATE',
      entityType: 'PRODUCT',
      entityId: id,
      entityName: name,
      description: `Product "${name}" was updated`,
    }),
    deleted: (name: string, id: string) => logActivity({
      action: 'DELETE',
      entityType: 'PRODUCT',
      entityId: id,
      entityName: name,
      description: `Product "${name}" was deleted`,
    }),
  },
  customer: {
    created: (name: string, id: string) => logActivity({
      action: 'CREATE',
      entityType: 'CUSTOMER',
      entityId: id,
      entityName: name,
      description: `Customer "${name}" was created`,
    }),
    updated: (name: string, id: string) => logActivity({
      action: 'UPDATE',
      entityType: 'CUSTOMER',
      entityId: id,
      entityName: name,
      description: `Customer "${name}" was updated`,
    }),
    deleted: (name: string, id: string) => logActivity({
      action: 'DELETE',
      entityType: 'CUSTOMER',
      entityId: id,
      entityName: name,
      description: `Customer "${name}" was deleted`,
    }),
  },
  sale: {
    created: (description: string, id: string, amount: number) => logActivity({
      action: 'CREATE',
      entityType: 'SALE',
      entityId: id,
      entityName: description,
      description: `Sale of $${amount.toFixed(2)} was created`,
      metadata: { amount },
    }),
    updated: (description: string, id: string) => logActivity({
      action: 'UPDATE',
      entityType: 'SALE',
      entityId: id,
      entityName: description,
      description: `Sale "${description}" was updated`,
    }),
    deleted: (description: string, id: string) => logActivity({
      action: 'DELETE',
      entityType: 'SALE',
      entityId: id,
      entityName: description,
      description: `Sale "${description}" was deleted`,
    }),
  },
  credit: {
    created: (customer: string, id: string, amount: number) => logActivity({
      action: 'CREATE',
      entityType: 'CREDIT',
      entityId: id,
      entityName: customer,
      description: `Credit of $${amount.toFixed(2)} for "${customer}" was created`,
      metadata: { amount, customer },
    }),
    updated: (customer: string, id: string) => logActivity({
      action: 'UPDATE',
      entityType: 'CREDIT',
      entityId: id,
      entityName: customer,
      description: `Credit for "${customer}" was updated`,
    }),
    deleted: (customer: string, id: string) => logActivity({
      action: 'DELETE',
      entityType: 'CREDIT',
      entityId: id,
      entityName: customer,
      description: `Credit for "${customer}" was deleted`,
    }),
  },
  profit: {
    created: (description: string, id: string, amount: number) => logActivity({
      action: 'CREATE',
      entityType: 'PROFIT',
      entityId: id,
      entityName: description,
      description: `Profit record "${description}" ($${amount.toFixed(2)}) was created`,
      metadata: { amount },
    }),
    updated: (description: string, id: string) => logActivity({
      action: 'UPDATE',
      entityType: 'PROFIT',
      entityId: id,
      entityName: description,
      description: `Profit record "${description}" was updated`,
    }),
    deleted: (description: string, id: string) => logActivity({
      action: 'DELETE',
      entityType: 'PROFIT',
      entityId: id,
      entityName: description,
      description: `Profit record "${description}" was deleted`,
    }),
  },
  user: {
    created: (name: string, id: string) => logActivity({
      action: 'CREATE',
      entityType: 'USER',
      entityId: id,
      entityName: name,
      description: `User "${name}" was created`,
    }),
    updated: (name: string, id: string) => logActivity({
      action: 'UPDATE',
      entityType: 'USER',
      entityId: id,
      entityName: name,
      description: `User "${name}" was updated`,
    }),
    deleted: (name: string, id: string) => logActivity({
      action: 'DELETE',
      entityType: 'USER',
      entityId: id,
      entityName: name,
      description: `User "${name}" was deleted`,
    }),
  },
};



