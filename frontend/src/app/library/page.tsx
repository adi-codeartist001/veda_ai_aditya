'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { useAssignmentStore } from '../../store/assignmentStore';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import { api } from '../../lib/api';
import { Assignment } from '../../types';
import Link from 'next/link';
import toast from 'react-hot-toast';

const RESOURCES = [
  { title: 'How to write great MCQs', type: 'Guide', icon: '📖', color: 'bg-blue-50 text-blue-700', time: '5 min read' },
  { title: "Bloom's Taxonomy in Practice", type: 'Guide', icon: '🧠', color: 'bg-purple-50 text-purple-700', time: '8 min read' },
  { title: 'Difficulty Calibration Tips', type: 'Tip', icon: '🎯', color: 'bg-orange-50 text-orange-700', time: '3 min read' },
  { title: 'Creating Effective Long Answer Questions', type: 'Guide', icon: '✍️', color: 'bg-green-50 text-green-700', time: '6 min read' },
  { title: 'CBSE Marking Scheme Guidelines', type: 'Reference', icon: '📋', color: 'bg-gray-50 text-gray-700', time: '10 min read' },
  { title: 'Hinglish Assessment Best Practices', type: 'Tip', icon: '🌐', color: 'bg-pink-50 text-pink-700', time: '4 min read' },
];

export default function LibraryPage() {
  const { isAuthenticated } = useAuthStore();
  const { templates, removeTemplate } = useAssignmentStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'papers' | 'templates' | 'resources'>('papers');

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) { router.replace('/login'); return; }
    api.listAssignments(1, 50).then(res => {
      setAssignments(res.data?.filter((a: Assignment) => a.status === 'completed') || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (!mounted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-[280px]">
        <TopBar title="My Library" />
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">My Library</h1>
            <p className="text-gray-500 text-sm mt-1">All your papers, templates and learning resources</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
            {[
              { key: 'papers', label: `Papers (${assignments.length})` },
              { key: 'templates', label: `Templates (${templates.length})` },
              { key: 'resources', label: 'Resources' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'papers' && (
            <div>
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : assignments.length === 0 ? (
                <div className="card p-16 text-center">
                  <div className="text-5xl mb-4">📄</div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">No papers yet</h2>
                  <p className="text-gray-500 text-sm mb-5">Generate your first assessment paper to see it here.</p>
                  <Link href="/assignment/new" className="btn-primary mx-auto">Create Paper</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignments.map(a => (
                    <div key={a._id} className="card p-5 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900">{a.input.title}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">{a.input.subject} • {a.input.gradeLevel}</p>
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Ready</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
                        <span>{a.input.totalMarks} marks • {new Date(a.createdAt).toLocaleDateString('en-IN')}</span>
                        <Link href={`/assignment/${a._id}/result`} className="text-orange-600 font-semibold hover:text-orange-700">
                          View Paper →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div>
              {templates.length === 0 ? (
                <div className="card p-16 text-center">
                  <div className="text-5xl mb-4">📋</div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">No templates yet</h2>
                  <p className="text-gray-500 text-sm mb-5">Save your assignment settings as a template for quick reuse.</p>
                  <Link href="/assignment/new" className="btn-primary mx-auto">Create & Save Template</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map(t => (
                    <div key={t._id} className="card p-5 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-lg">📝</div>
                        <button onClick={() => { removeTemplate(t._id); toast.success('Deleted'); }}
                          className="text-gray-300 hover:text-red-500 transition-colors text-sm">✕</button>
                      </div>
                      <h3 className="font-bold text-gray-900 mt-3">{t.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{t.input.subject} • {t.input.gradeLevel}</p>
                      <div className="mt-4 pt-3 border-t border-gray-50">
                        <Link href="/assignment/new" className="text-xs text-orange-600 font-semibold hover:text-orange-700">
                          Use Template →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RESOURCES.map(r => (
                <div key={r.title} className="card p-5 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${r.color}`}>{r.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.color}`}>{r.type}</span>
                        <span className="text-xs text-gray-400">{r.time}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">{r.title}</h3>
                    </div>
                    <span className="text-gray-300 group-hover:text-orange-400 transition-colors flex-shrink-0">→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}