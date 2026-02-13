"use client";

import { useSession } from 'next-auth/react';
import { Permission, UserRole, hasPermission } from '@/lib/roles';

export function usePermissions() {
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole | undefined;

  const checkPermission = (permission: Permission): boolean => {
    if (!userRole) return false;
    return hasPermission(userRole, permission);
  };

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    if (!userRole) return false;
    return permissions.some(permission => hasPermission(userRole, permission));
  };

  const checkAllPermissions = (permissions: Permission[]): boolean => {
    if (!userRole) return false;
    return permissions.every(permission => hasPermission(userRole, permission));
  };

  const isAdmin = (): boolean => {
    return userRole === UserRole.ADMIN;
  };

  const isManagerOrAdmin = (): boolean => {
    return userRole === UserRole.ADMIN || userRole === UserRole.MANAGER;
  };

  return {
    userRole,
    checkPermission,
    hasPermission: checkPermission, // Alias for checkPermission for consistency
    checkAnyPermission,
    checkAllPermissions,
    isAdmin,
    isManagerOrAdmin,
    hasRole: !!userRole,
  };
}

