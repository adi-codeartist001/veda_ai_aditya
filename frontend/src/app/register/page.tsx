'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const STEPS = ['Account', 'School', 'Done'];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', schoolName: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const update = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }));

  const nextStep = () => {
    if (step === 0) {
      if (!form.name.trim()) { toast.error('Enter your name'); return; }
      if (!form.email.includes('@')) { toast.error('Valid email required'); return; }
      if (form.password.length < 6) { toast.error('Password must be 6+ characters'); return; }
      if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!form.schoolName.trim()) { toast.error('Enter school name'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, schoolName: form.schoolName }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setAuth(data.data.user, data.data.token);
      setStep(2);
      setTimeout(() => router.push('/assignment'), 1500);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding */}
      <div className="hidden lg:flex w-1/2 bg-gray-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <span className="text-white font-black text-2xl">V</span>
            </div>
            <span className="text-white font-bold text-3xl tracking-tight">VedaAI</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Join <span className="text-orange-400">1000+</span><br />Teachers Today
          </h1>
          <p className="text-gray-400 text-lg max-w-sm mx-auto mb-12">
            Start creating AI-powered assessments and build your teaching confidence.
          </p>
          {/* Steps preview */}
          <div className="flex flex-col gap-4 text-left">
            {[
              { step: '01', title: 'Create account', desc: 'Name, email and password' },
              { step: '02', title: 'Set up school', desc: 'Your institution details' },
              { step: '03', title: 'Start teaching', desc: 'Generate your first paper' },
            ].map(s => (
              <div key={s.step} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-400 text-xs font-bold">{s.step}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{s.title}</p>
                  <p className="text-gray-500 text-xs">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xl">V</span>
            </div>
            <span className="font-bold text-2xl text-gray-900">VedaAI</span>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step ? 'bg-green-500 text-white' : i === step ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium ${i === step ? 'text-gray-900' : 'text-gray-400'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200 ml-2" />}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {step === 0 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Create account</h2>
                <p className="text-gray-500 text-sm mb-7">Fill in your personal details</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input value={form.name} onChange={e => update('name', e.target.value)}
                      placeholder="Rahul Sharma" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                      placeholder="rahul@school.edu" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)}
                        placeholder="Min. 6 characters" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all pr-12" />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{showPass ? '🙈' : '👁'}</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                    <input type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)}
                      placeholder="Repeat password" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all" />
                  </div>
                  <button onClick={nextStep} className="w-full bg-gray-900 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-gray-800 transition-all">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Your School</h2>
                <p className="text-gray-500 text-sm mb-7">Tell us about your institution</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">School / Institution Name</label>
                    <input value={form.schoolName} onChange={e => update('schoolName', e.target.value)}
                      placeholder="Delhi Public School, Bokaro" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep(0)} className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-3.5 text-sm font-medium hover:bg-gray-50">
                      ← Back
                    </button>
                    <button onClick={handleSubmit} disabled={loading}
                      className="flex-2 flex-1 bg-gray-900 text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-gray-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                      {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</> : 'Create Account ✦'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✅</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
                <p className="text-gray-500 text-sm">Redirecting to your dashboard...</p>
                <div className="mt-4 w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            )}
          </div>

          {step < 2 && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-orange-500 hover:text-orange-600 font-semibold">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
