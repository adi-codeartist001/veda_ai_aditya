import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

interface Props { title: string; showBack?: boolean; }

export default function TopBar({ title, showBack }: Props) {
  const router   = useRouter();
  const { user } = useAuthStore();
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'TU';

  return (
    <div
      className="h-14 border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            style={{ transition: 'all 0.15s cubic-bezier(.34,1.56,.64,1)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(-2px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
          >
            ←
          </button>
        )}
        {showBack && <div className="h-4 w-px bg-gray-200" />}
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <span className="text-gray-400">⊞</span>
          <span className="font-medium text-gray-700">{title}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          className="relative p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-50"
          style={{ transition: 'all 0.15s cubic-bezier(.34,1.56,.64,1)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
        >
          <span className="text-lg">🔔</span>
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-[1.5px] border-white"
            style={{ animation: 'pulseGlow 2s infinite' }}
          />
        </button>

        {/* User pill */}
        <div
          className="flex items-center gap-2 cursor-pointer px-2.5 py-1.5 rounded-xl hover:bg-gray-50"
          style={{ transition: 'background 0.15s' }}
        >
          <div
            className="w-7 h-7 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center text-xs font-bold text-orange-700"
            style={{ transition: 'transform 0.2s cubic-bezier(.34,1.56,.64,1)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.12)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
          >
            {initials}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name || 'Teacher'}</span>
          <span className="text-gray-400 text-xs">▾</span>
        </div>
      </div>
    </div>
  );
}