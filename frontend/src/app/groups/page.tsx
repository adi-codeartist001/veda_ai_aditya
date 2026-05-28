'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import toast from 'react-hot-toast';

interface Group {
  id: string;
  name: string;
  subject: string;
  students: number;
  grade: string;
  color: string;
}

const COLORS = ['bg-orange-100 text-orange-700','bg-blue-100 text-blue-700','bg-purple-100 text-purple-700','bg-green-100 text-green-700','bg-pink-100 text-pink-700'];

export default function GroupsPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', grade: '', students: '' });

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) { router.replace('/login'); return; }
    const saved = localStorage.getItem('vedaai-groups');
    if (saved) setGroups(JSON.parse(saved));
  }, []);

  if (!mounted) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const saveGroups = (g: Group[]) => {
    setGroups(g);
    localStorage.setItem('vedaai-groups', JSON.stringify(g));
  };

  const addGroup = () => {
    if (!form.name || !form.subject || !form.grade) { toast.error('Fill all fields'); return; }
    const newGroup: Group = {
      id: Date.now().toString(),
      name: form.name,
      subject: form.subject,
      grade: form.grade,
      students: parseInt(form.students) || 30,
      color: COLORS[groups.length % COLORS.length],
    };
    saveGroups([...groups, newGroup]);
    setForm({ name: '', subject: '', grade: '', students: '' });
    setShowModal(false);
    toast.success('Group created!');
  };

  const deleteGroup = (id: string) => {
    saveGroups(groups.filter(g => g.id !== id));
    toast.success('Group deleted');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-[280px]">
        <TopBar title="My Groups" />
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Groups</h1>
              <p className="text-gray-500 text-sm mt-1">Organize your classes and student groups</p>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary">+ New Group</button>
          </div>

          {groups.length === 0 ? (
            <div className="card p-16 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No groups yet</h2>
              <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                Create groups for your classes — organize students by subject, grade or section.
              </p>
              <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">Create First Group</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {groups.map(g => (
                <div key={g.id} className="card p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`px-3 py-1.5 rounded-xl text-sm font-semibold ${g.color}`}>{g.subject}</div>
                    <button onClick={() => deleteGroup(g.id)} className="text-gray-300 hover:text-red-500 transition-colors text-sm">✕</button>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{g.name}</h3>
                  <p className="text-gray-500 text-sm">{g.grade}</p>
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {[...Array(Math.min(3, g.students))].map((_, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">
                            {String.fromCharCode(65 + i)}
                          </div>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{g.students} students</span>
                    </div>
                    <button onClick={() => router.push('/assignment/new')} className="text-xs text-orange-600 font-semibold hover:text-orange-700">
                      Create Paper →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Create New Group</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Group Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Class 10-A" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Grade / Level</label>
                <input value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))} placeholder="e.g. Grade 10" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Students</label>
                <input type="number" value={form.students} onChange={e => setForm(f => ({ ...f, students: e.target.value }))} placeholder="30" className="input-field" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-outline flex-1 justify-center">Cancel</button>
              <button onClick={addGroup} className="btn-primary flex-1 justify-center">Create Group</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}