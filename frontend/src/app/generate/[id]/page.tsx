'use client';
import { useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useAssignmentStore } from '../../../store/assignmentStore';
import { useAuthStore } from '../../../store/authStore';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { api } from '../../../lib/api';
import Link from 'next/link';

const STEPS = [
  { label: 'Job queued', threshold: 0 },
  { label: 'Building prompt', threshold: 10 },
  { label: 'AI crafting questions', threshold: 20 },
  { label: 'Generating content', threshold: 50 },
  { label: 'Structuring sections', threshold: 80 },
  { label: 'Finalizing paper', threshold: 90 },
  { label: 'Complete!', threshold: 100 },
];

export default function GeneratePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const jobId = searchParams.get('jobId');
  const { generation, setGenerationStatus } = useAssignmentStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated()) router.replace('/login');
  }, []);

  useWebSocket(jobId);

  const poll = useCallback(async () => {
    try {
      const a = await api.getAssignment(id);
      if (a.status === 'completed' && a.result) {
        setGenerationStatus({ status: 'completed', progress: 100, result: a.result });
      } else if (a.status === 'failed') {
        setGenerationStatus({ status: 'failed', error: a.error });
      } else if (a.status === 'processing') {
        setGenerationStatus({ status: 'processing' });
      }
    } catch {}
  }, [id]);

  useEffect(() => {
    // Poll immediately, then every 3s
    poll();
    const iv = setInterval(() => {
      if (generation.status !== 'completed' && generation.status !== 'failed') poll();
    }, 3000);
    return () => clearInterval(iv);
  }, [generation.status, poll]);

  const redirectedRef = useRef(false);

  useEffect(() => {
    if (generation.status === 'completed' && !redirectedRef.current) {
      redirectedRef.current = true;
      setTimeout(() => router.push(`/assignment/${id}/result`), 1200);
    }
  }, [generation.status, id, router]);

  const currentStep = STEPS.filter(s => generation.progress >= s.threshold).pop();
  const stepIdx = STEPS.indexOf(currentStep!);

  if (generation.status === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✕</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Generation Failed</h2>
          <p className="text-gray-500 text-sm mb-6">{generation.error || 'Something went wrong. Please try again.'}</p>
          <Link href="/assignment/new" className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-xl px-6 py-3 text-sm font-semibold hover:bg-gray-800 transition-all">
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Animated orb */}
        <div className="relative w-28 h-28 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-orange-100 animate-ping opacity-40" />
          <div className="absolute inset-3 rounded-full bg-orange-200 animate-pulse" />
          <div className="absolute inset-7 rounded-full bg-orange-500 flex items-center justify-center">
            {generation.status === 'completed'
              ? <span className="text-white text-2xl font-bold">✓</span>
              : <span className="text-white text-xl animate-spin inline-block">✦</span>
            }
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {generation.status === 'completed' ? 'Paper Ready!' : 'Generating your paper...'}
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          {generation.message || 'AI is crafting your question paper...'}
        </p>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>{currentStep?.label}</span>
            <span className="font-semibold">{generation.progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${generation.status === 'completed' ? 'bg-green-500' : 'bg-orange-500'}`}
              style={{ width: `${Math.max(generation.progress, 5)}%` }}
            />
          </div>
        </div>

        {/* Steps checklist */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-left shadow-sm space-y-2.5">
          {STEPS.slice(0, -1).map((s, i) => (
            <div key={s.label} className={`flex items-center gap-3 text-sm transition-all ${
              i < stepIdx ? 'text-green-600' : i === stepIdx ? 'text-gray-900 font-semibold' : 'text-gray-300'
            }`}>
              <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                {i < stepIdx ? '✓' : i === stepIdx ? '◉' : '○'}
              </span>
              {s.label}
            </div>
          ))}
        </div>

        {generation.status === 'completed' && (
          <p className="text-green-600 text-sm mt-5 font-medium">✓ Redirecting to your paper...</p>
        )}

        <Link href="/assignment" className="inline-block mt-6 text-gray-400 hover:text-gray-600 text-sm transition-colors">
          ← Back to assignments
        </Link>
      </div>
    </div>
  );
}