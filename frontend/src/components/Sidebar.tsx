'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const NAV = [
  { label: 'Home', href: '/', icon: '⊞' },
  { label: 'My Groups', href: '/groups', icon: '👥' },
  { label: 'Assignments', href: '/assignment', icon: '📋', badge: true },
  { label: "AI Teacher's Toolkit", href: '/toolkit', icon: '🪄' },
  { label: 'My Library', href: '/library', icon: '🕐' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    router.push('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'TU';

  return (
    <aside className="w-[280px] min-h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-40">
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm shadow-orange-200">
            <span className="text-white font-black text-lg">V</span>
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">VedaAI</span>
        </div>
      </div>

      <div className="px-4 mb-5">
        <Link href="/assignment/new"
          className="flex items-center gap-2 w-full bg-gray-900 text-white rounded-full px-4 py-3 text-sm font-semibold hover:bg-gray-800 transition-all justify-center shadow-sm">
          <span className="text-orange-400 text-base">✦</span> Create Assignment
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(item => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all ${
                isActive ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 space-y-1 border-t border-gray-50 pt-3">
        <Link href="/settings" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all">
          <span className="text-base w-5 text-center">⚙</span> Settings
        </Link>

        {/* User card */}
        <div className="flex items-center gap-3 px-3 py-3 mt-1 bg-gray-50 rounded-xl border border-gray-100">
          <div className="w-10 h-10 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center text-sm font-bold text-orange-700 flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.schoolName || 'My School'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.name || 'Teacher'}</p>
          </div>
          <button onClick={handleLogout} title="Logout"
            className="text-gray-400 hover:text-red-500 transition-colors text-sm p-1 rounded-lg hover:bg-red-50">
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
}
