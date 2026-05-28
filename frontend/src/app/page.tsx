'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import Link from 'next/link';

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) router.replace('/login');
  }, []);

  // Prevent hydration mismatch - render nothing until client mounted
  if (!mounted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated()) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const stats = [
    { label: 'Papers Generated', value: '—', icon: '📄', color: 'bg-orange-50 text-orange-600' },
    { label: 'Students Taught', value: '—', icon: '👥', color: 'bg-blue-50 text-blue-600' },
    { label: 'Mock Sessions', value: '—', icon: '🎭', color: 'bg-purple-50 text-purple-600' },
    { label: 'Time Saved', value: '—', icon: '⏱', color: 'bg-green-50 text-green-600' },
  ];

  const quickActions = [
    { title: 'Create Assessment', desc: 'Generate AI-powered question papers in seconds', href: '/assignment/new', icon: '✦', color: 'bg-gray-900', textColor: 'text-white', descColor: 'text-gray-400' },
    { title: 'Mock Classroom', desc: 'Practice teaching with 25 AI students', href: '/toolkit', icon: '🎭', color: 'bg-orange-50', textColor: 'text-gray-900', descColor: 'text-gray-500' },
    { title: 'View Assignments', desc: 'Manage all your generated papers', href: '/assignment', icon: '📋', color: 'bg-blue-50', textColor: 'text-gray-900', descColor: 'text-gray-500' },
    { title: 'My Library', desc: 'Access saved resources and templates', href: '/library', icon: '📚', color: 'bg-purple-50', textColor: 'text-gray-900', descColor: 'text-gray-500' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-[280px]">
        <TopBar title="Home" />
        <div className="p-8 max-w-5xl">

          {/* Greeting */}
          <div className="mb-8">
            <p className="text-gray-500 text-sm font-medium">{greeting},</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">
              {user?.name?.split(' ')[0] || 'Teacher'} 👋
            </h1>
            <p className="text-gray-500 mt-1 text-sm">{user?.schoolName} — Ready to create something great today?</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map(s => (
              <div key={s.label} className="card p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${s.color}`}>
                  {s.icon}
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {quickActions.map(a => (
              <Link key={a.title} href={a.href}
                className={`${a.color} rounded-2xl p-6 flex items-start gap-4 hover:scale-[1.02] transition-all border border-gray-100`}>
                <div className="text-3xl flex-shrink-0">{a.icon}</div>
                <div className="flex-1">
                  <h3 className={`font-bold text-base ${a.textColor}`}>{a.title}</h3>
                  <p className={`text-sm mt-1 ${a.descColor}`}>{a.desc}</p>
                </div>
                <span className={`text-xl ${a.textColor} opacity-40 flex-shrink-0`}>→</span>
              </Link>
            ))}
          </div>

          {/* Pro tip */}
          <div className="card p-6 border-l-4 border-orange-400">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">💡</span>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Pro Tip</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Upload a previous year's question paper when creating an assignment — VedaAI will auto-calibrate the difficulty distribution to match your exam style perfectly.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}