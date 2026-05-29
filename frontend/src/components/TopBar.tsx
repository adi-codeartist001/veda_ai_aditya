'use client';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

const NOTIFICATIONS = [
  { id: 1, icon: '✅', title: 'Paper generated successfully', time: 'Just now', unread: true },
  { id: 2, icon: '🎭', title: 'Mock classroom session available', time: '2h ago', unread: true },
  { id: 3, icon: '💡', title: 'Try auto-difficulty calibration', time: '1d ago', unread: false },
];

interface Props { title: string; showBack?: boolean; }

export default function TopBar({ title, showBack }: Props) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'TU';
  const unreadCount = notifications.filter(n => n.unread).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    toast.success('All notifications marked as read');
  };

  const handleLogout = () => {
    setShowProfile(false);
    logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30"
      style={{ boxShadow: '0 1px 12px rgba(0,0,0,0.04)' }}>

      {/* Left */}
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all text-lg"
          >
            ←
          </button>
        )}
        {showBack && <div className="h-4 w-px bg-gray-200" />}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>⊞</span>
          <span className="font-medium text-gray-700">{title}</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotif(v => !v); setShowProfile(false); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-orange-50 text-gray-500 hover:text-orange-500 transition-all"
          >
            <span className="text-lg">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in"
              style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <span className="font-semibold text-gray-900 text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-orange-500 font-medium hover:text-orange-600">
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.map((n) => (
                <div key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${n.unread ? 'bg-orange-50/40' : ''}`}
                  onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, unread: false } : x))}
                >
                  <span className="text-xl flex-shrink-0">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                  </div>
                  {n.unread && <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setShowProfile(v => !v); setShowNotif(false); }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-50 transition-all"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
              {initials}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name || 'Teacher'}</span>
            <span className="text-gray-400 text-xs">{showProfile ? '▴' : '▾'}</span>
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl border border-gray-100 overflow-hidden z-50 animate-fade-in"
              style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button onClick={() => { setShowProfile(false); router.push('/'); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                <span>🏠</span> Home
              </button>
              <button onClick={() => { setShowProfile(false); router.push('/assignment'); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                <span>📋</span> My Assignments
              </button>
              <button onClick={() => { setShowProfile(false); router.push('/settings'); }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                <span>⚙</span> Settings
              </button>
              <div className="border-t border-gray-50">
                <button onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left">
                  <span>⏻</span> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}