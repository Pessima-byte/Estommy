// User Roles
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
}

// Permissions
export enum Permission {
  // Products
  VIEW_PRODUCTS = 'VIEW_PRODUCTS',
  CREATE_PRODUCTS = 'CREATE_PRODUCTS',
  EDIT_PRODUCTS = 'EDIT_PRODUCTS',
  DELETE_PRODUCTS = 'DELETE_PRODUCTS',

  // Customers
  VIEW_CUSTOMERS = 'VIEW_CUSTOMERS',
  CREATE_CUSTOMERS = 'CREATE_CUSTOMERS',
  EDIT_CUSTOMERS = 'EDIT_CUSTOMERS',
  DELETE_CUSTOMERS = 'DELETE_CUSTOMERS',

  // Sales
  VIEW_SALES = 'VIEW_SALES',
  CREATE_SALES = 'CREATE_SALES',
  EDIT_SALES = 'EDIT_SALES',
  DELETE_SALES = 'DELETE_SALES',

  // Credits
  VIEW_CREDITS = 'VIEW_CREDITS',
  CREATE_CREDITS = 'CREATE_CREDITS',
  EDIT_CREDITS = 'EDIT_CREDITS',
  DELETE_CREDITS = 'DELETE_CREDITS',
  VIEW_DEBTORS = 'VIEW_DEBTORS',

  // Profits
  VIEW_PROFITS = 'VIEW_PROFITS',
  CREATE_PROFITS = 'CREATE_PROFITS',
  EDIT_PROFITS = 'EDIT_PROFITS',
  DELETE_PROFITS = 'DELETE_PROFITS',

  // Stock
  VIEW_STOCK = 'VIEW_STOCK',
  EDIT_STOCK = 'EDIT_STOCK',

  // Users
  VIEW_USERS = 'VIEW_USERS',
  CREATE_USERS = 'CREATE_USERS',
  EDIT_USERS = 'EDIT_USERS',
  DELETE_USERS = 'DELETE_USERS',

  // System
  VIEW_REPORTS = 'VIEW_REPORTS',
  EXPORT_DATA = 'EXPORT_DATA',
  BACKUP_RESTORE = 'BACKUP_RESTORE',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
}

// Role to Permissions mapping
export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admin has all permissions
    ...Object.values(Permission),
  ],
  [UserRole.MANAGER]: [
    // Products
    Permission.VIEW_PRODUCTS,
    Permission.CREATE_PRODUCTS,
    Permission.EDIT_PRODUCTS,
    Permission.DELETE_PRODUCTS,
    // Customers
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMERS,
    Permission.EDIT_CUSTOMERS,
    Permission.DELETE_CUSTOMERS,
    // Sales
    Permission.VIEW_SALES,
    Permission.CREATE_SALES,
    Permission.EDIT_SALES,
    Permission.DELETE_SALES,
    // Credits
    Permission.VIEW_CREDITS,
    Permission.CREATE_CREDITS,
    Permission.EDIT_CREDITS,
    Permission.DELETE_CREDITS,
    Permission.VIEW_DEBTORS,
    // Profits
    Permission.VIEW_PROFITS,
    Permission.CREATE_PROFITS,
    Permission.EDIT_PROFITS,
    Permission.DELETE_PROFITS,
    // Stock
    Permission.VIEW_STOCK,
    Permission.EDIT_STOCK,
    // Reports
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
  ],
  [UserRole.USER]: [
    // Users can only view and create
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_CUSTOMERS,
    Permission.VIEW_SALES,
    Permission.CREATE_SALES,
    Permission.VIEW_CREDITS,
    Permission.VIEW_PROFITS,
    Permission.VIEW_STOCK,
    Permission.VIEW_DEBTORS,
  ],
};

// Check if a role has a specific permission
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

// Check if user has any of the required permissions
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

// Check if user has all required permissions
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

// Get all permissions for a role
export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] ?? [];
}

// Check if role is admin
export function isAdmin(role: string): boolean {
  return role === UserRole.ADMIN;
}

// Check if role is manager or admin
export function isManagerOrAdmin(role: string): boolean {
  return role === UserRole.ADMIN || role === UserRole.MANAGER;
}



