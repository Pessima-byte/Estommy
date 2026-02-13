"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { HomeIcon, PackageIcon, UsersIcon, ChartIcon, StoreIcon, CreditCardIcon, DollarIcon, UserManagementIcon, PermissionsIcon, SettingsIcon, CategoriesIcon } from './Icons';
import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/lib/roles';

const navLinks = [
  { href: '/', label: 'Dashboard', Icon: HomeIcon, permission: null },
  { href: '/products', label: 'Products', Icon: PackageIcon, permission: Permission.VIEW_PRODUCTS },
  { href: '/categories', label: 'Categories', Icon: CategoriesIcon, permission: Permission.VIEW_PRODUCTS },
  { href: '/customers', label: 'Customers', Icon: UsersIcon, permission: Permission.VIEW_CUSTOMERS },
  { href: '/sales', label: 'Sales', Icon: ChartIcon, permission: Permission.VIEW_SALES },
  { href: '/credits', label: 'Credits', Icon: CreditCardIcon, permission: Permission.VIEW_CREDITS },
  { href: '/debtors', label: 'Debtors', Icon: DollarIcon, permission: Permission.VIEW_DEBTORS },
  { href: '/profits', label: 'Profits', Icon: DollarIcon, permission: Permission.VIEW_PROFITS },
  { href: '/reports', label: 'Reports', Icon: ChartIcon, permission: null },
  { href: '/users', label: 'Users', Icon: UserManagementIcon, permission: Permission.VIEW_USERS },
  { href: '/permissions', label: 'Permissions', Icon: PermissionsIcon, permission: null },
  { href: '/settings', label: 'Settings', Icon: SettingsIcon, permission: Permission.BACKUP_RESTORE },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();

  // Filter links based on permissions
  const visibleLinks = navLinks.filter(link => {
    if (!link.permission) return true; // Dashboard is always visible
    return hasPermission(link.permission);
  });

  return (
    <nav className="flex-1 space-y-2">
      {visibleLinks.map(link => {
        const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
        const Icon = link.Icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`group flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all relative overflow-hidden
              ${isActive
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-400/30 glow-blue'
                : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'}
            `}
          >
            <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-cyan-400' : 'text-white/50 group-hover:text-cyan-400'}`} />
            <span className="relative z-10">{link.label}</span>
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10"></div>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
