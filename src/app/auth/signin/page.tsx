"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useToast } from '../../../components/Toast';
import logo from '@/assets/logo.jpg';

export default function SignInPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
        setIsLoading(false);
      } else if (result?.ok) {
        showToast('Successfully signed in!', 'success');
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  }

  async function handleSocialSignIn(provider: string) {
    setIsLoading(true);
    setError('');
    try {
      // For OAuth providers, we need to allow redirect to the OAuth provider's login page
      await signIn(provider, {
        callbackUrl: '/',
        redirect: true // Allow redirect to OAuth provider
      });
      // Note: We won't reach here if redirect is true, as the page will redirect
    } catch (err: any) {
      setError(`Failed to sign in with ${provider}. ${err?.message || 'Please check your configuration.'}`);
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6 overflow-hidden bg-[#050505]">
      {/* premium background atmosphere */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#C5A059]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#C5A059]/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)]" />
      </div>

      {/* technical grid overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.05]" style={{
        backgroundImage: `linear-gradient(#C5A059 1px, transparent 1px), linear-gradient(90deg, #C5A059 1px, transparent 1px)`,
        backgroundSize: '80px 80px'
      }} />

      <div className="relative w-full max-w-[450px] z-10">
        {/* Logo Hub */}
        <div className="flex flex-col items-center mb-12">
          <div className="relative group mb-8">
            <div className="absolute -inset-4 bg-white/5 rounded-full blur-2xl group-hover:bg-[#C5A059]/10 transition-colors duration-700" />
            <div className="relative h-28 w-72 rounded-full overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src={logo}
                alt="Estommy logo"
                className="h-full w-full object-cover"
                placeholder="blur"
              />
            </div>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none text-center">
            Sign In
          </h2>
          <div className="flex items-center gap-2 mt-3">
            <div className="h-[2px] w-4 bg-[#C5A059]" />
            <span className="text-[10px] font-black text-[#C5A059] uppercase tracking-[0.4em]">Inventory Management</span>
          </div>
        </div>

        {/* Auth Terminal */}
        <div className="rounded-[2.5rem] bg-black/40 backdrop-blur-3xl border border-white/10 p-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
            <span className="text-[9px] font-black text-[#C5A059] uppercase tracking-widest opacity-40">Secure Login</span>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="group relative">
              <label className="block text-[11px] font-black text-white/50 uppercase tracking-[0.2em] mb-3 group-focus-within:text-[#C5A059] transition-colors">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full bg-white/[0.03] border-b-2 border-white/10 focus:border-[#C5A059] px-4 py-4 text-white placeholder:text-white/10 focus:outline-none transition-all text-xl font-black italic tracking-tight rounded-t-xl"
                  placeholder="name@domain.com"
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
                <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#C5A059] shadow-[0_0_15px_rgba(197,160,89,0.8)] group-focus-within:w-full transition-all duration-700" />
              </div>
            </div>

            <div className="group relative">
              <label className="block text-[11px] font-black text-white/50 uppercase tracking-[0.2em] mb-3 group-focus-within:text-[#C5A059] transition-colors">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  className="w-full bg-white/[0.03] border-b-2 border-white/10 focus:border-[#C5A059] px-4 py-4 text-white placeholder:text-white/10 focus:outline-none transition-all text-xl font-black italic tracking-tight rounded-t-xl"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#C5A059] shadow-[0_0_15px_rgba(197,160,89,0.8)] group-focus-within:w-full transition-all duration-700" />
              </div>
            </div>

            {error && (
              <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest text-center italic shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                <span className="mr-3 font-mono">Error:</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#C5A059] to-amber-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition duration-500" />
              <div className="relative bg-white hover:bg-[#C5A059] hover:text-white text-black py-5 rounded-2xl font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl transition-all flex items-center justify-center gap-6 active:scale-[0.98] disabled:opacity-50">
                {isLoading ? (
                  <span className="flex items-center gap-3">
                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Signing In...
                  </span>
                ) : (
                  <>
                    <span className="italic">Sign In</span>
                    <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Social Cluster */}
          <div className="mt-12 space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 border-t border-white/5" />
              <span className="relative px-4 text-[9px] font-black text-white/20 uppercase tracking-[0.5em] bg-[#050505]">Or sign in with</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { name: 'google', icon: <path fill="currentColor" d="M12.48 10.92v3.28h4.74c-.2 1.06-.9 1.95-1.82 2.56l2.89 2.24c1.69-1.57 2.67-3.87 2.67-6.56 0-.58-.05-1.15-.15-1.71h-8.33zM12 23c2.97 0 5.46-.98 7.28-2.66l-2.89-2.24c-.81.54-1.84.87-2.89.87-2.21 0-4.07-1.49-4.74-3.51l-2.98 2.31C7.58 20.6 9.61 23 12 23zM5.26 14.46c-.17-.51-.26-1.06-.26-1.63s.09-1.12.26-1.63l-2.98-2.31C1.81 10 1.5 10.98 1.5 12s.31 2 1.18 3.12l2.58-1.66zM12 5.03c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /> },
                { name: 'github', icon: <path fill="currentColor" fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /> },
                { name: 'facebook', icon: <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /> }
              ].map((p) => (
                <button
                  key={p.name}
                  onClick={() => handleSocialSignIn(p.name)}
                  disabled={isLoading}
                  className="flex items-center justify-center h-16 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#C5A059]/40 hover:bg-white/[0.08] transition-all group/icon"
                >
                  <svg className="w-5 h-5 text-white/20 group-hover/icon:text-[#C5A059] transition-colors" viewBox="0 0 24 24">
                    {p.icon}
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">
            Secure Access to Estommy Management System
          </p>
        </div>
      </div>
    </div>

  );
} 
