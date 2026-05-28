'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import Link from 'next/link';
import { api } from '../lib/api';

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    papers: 0,
    completed: 0,
    failed: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) { router.replace('/login'); return; }
    api.listAssignments(1, 100).then(res => {
      const data = res.data || [];
      setStats({
        papers: data.filter((a: any) => a.status === 'completed').length,
        completed: data.filter((a: any) => a.status === 'completed').length,
        failed: data.filter((a: any) => a.status === 'failed').length,
        pending: data.filter((a: any) => a.status === 'pending' || a.status === 'processing').length,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (!mounted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated()) return null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const statCards = [
    { label: 'Papers Generated', value: loading ? '...' : stats.papers, icon: '📄', color: 'bg-orange-50 text-orange-600' },
    { label: 'Completed', value: loading ? '...' : stats.completed, icon: '✅', color: 'bg-green-50 text-green-600' },
    { label: 'Processing', value: loading ? '...' : stats.pending, icon: '⏳', color: 'bg-blue-50 text-blue-600' },
    { label: 'Failed', value: loading ? '...' : stats.failed, icon: '❌', color: 'bg-red-50 text-red-600' },
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
            {statCards.map(s => (
              <div key={s.label} className="card p-5 hover:shadow-md transition-all">
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

          {/* Recent assignments */}
          {stats.papers > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Recent Papers</h2>
                <Link href="/assignment" className="text-sm text-orange-600 hover:text-orange-700 font-medium">View all →</Link>
              </div>
              <div className="card p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-lg">📄</div>
                  <div>
                    <p className="font-semibold text-gray-900">{stats.completed} papers ready</p>
                    <p className="text-sm text-gray-500">Click "View Assignments" to access them</p>
                  </div>
                  <Link href="/assignment" className="ml-auto btn-primary !py-2 !px-4 text-xs">View →</Link>
                </div>
              </div>
            </div>
          )}

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