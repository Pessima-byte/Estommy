"use client";

import Link from 'next/link';
import Image from 'next/image';
import logo from '@/assets/logo.jpg';
import './globals.css';
import { ReactNode, useState, useEffect, useRef } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import SidebarNav from '../components/SidebarNav';
import { ContextProviders } from '../components/ContextProviders';
import ErrorBoundary from '../components/ErrorBoundary';
import { ToastProvider, useToast } from '../components/Toast';
import { HomeIcon, PackageIcon, UsersIcon, ChartIcon, StoreIcon, CreditCardIcon, DollarIcon } from '../components/Icons';
import { profileAPI, uploadAPI } from '../lib/api';

const navLinks = [
  { href: '/', label: 'Dashboard', Icon: HomeIcon },
  { href: '/products', label: 'Products', Icon: PackageIcon },
  { href: '/customers', label: 'Customers', Icon: UsersIcon },
  { href: '/sales', label: 'Sales', Icon: ChartIcon },
  { href: '/credits', label: 'Credits', Icon: CreditCardIcon },
  { href: '/profits', label: 'Profits', Icon: DollarIcon },
  { href: '/reports', label: 'Reports', Icon: ChartIcon },
];

function EstommyLogo() {
  return (
    <div className="select-none">
      <div className="h-24 w-60 rounded-3xl overflow-hidden flex items-center justify-center relative">
        <div className="absolute inset-0 bg-[#1A1A23] opacity-95 blur-md -z-10" />
        <Image
          src={logo}
          alt="Estommy logo"
          width={480}
          height={256}
          quality={100}
          className="h-full w-full object-cover"
          placeholder="blur"
          style={{
            maskImage: 'radial-gradient(ellipse 100% 100% at center, black 40%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at center, black 40%, transparent 80%)',
          }}
          priority
        />
      </div>
      <span className="sr-only">ESTOMMY</span>
    </div>
  );
}

