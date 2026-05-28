'use client';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

interface Props { title: string; showBack?: boolean; }

export default function TopBar({ title, showBack }: Props) {
  const router = useRouter();
  const { user } = useAuthStore();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'TU';

  return (
    <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {showBack && (
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900 transition-colors text-lg leading-none">←</button>
        )}
        {showBack && <div className="h-4 w-px bg-gray-200" />}
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <span>⊞</span>
          <span>{title}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-400 hover:text-gray-700 transition-colors">
          <span className="text-lg">🔔</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center text-xs font-bold text-orange-700">
            {initials}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name || 'Teacher'}</span>
          <span className="text-gray-400 text-xs">▾</span>
        </div>
      </div>
    </div>
  );
}
