'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function SharePage() {
  const params = useParams();
  const token = params.token as string;
  const [paper, setPaper] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assignments/shared/${token}`)
      .then(r => r.json())
      .then(d => { if (d.success) setPaper(d.data.result); })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!paper) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">Paper not found or not yet ready.</p></div>;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full text-xs text-orange-700 font-medium mb-3">
            <span>V</span> Shared via VedaAI
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden font-serif">
          <div className="bg-gray-900 text-white px-8 py-6 text-center">
            <h1 className="text-lg font-bold">{paper.title}</h1>
            <p className="text-gray-400 text-sm mt-1">{paper.subject} • {paper.gradeLevel}</p>
            <div className="flex justify-center gap-6 mt-3 text-xs text-gray-400">
              <span>Marks: <strong className="text-white">{paper.totalMarks}</strong></span>
              <span>Time: <strong className="text-white">{paper.duration}</strong></span>
            </div>
          </div>
          <div className="px-8 py-4 bg-gray-50 border-b">
            <div className="grid grid-cols-3 gap-4">
              {['Name','Roll Number','Section'].map(f => (
                <div key={f}><p className="text-xs text-gray-400 mb-1">{f}</p><div className="border-b-2 border-gray-300 h-6" /></div>
              ))}
            </div>
          </div>
          <div className="px-8 py-6 space-y-8">
            {paper.sections?.map((sec: any, si: number) => (
              <div key={si}>
                <div className="flex justify-between border-b-2 border-gray-900 pb-1 mb-4">
                  <div><p className="font-bold text-sm uppercase">{sec.title}</p><p className="text-xs text-gray-500 italic">{sec.instruction}</p></div>
                  <span className="text-xs text-gray-500">[{sec.totalMarks}M]</span>
                </div>
                {sec.questions?.map((q: any, qi: number) => (
                  <div key={qi} className="flex gap-3 mb-5">
                    <span className="font-bold text-sm min-w-[1.5rem]">{qi+1}.</span>
                    <div className="flex-1">
                      <div className="flex justify-between gap-2 mb-1">
                        <p className="text-sm leading-relaxed">{q.text}</p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">[{q.marks}M]</span>
                      </div>
                      {q.type === 'mcq' && q.options && (
                        <div className="grid grid-cols-2 gap-x-4 mt-2">
                          {q.options.map((o: string, i: number) => (
                            <p key={i} className="text-xs text-gray-700">{String.fromCharCode(65+i)}. {o.replace(/^[A-D]\.\s*/i,'')}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="px-8 py-3 bg-gray-50 border-t text-center text-xs text-gray-400">
            — End of Paper — • VedaAI
          </div>
        </div>
      </div>
    </div>
  );
}
