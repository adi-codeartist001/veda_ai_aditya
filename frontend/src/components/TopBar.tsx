'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { useState } from 'react';

const NAV = [
  { label: 'Home',               href: '/',         icon: '⊞' },
  { label: 'My Groups',          href: '/groups',   icon: '👥' },
  { label: 'Assignments',        href: '/assignment',icon: '📋' },
  { label: "AI Teacher's Toolkit",href: '/toolkit', icon: '🪄' },
  { label: 'My Library',         href: '/library',  icon: '🕐' },
];

export default function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      logout();
      toast.success('Logged out');
      router.push('/login');
    }, 300);
  };

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'TU';

  return (
    <aside className="w-[280px] min-h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-40"
      style={{ boxShadow: '2px 0 16px rgba(0,0,0,0.04)' }}>

      {/* Logo */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5 group">
          <div
            className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm shadow-orange-200"
            style={{ transition: 'transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.08) rotate(-3deg)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 16px rgba(249,115,22,0.35)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = '';
              (e.currentTarget as HTMLElement).style.boxShadow = '';
            }}
          >
            <span className="text-white font-black text-lg select-none">V</span>
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">VedaAI</span>
        </div>
      </div>

      {/* Create button */}
      <div className="px-4 mb-5">
        <Link
          href="/assignment/new"
          className="flex items-center gap-2 w-full bg-gray-900 text-white rounded-full px-4 py-3 text-sm font-semibold justify-center relative overflow-hidden group"
          style={{ transition: 'transform 0.15s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(17,24,39,0.28)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = '';
            (e.currentTarget as HTMLElement).style.boxShadow = '';
          }}
        >
          {/* Subtle shimmer overlay */}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <span className="text-orange-400 text-base relative z-10">✦</span>
          <span className="relative z-10">Create Assignment</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map((item, i) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer relative
                ${isActive
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              style={{
                transition: 'background 0.15s, color 0.15s, transform 0.15s',
                animationDelay: `${i * 0.05}s`,
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLElement).style.transform = 'translateX(3px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = '';
              }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 w-[3px] h-[18px] bg-orange-500 rounded-r-full"
                  style={{ transform: 'translateY(-50%)' }}
                />
              )}
              <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-1 border-t border-gray-50 pt-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          style={{ transition: 'background 0.15s, color 0.15s, transform 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(3px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
        >
          <span className="text-base w-5 text-center">⚙</span> Settings
        </Link>

        {/* User card */}
        <div
          className="flex items-center gap-3 px-3 py-3 mt-1 bg-gray-50 rounded-xl border border-gray-100"
          style={{ transition: 'background 0.15s, box-shadow 0.15s' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = '#f9fafb';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = '';
            (e.currentTarget as HTMLElement).style.boxShadow = '';
          }}
        >
          <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center text-sm font-bold text-orange-700 flex-shrink-0"
            style={{ transition: 'transform 0.2s cubic-bezier(.34,1.56,.64,1)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.schoolName || 'My School'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.name || 'Teacher'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            disabled={loggingOut}
            className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50"
            style={{ transition: 'color 0.15s, background 0.15s, transform 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
}