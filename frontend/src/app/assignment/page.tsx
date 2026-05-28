'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import { Assignment } from '../../types';
import toast from 'react-hot-toast';

const STATUS_PILL: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) router.replace('/login');
  }, []);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const fetchAssignments = async () => {
    try {
      const res = await api.listAssignments();
      setAssignments(res.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAssignments(); }, []);

  const handleDelete = async (id: string) => {
    try {
      const delToken = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('vedaai-auth') || '{}')?.state?.token || '' : '';
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assignments/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${delToken}` } });
      setAssignments(prev => prev.filter(a => a._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
    setMenuOpen(null);
  };

  const filtered = assignments.filter(a =>
    a.input.title.toLowerCase().includes(search.toLowerCase()) ||
    a.input.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-[280px]">
        <TopBar title="Assignment" />
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Assignments</h1>
              <p className="text-sm text-gray-500">Manage and create assignments for your classes.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : assignments.length === 0 ? (
            /* Empty state — Figma matched */
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-48 h-48 mb-6 flex items-center justify-center">
                <div className="relative">
                  <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
                    <div className="text-6xl">📋</div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-xl">✗</div>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No assignments yet</h2>
              <p className="text-gray-500 text-sm text-center max-w-sm mb-8">
                Create your first assignment to start collecting and grading student submissions.
                You can set up rubrics, define marking criteria, and let AI assist with grading.
              </p>
              <Link href="/assignment/new" className="btn-primary">
                + Create Your First Assignment
              </Link>
            </div>
          ) : (
            <>
              {/* Filter + Search */}
              <div className="flex items-center justify-between mb-5 gap-4">
                <button className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 rounded-xl px-4 py-2.5 bg-white hover:bg-gray-50">
                  ▼ Filter By
                </button>
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex-1 max-w-xs">
                  <span className="text-gray-400">🔍</span>
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search Assignment"
                    className="flex-1 text-sm outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(a => (
                  <div key={a._id} className="card p-5 hover:shadow-md transition-shadow relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{a.input.title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{a.input.subject} • {a.input.gradeLevel}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_PILL[a.status]}`}>
                          {a.status}
                        </span>
                        <button
                          onClick={() => setMenuOpen(menuOpen === a._id ? null : a._id)}
                          className="text-gray-400 hover:text-gray-700 p-1 rounded"
                        >
                          ⋮
                        </button>
                      </div>
                    </div>

                    {/* Context menu */}
                    {menuOpen === a._id && (
                      <div className="absolute right-4 top-12 bg-white border border-gray-100 rounded-xl shadow-lg z-10 py-1 min-w-[160px]">
                        {a.status === 'completed' && (
                          <Link href={`/assignment/${a._id}/result`}
                            className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                            View Assignment
                          </Link>
                        )}
                        <button
                          onClick={() => handleDelete(a._id)}
                          className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                          Delete
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <span><strong className="text-gray-700">Assigned on</strong> : {new Date(a.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</span>
                      {a.input.dueDate && (
                        <span><strong className="text-gray-700">Due</strong> : {new Date(a.input.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Floating create button */}
        <Link href="/assignment/new"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 btn-primary shadow-lg px-8 py-3 text-base">
          + Create Assignment
        </Link>
      </div>

      {menuOpen && <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)} />}
    </div>
  );
}