function AppContent({ children }: { children: ReactNode }) {
  const { data: session, status, update: updateSession } = useSession();
  const { showToast } = useToast();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [profileSettings, setProfileSettings] = useState({
    name: session?.user?.name || 'User Name',
    email: session?.user?.email || 'user@email.com',
    phone: '',
    avatar: session?.user?.image || '',
  });
  const [profileAvatarPreview, setProfileAvatarPreview] = useState('');
  const [profileAvatarFile, setProfileAvatarFile] = useState<File | null>(null);
  const [profilePassword, setProfilePassword] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    if (status !== 'loading') {
      setInitialLoadComplete(true);
    }
  }, [status]);

  useEffect(() => {
    if (session?.user) {
      const newUser = session.user as any;
      setProfileSettings(prev => {
        // Deep compare to prevent unnecessary re-renders
        if (
          prev.name === newUser.name &&
          prev.email === newUser.email &&
          prev.avatar === (newUser.image || '') &&
          prev.phone === (newUser.phone || '')
        ) {
          return prev;
        }
        console.log('[Layout] Session data changed, updating UI');
        return {
          ...prev,
          name: newUser.name || prev.name,
          email: newUser.email || prev.email,
          avatar: newUser.image || '',
          phone: newUser.phone || '',
        };
      });

      if (newUser.notifications !== undefined) {
        setNotifications(newUser.notifications);
      }
    }
  }, [session]);

  useEffect(() => {
    if (status === 'authenticated') {
      const interval = setInterval(async () => {
        try {
          const response = await fetch('/api/profile', { cache: 'no-store' });
          if (response.ok) {
            const freshData = await response.json();

            setProfileSettings(prev => {
              const freshAvatar = freshData.image || '';
              const freshPhone = freshData.phone || '';

              if (
                prev.name === freshData.name &&
                prev.avatar === freshAvatar &&
                prev.phone === freshPhone
              ) {
                return prev;
              }

              console.log('[Sync] Data updated from mobile, applying silently...');
              return {
                ...prev,
                name: freshData.name,
                avatar: freshAvatar,
                phone: freshPhone
              };
            });
          }
        } catch (e) {
          // Silent fail
        }
      }, 15000); // 15 seconds
      return () => clearInterval(interval);
    }
  }, [status, session]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileOpen]);

  // Redirect to sign-in if not authenticated (except on sign-in page)
  useEffect(() => {
    if (status === 'unauthenticated' && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (!pathname.startsWith('/auth')) {
        window.location.href = '/auth/signin';
      }
    }
  }, [status]);

  if (status === 'loading' && !initialLoadComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1A1A23]">
        <div className="text-cyan-400 text-lg font-medium animate-pulse">Initializing System...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <>{children}</>;
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSaved(false);

    try {
      let avatarUrl = profileSettings.avatar;

      // Upload avatar if a new file is selected
      if (profileAvatarFile) {
        const uploadResult = await uploadAPI.upload(profileAvatarFile);
        avatarUrl = uploadResult.url;
      }

      // Prepare update data
      const updateData: any = {
        name: profileSettings.name,
        email: profileSettings.email,
        image: avatarUrl,
        phone: profileSettings.phone || null,
        notifications: notifications,
      };

      // Only include password if provided
      if (profilePassword.trim().length > 0) {
        updateData.password = profilePassword;
      }

      // Update profile
      const updatedUser = await profileAPI.update(updateData) as {
        id: string;
        email: string;
        name: string;
        phone: string | null;
        image: string | null;
        role: string;
        provider: string | null;
        notifications: boolean;
        createdAt: Date;
        updatedAt: Date;
      };

      // Update session
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: updatedUser.name,
          email: updatedUser.email,
          image: updatedUser.image || undefined,
          phone: updatedUser.phone || undefined,
          notifications: updatedUser.notifications,
        },
      });

      // Update local state
      setProfileSettings(prev => ({
        ...prev,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.image || '',
        phone: updatedUser.phone || '',
      }));
      setProfileAvatarPreview('');
      setProfileAvatarFile(null);
      setProfilePassword('');

      setProfileSaved(true);
      showToast('Profile updated successfully!', 'success');
      setTimeout(() => {
        setProfileSaved(false);
        setSettingsOpen(false);
      }, 1500);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      const errorMessage = error.message || 'Failed to update profile';
      setProfileError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setProfileLoading(false);
    }
  }

  return (
    <ContextProviders>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-72 h-screen fixed left-0 top-0 p-6 glass border-r border-white/10 overflow-y-auto z-40">
          <div className="mb-10">
            <EstommyLogo />
          </div>
          <SidebarNav />
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen md:ml-72">
          {/* Header */}
          <header className="flex items-center justify-between px-6 md:px-8 h-30 glass-elevated border-b border-white/10 sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <button className="md:hidden p-2 rounded-lg hover:bg-white/5" aria-label="Open sidebar">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <span className="md:hidden"><EstommyLogo /></span>
            </div>
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-cyan-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2.5 rounded-lg glass border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 text-sm text-white placeholder:text-white/40" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div ref={profileRef} className="relative">
                <button
                  className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-black font-semibold text-sm glow-blue hover:scale-105 transition-all"
                  onClick={() => setProfileOpen(v => !v)}
                  aria-label="Open profile menu"
                >
                  {profileSettings.avatar ? (
                    <img
                      src={profileSettings.avatar}
                      alt="Profile"
                      className="w-full h-full rounded-lg object-cover"
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    profileSettings.name[0] || 'U'
                  )}
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#1A1A23] border border-white/20 z-[999] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] glow-blue transition-all duration-300 transform origin-top-right">
                    <div className="flex items-center gap-3 p-5 border-b border-white/10 bg-white/[0.02]">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-black font-semibold glow-blue overflow-hidden">
                        {profileSettings.avatar ? (
                          <img src={profileSettings.avatar} alt="Profile" className="w-full h-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                        ) : (
                          profileSettings.name[0] || 'U'
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-white">{profileSettings.name}</div>
                        <div className="text-xs text-white/60">{profileSettings.email}</div>
                      </div>
                    </div>
                    <div className="border-t border-white/10" />
                    <Link href="/reports" className="block w-full text-left px-4 py-3 hover:bg-white/5 text-white text-sm font-medium transition" onClick={() => setProfileOpen(false)}>
                      View Reports
                    </Link>
                    <button className="w-full text-left px-4 py-3 hover:bg-white/5 text-white text-sm font-medium transition" onClick={() => { setSettingsOpen(true); setProfileOpen(false); }}>Settings</button>
                    <div className="border-t border-white/10" />
                    <button
                      className="w-full text-left px-4 py-3 hover:bg-white/10 text-white/50 hover:text-white text-sm font-medium transition"
                      onClick={async () => {
                        const { signOut } = await import('next-auth/react');
                        signOut({ callbackUrl: '/auth/signin' });
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
          {/* Main Page Content */}
          <main className="flex-1 p-6 md:p-8">
            {children}
          </main>
          {/* Mobile Nav */}
          <nav className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden glass border-t border-white/10 h-16">
            {navLinks.map(link => {
              const Icon = link.Icon;
              return (
                <Link key={link.href} href={link.href} className="flex-1 flex flex-col items-center justify-center text-xs font-medium hover:text-cyan-400 transition">
                  <Icon className="w-5 h-5 mb-1 text-white/60" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={() => setSettingsOpen(false)}>
          <div className="relative rounded-xl glass-elevated border border-cyan-400/30 py-6 px-6 max-w-md w-full glow-blue" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-6 text-white">Profile Settings</h3>
            <form className="flex flex-col gap-5 text-left" onSubmit={handleProfileSave}>
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-black font-bold text-2xl shadow-lg glow-blue overflow-hidden cursor-pointer hover:scale-105 active:scale-95 transition-all group"
                  onClick={() => document.getElementById('profile-avatar-input')?.click()}
                  title="Click to change avatar"
                >
                  {profileAvatarPreview || profileSettings.avatar ? (
                    <img src={profileAvatarPreview || profileSettings.avatar} alt="Avatar" className="w-full h-full object-cover rounded-xl" crossOrigin="anonymous" referrerPolicy="no-referrer" />
                  ) : (
                    profileSettings.name[0] || 'U'
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <input
                  id="profile-avatar-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setProfileAvatarFile(file);
                      const reader = new FileReader();
                      reader.onload = ev => setProfileAvatarPreview(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Click square to upload</p>
              </div>
              <div>
                <label className="font-medium text-sm text-white/80 mb-2 block">Name</label>
                <input className="w-full px-4 py-2.5 rounded-lg glass border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 text-white placeholder:text-white/40" value={profileSettings.name} onChange={e => setProfileSettings(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="font-medium text-sm text-white/80 mb-2 block">Email</label>
                <input type="email" className="w-full px-4 py-2.5 rounded-lg glass border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 text-white placeholder:text-white/40" value={profileSettings.email} onChange={e => setProfileSettings(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <label className="font-medium text-sm text-white/80 mb-2 block">Phone</label>
                <div className="flex gap-2">
                  <div className="px-4 py-2.5 rounded-lg glass border border-white/10 text-white/80 text-sm flex items-center whitespace-nowrap">
                    +232
                  </div>
                  <input
                    type="tel"
                    className="flex-1 px-4 py-2.5 rounded-lg glass border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 text-white placeholder:text-white/40"
                    value={profileSettings.phone?.replace('+232', '') || ''}
                    onChange={e => {
                      const value = e.target.value.replace(/\D/g, ''); // Only numbers
                      setProfileSettings(f => ({ ...f, phone: value ? `+232${value}` : '' }));
                    }}
                    placeholder="XXXXXXXX"
                    maxLength={8}
                  />
                </div>
                <p className="text-xs text-white/50 mt-1">Sierra Leone (+232)</p>
              </div>
              <div>
                <label className="font-medium text-sm text-white/80 mb-2 block">Change Password</label>
                <input type="password" className="w-full px-4 py-2.5 rounded-lg glass border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 text-white placeholder:text-white/40" value={profilePassword} onChange={e => setProfilePassword(e.target.value)} placeholder="New password" />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="font-medium text-sm text-white/80">Notifications</span>
                <button
                  type="button"
                  className={`w-12 h-6 rounded-full flex items-center transition-colors ${notifications ? 'bg-cyan-400' : 'bg-white/20'}`}
                  onClick={e => { e.preventDefault(); setNotifications(v => !v); }}
                >
                  <span className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'}`}></span>
                </button>
              </div>
              {profileError && <div className="text-[#C5A059] font-semibold text-center py-2 text-sm">{profileError}</div>}
              {profileSaved && <div className="text-emerald-400 font-semibold text-center py-2 text-sm">Profile saved!</div>}
              <div className="flex gap-3 mt-2">
                <button type="submit" disabled={profileLoading} className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-semibold shadow-lg glow-blue hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {profileLoading ? 'Saving...' : 'Save'}
                </button>
                <button type="button" disabled={profileLoading} className="flex-1 px-6 py-3 rounded-lg glass border border-white/10 text-white font-semibold hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => {
                  setSettingsOpen(false);
                  setProfileError(null);
                  setProfileAvatarPreview('');
                  setProfileAvatarFile(null);
                  setProfilePassword('');
                }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ContextProviders>
  );
}

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>ESTOMMY - Business Management System</title>
        <meta name="description" content="Modern business management system" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/estommy-logo.jpg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/estommy-logo.jpg" />
      </head>
      <body className="bg-[#252530] text-white min-h-screen">
        <SessionProvider>
          <ToastProvider>
            <ErrorBoundary>
              <AppContent>{children}</AppContent>
            </ErrorBoundary>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
