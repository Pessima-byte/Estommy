import { Permission, hasPermission, UserRole } from './roles';

// Permission checking utility for API routes
export function checkPermission(
  userRole: string | undefined,
  requiredPermission: Permission
): { allowed: boolean; error?: string } {
  if (!userRole) {
    return { allowed: false, error: 'Unauthorized - No role assigned' };
  }

  const role = userRole as UserRole;
  
  if (!Object.values(UserRole).includes(role)) {
    return { allowed: false, error: 'Invalid user role' };
  }

  if (!hasPermission(role, requiredPermission)) {
    return {
      allowed: false,
      error: `Access denied - Requires permission: ${requiredPermission}`,
    };
  }

  return { allowed: true };
}

// Check multiple permissions (any of them)
export function checkAnyPermission(
  userRole: string | undefined,
  requiredPermissions: Permission[]
): { allowed: boolean; error?: string } {
  if (!userRole) {
    return { allowed: false, error: 'Unauthorized - No role assigned' };
  }

  const role = userRole as UserRole;
  
  if (!Object.values(UserRole).includes(role)) {
    return { allowed: false, error: 'Invalid user role' };
  }

  const hasAny = requiredPermissions.some(permission =>
    hasPermission(role, permission)
  );

  if (!hasAny) {
    return {
      allowed: false,
      error: `Access denied - Requires one of: ${requiredPermissions.join(', ')}`,
    };
  }

  return { allowed: true };
}

// Check if user is admin
export function requireAdmin(userRole: string | undefined): { allowed: boolean; error?: string } {
  if (!userRole) {
    return { allowed: false, error: 'Unauthorized' };
  }

  if (userRole !== UserRole.ADMIN) {
    return { allowed: false, error: 'Access denied - Admin role required' };
  }

  return { allowed: true };
}

// Check if user is manager or admin
export function requireManagerOrAdmin(userRole: string | undefined): { allowed: boolean; error?: string } {
  if (!userRole) {
    return { allowed: false, error: 'Unauthorized' };
  }

  if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
    return { allowed: false, error: 'Access denied - Manager or Admin role required' };
  }

  return { allowed: true };
}



