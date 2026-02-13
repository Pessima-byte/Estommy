"use client";

import { useSession } from 'next-auth/react';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission, UserRole, rolePermissions } from '@/lib/roles';

export default function PermissionsPage() {
  const { data: session } = useSession();
  const {
    userRole,
    checkPermission,
    isAdmin,
    isManagerOrAdmin
  } = usePermissions();

  // Helper checks
  const canView = checkPermission(Permission.VIEW_PRODUCTS);
  const canCreate = checkPermission(Permission.CREATE_PRODUCTS);
  const canEdit = checkPermission(Permission.EDIT_PRODUCTS);
  const canDelete = checkPermission(Permission.DELETE_PRODUCTS);
  const canExport = checkPermission(Permission.EXPORT_DATA);
  const canManageUsers = checkPermission(Permission.VIEW_USERS) || checkPermission(Permission.CREATE_USERS);

  // Get all permissions for the current role
  const currentRolePermissions = userRole ? rolePermissions[userRole as UserRole] || [] : [];

  // All available permissions
  const allPermissions = Object.values(Permission);

  // Group permissions by category
  const permissionGroups = {
    Products: [
      Permission.VIEW_PRODUCTS,
      Permission.CREATE_PRODUCTS,
      Permission.EDIT_PRODUCTS,
      Permission.DELETE_PRODUCTS,
    ],
    Customers: [
      Permission.VIEW_CUSTOMERS,
      Permission.CREATE_CUSTOMERS,
      Permission.EDIT_CUSTOMERS,
      Permission.DELETE_CUSTOMERS,
    ],
    Sales: [
      Permission.VIEW_SALES,
      Permission.CREATE_SALES,
      Permission.EDIT_SALES,
      Permission.DELETE_SALES,
    ],
    Stock: [
      Permission.VIEW_STOCK,
      Permission.EDIT_PRODUCTS, // Stock editing uses EDIT_PRODUCTS
    ],
    Credits: [
      Permission.VIEW_CREDITS,
      Permission.CREATE_CREDITS,
      Permission.EDIT_CREDITS,
      Permission.DELETE_CREDITS,
    ],
    Profits: [
      Permission.VIEW_PROFITS,
      Permission.CREATE_PROFITS,
      Permission.EDIT_PROFITS,
      Permission.DELETE_PROFITS,
    ],
    Users: [
      Permission.VIEW_USERS,
      Permission.CREATE_USERS,
      Permission.EDIT_USERS,
      Permission.DELETE_USERS,
    ],
    System: [
      Permission.EXPORT_DATA,
      Permission.VIEW_USERS,
      Permission.CREATE_USERS,
      Permission.EDIT_USERS,
      Permission.DELETE_USERS,
      Permission.VIEW_REPORTS,
      Permission.BACKUP_RESTORE,
      Permission.MANAGE_SETTINGS,
    ],
  };

  function getPermissionLabel(permission: Permission): string {
    return permission
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Permissions & Access Control</h1>
          <p className="text-white/60">View your current role and permissions</p>
        </div>
      </div>

      {/* Current User Info */}
      <div className="rounded-xl glass-elevated border border-cyan-400/30 p-6 glow-blue">
        <h2 className="text-xl font-semibold text-white mb-4">Current User</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-white/60 mb-1">Name</div>
            <div className="text-white font-medium">{session?.user?.name || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-white/60 mb-1">Email</div>
            <div className="text-white font-medium">{session?.user?.email || 'N/A'}</div>
          </div>
          <div>
            <div className="text-sm text-white/60 mb-1">Role</div>
            <div className="inline-block">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${userRole === UserRole.ADMIN ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30' :
                  userRole === UserRole.MANAGER ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30' :
                    'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30'
                }`}>
                {userRole || 'No Role'}
              </span>
            </div>
          </div>
          <div>
            <div className="text-sm text-white/60 mb-1">Provider</div>
            <div className="text-white font-medium">{session?.user?.provider || 'Credentials'}</div>
          </div>
        </div>
      </div>

      {/* Permission Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl glass border border-white/10 p-4">
          <div className="text-sm text-white/60 mb-1">Total Permissions</div>
          <div className="text-2xl font-bold text-white">{currentRolePermissions.length}</div>
          <div className="text-xs text-white/40 mt-1">out of {allPermissions.length}</div>
        </div>
        <div className="rounded-xl glass border border-white/10 p-4">
          <div className="text-sm text-white/60 mb-1">Can View</div>
          <div className="text-2xl font-bold text-emerald-400">{canView ? '✓' : '✗'}</div>
        </div>
        <div className="rounded-xl glass border border-white/10 p-4">
          <div className="text-sm text-white/60 mb-1">Can Create</div>
          <div className="text-2xl font-bold text-cyan-400">{canCreate ? '✓' : '✗'}</div>
        </div>
        <div className="rounded-xl glass border border-white/10 p-4">
          <div className="text-sm text-white/60 mb-1">Can Manage Users</div>
          <div className="text-2xl font-bold text-purple-400">{canManageUsers ? '✓' : '✗'}</div>
        </div>
      </div>

      {/* Detailed Permissions by Category */}
      <div className="space-y-6">
        {Object.entries(permissionGroups).map(([category, permissions]) => (
          <div key={category} className="rounded-xl glass-elevated border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {permissions.map((permission) => {
                const hasPermission = checkPermission(permission);
                return (
                  <div
                    key={permission}
                    className={`p-3 rounded-lg border transition-all ${hasPermission
                        ? 'bg-emerald-500/10 border-emerald-400/30'
                        : 'bg-rose-500/10 border-rose-400/30 opacity-60'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white font-medium">
                        {getPermissionLabel(permission)}
                      </span>
                      <span className={`text-lg ${hasPermission ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {hasPermission ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="text-xs text-white/40 mt-1 font-mono">
                      {permission}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Role Comparison */}
      <div className="rounded-xl glass-elevated border border-cyan-400/30 p-6 glow-blue">
        <h2 className="text-xl font-semibold text-white mb-4">Role Comparison</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-white/80 font-semibold">Permission</th>
                <th className="px-4 py-3 text-center text-white/80 font-semibold">Admin</th>
                <th className="px-4 py-3 text-center text-white/80 font-semibold">Manager</th>
                <th className="px-4 py-3 text-center text-white/80 font-semibold">User</th>
              </tr>
            </thead>
            <tbody>
              {allPermissions.map((permission) => {
                const adminHas = rolePermissions[UserRole.ADMIN]?.includes(permission) || false;
                const managerHas = rolePermissions[UserRole.MANAGER]?.includes(permission) || false;
                const userHas = rolePermissions[UserRole.USER]?.includes(permission) || false;
                return (
                  <tr key={permission} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 text-white/80 font-mono text-xs">{permission}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={adminHas ? 'text-emerald-400' : 'text-rose-400'}>
                        {adminHas ? '✓' : '✗'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={managerHas ? 'text-emerald-400' : 'text-rose-400'}>
                        {managerHas ? '✓' : '✗'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={userHas ? 'text-emerald-400' : 'text-rose-400'}>
                        {userHas ? '✓' : '✗'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Permission Tests */}
      <div className="rounded-xl glass-elevated border border-white/10 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Permission Tests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg glass border border-white/10">
            <div className="text-sm text-white/60 mb-2">Can View Products?</div>
            <div className={`text-lg font-semibold ${checkPermission(Permission.VIEW_PRODUCTS) ? 'text-emerald-400' : 'text-rose-400'}`}>
              {checkPermission(Permission.VIEW_PRODUCTS) ? 'Yes' : 'No'}
            </div>
          </div>
          <div className="p-4 rounded-lg glass border border-white/10">
            <div className="text-sm text-white/60 mb-2">Can Create Products?</div>
            <div className={`text-lg font-semibold ${checkPermission(Permission.CREATE_PRODUCTS) ? 'text-emerald-400' : 'text-rose-400'}`}>
              {checkPermission(Permission.CREATE_PRODUCTS) ? 'Yes' : 'No'}
            </div>
          </div>
          <div className="p-4 rounded-lg glass border border-white/10">
            <div className="text-sm text-white/60 mb-2">Can Edit Products?</div>
            <div className={`text-lg font-semibold ${checkPermission(Permission.EDIT_PRODUCTS) ? 'text-emerald-400' : 'text-rose-400'}`}>
              {checkPermission(Permission.EDIT_PRODUCTS) ? 'Yes' : 'No'}
            </div>
          </div>
          <div className="p-4 rounded-lg glass border border-white/10">
            <div className="text-sm text-white/60 mb-2">Can Delete Products?</div>
            <div className={`text-lg font-semibold ${checkPermission(Permission.DELETE_PRODUCTS) ? 'text-emerald-400' : 'text-rose-400'}`}>
              {checkPermission(Permission.DELETE_PRODUCTS) ? 'Yes' : 'No'}
            </div>
          </div>
          <div className="p-4 rounded-lg glass border border-white/10">
            <div className="text-sm text-white/60 mb-2">Can Export Data?</div>
            <div className={`text-lg font-semibold ${checkPermission(Permission.EXPORT_DATA) ? 'text-emerald-400' : 'text-rose-400'}`}>
              {checkPermission(Permission.EXPORT_DATA) ? 'Yes' : 'No'}
            </div>
          </div>
          <div className="p-4 rounded-lg glass border border-white/10">
            <div className="text-sm text-white/60 mb-2">Can View Users?</div>
            <div className={`text-lg font-semibold ${checkPermission(Permission.VIEW_USERS) ? 'text-emerald-400' : 'text-rose-400'}`}>
              {checkPermission(Permission.VIEW_USERS) ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

