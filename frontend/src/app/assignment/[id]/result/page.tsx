'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAssignmentStore } from '../../../../store/assignmentStore';
import { api } from '../../../../lib/api';
import { Assignment, GeneratedPaper, Section, Question, BloomLevel, Difficulty, BLOOM_COLORS, DIFF_COLORS, PaperVariant } from '../../../../types';
import toast from 'react-hot-toast';
import Sidebar from '../../../../components/Sidebar';
import { useAuthStore } from '../../../../store/authStore';
import TopBar from '../../../../components/TopBar';

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { generation, setGenerationStatus } = useAssignmentStore();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  useEffect(() => { if (!isAuthenticated()) router.replace('/login'); }, []);
  const [showAnswers, setShowAnswers] = useState(false);
  const [activeVariant, setActiveVariant] = useState<'A' | 'B'>('A');
  const [variants, setVariants] = useState<PaperVariant[]>([]);
  const [generatingVariants, setGeneratingVariants] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [revealedSections, setRevealedSections] = useState<number>(0);
  const paperRef = useRef<HTMLDivElement>(null);

  const paper = generation.result || assignment?.result;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.getAssignment(id);
        setAssignment(data);
        if (data.result) setGenerationStatus({ result: data.result, status: 'completed' });
        if (data.variants) setVariants(data.variants);
        else if (data.status === 'pending' || data.status === 'processing') {
          router.push(`/generate/${id}?jobId=${data.jobId}`);
        }
      } catch { toast.error('Failed to load'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  // Typewriter section reveal
  useEffect(() => {
    if (!paper) return;
    setRevealedSections(0);
    const reveal = () => {
      setRevealedSections(prev => {
        if (prev < paper.sections.length) {
          setTimeout(reveal, 600);
          return prev + 1;
        }
        return prev;
      });
    };
    setTimeout(reveal, 300);
  }, [paper?.generatedAt]);

  const handleGenerateVariants = async () => {
    setGeneratingVariants(true);
    try {
      const variantToken = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('vedaai-auth') || '{}')?.state?.token || '' : '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assignments/${id}/variants`, { method: 'POST', headers: { Authorization: `Bearer ${variantToken}` } });
      const data = await res.json();
      setVariants(data.data.variants);
      toast.success('Set A & Set B generated!');
    } catch { toast.error('Failed to generate variants'); }
    setGeneratingVariants(false);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const { jobId } = await api.regenerateAssignment(id);
      setGenerationStatus({ status: 'pending', progress: 0, result: null });
      router.push(`/generate/${id}?jobId=${jobId}`);
    } catch { toast.error('Failed'); setRegenerating(false); }
  };

  const handleShare = () => {
    const token = assignment?.shareToken;
    if (!token) return;
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied to clipboard!');
  };

  const handlePrint = () => window.print();

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!paper) return (
    <div className="flex min-h-screen bg-gray-50 items-center justify-center">
      <div className="card p-10 text-center">
        <p className="text-gray-500">No paper found</p>
        <button onClick={() => router.push('/assignment')} className="btn-primary mt-4 mx-auto">Go Back</button>
      </div>
    </div>
  );

  const currentSections = variants.length > 0
    ? variants.find(v => v.variant === activeVariant)?.sections || paper.sections
    : paper.sections;

  const totalQ = currentSections.reduce((s, sec) => s + sec.questions.length, 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="no-print"><Sidebar /></div>
      <div className="flex-1 ml-[280px] no-print-margin">
        <div className="no-print">
          <TopBar title="Assignment" showBack />
        </div>

        {/* Action bar */}
        <div className="no-print bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between gap-4 sticky top-14 z-20">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 truncate">{paper.title}</h2>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Generated</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Answer key toggle */}
            <button onClick={() => setShowAnswers(!showAnswers)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                showAnswers ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {showAnswers ? '🔑 Teacher View' : '👁 Student View'}
            </button>

            {/* Set A/B */}
            {variants.length > 0 ? (
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                {(['A','B'] as const).map(v => (
                  <button key={v} onClick={() => setActiveVariant(v)}
                    className={`px-3 py-2 text-xs font-medium transition-all ${
                      activeVariant === v ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}>Set {v}</button>
                ))}
              </div>
            ) : (
              <button onClick={handleGenerateVariants} disabled={generatingVariants}
                className="btn-outline !py-2 !px-3 text-xs">
                {generatingVariants ? '...' : '⊞ Set A/B'}
              </button>
            )}

            <button onClick={handleShare} className="btn-outline !py-2 !px-3 text-xs">🔗 Share</button>
            <button onClick={handleRegenerate} disabled={regenerating}
              className="btn-outline !py-2 !px-3 text-xs">
              {regenerating ? '...' : '↻ Regenerate'}
            </button>
            <button onClick={handlePrint} className="btn-primary !py-2 !px-3 text-xs">⬇ Download PDF</button>
          </div>
        </div>

        <div className="p-6">
          {/* Stats */}
          <div className="no-print grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Marks', val: paper.totalMarks },
              { label: 'Duration', val: paper.duration },
              { label: 'Sections', val: currentSections.length },
              { label: 'Questions', val: totalQ },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <div className="text-xl font-bold text-orange-500">{s.val}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Bloom Distribution */}
          {paper.bloomDistribution && Object.keys(paper.bloomDistribution).length > 0 && (
            <div className="no-print card p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Bloom's Taxonomy Distribution</h3>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(paper.bloomDistribution) as [BloomLevel, number][])
                  .filter(([, v]) => v > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([level, pct]) => (
                    <div key={level} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${BLOOM_COLORS[level]}`}>
                      {level.charAt(0).toUpperCase() + level.slice(1)} {pct}%
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Topic Gaps */}
          {paper.topicGaps && paper.topicGaps.length > 0 && (
            <div className="no-print card p-4 mb-6 border-l-4 border-amber-400">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-500">⚠</span>
                <h3 className="text-sm font-semibold text-gray-700">Topic Coverage Gaps Detected</h3>
              </div>
              <div className="space-y-1.5">
                {paper.topicGaps.map((gap, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span><strong>{gap.topic}</strong>: {gap.suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* A4 Paper */}
          <div ref={paperRef} className="paper-sheet rounded-2xl overflow-hidden max-w-3xl mx-auto">
            <ExamPaper paper={paper} sections={currentSections} showAnswers={showAnswers} revealedSections={revealedSections} variant={variants.length > 0 ? activeVariant : undefined} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamPaper({ paper, sections, showAnswers, revealedSections, variant }: {
  paper: GeneratedPaper; sections: Section[]; showAnswers: boolean; revealedSections: number; variant?: 'A' | 'B';
}) {
  return (
    <div className="text-gray-900">
      {/* Header */}
      <div className="bg-gray-900 text-white px-10 py-8 text-center">
        {paper.schoolName && <p className="text-gray-400 text-xs mb-1 uppercase tracking-widest">{paper.schoolName}</p>}
        <h1 className="text-xl font-bold tracking-wide mb-1">
          {paper.title}{variant ? ` — Set ${variant}` : ''}
        </h1>
        <p className="text-gray-400 text-sm">{paper.subject} • {paper.gradeLevel}</p>
        <div className="flex justify-center gap-8 mt-4 text-xs">
          <span>Total Marks: <strong className="text-white">{paper.totalMarks}</strong></span>
          <span>Duration: <strong className="text-white">{paper.duration}</strong></span>
          <span>Date: <strong className="text-white">{new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}</strong></span>
        </div>
        {showAnswers && (
          <div className="mt-2 inline-block bg-amber-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
            🔑 Teacher's Answer Key
          </div>
        )}
      </div>

      {/* Student info */}
      <div className="px-10 py-5 border-b border-gray-100 bg-gray-50">
        <div className="grid grid-cols-3 gap-6">
          {['Name', 'Roll Number', 'Class & Section'].map(f => (
            <div key={f}>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{f}</p>
              <div className="border-b-2 border-gray-300 h-7" />
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="px-10 py-3 bg-amber-50 border-b border-amber-100">
        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">General Instructions</p>
        <ul className="text-xs text-amber-900 list-disc list-inside space-y-0.5">
          <li>Read all questions carefully. All questions are compulsory unless stated.</li>
          <li>Write neatly. Marks are awarded for clarity and presentation.</li>
        </ul>
      </div>

      {/* Sections */}
      <div className="px-10 py-8 space-y-10">
        {sections.map((section, si) => (
          <div key={section.id}
            className={`transition-all duration-500 ${si < revealedSections ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: `${si * 100}ms` }}>
            <SectionBlock section={section} showAnswers={showAnswers} />
          </div>
        ))}
      </div>

      <div className="px-10 py-4 border-t border-gray-100 bg-gray-50 text-center">
        <p className="text-xs text-gray-400">— End of Question Paper —</p>
        <p className="text-xs text-gray-300 mt-0.5">Generated by VedaAI • {new Date(paper.generatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
}

function SectionBlock({ section, showAnswers }: { section: Section; showAnswers: boolean }) {
  return (
    <div>
      <div className="flex items-end justify-between border-b-2 border-gray-900 pb-2 mb-5">
        <div>
          <h2 className="font-bold text-sm uppercase tracking-wider text-gray-900">{section.title}</h2>
          <p className="text-xs text-gray-500 italic mt-0.5">{section.instruction}</p>
        </div>
        <span className="text-xs text-gray-500 font-semibold">[{section.totalMarks} Marks]</span>
      </div>
      <div className="space-y-6">
        {section.questions.map((q, i) => (
          <QuestionBlock key={q.id} question={q} number={i + 1} showAnswer={showAnswers} />
        ))}
      </div>
    </div>
  );
}

function QuestionBlock({ question, number, showAnswer }: { question: Question; number: number; showAnswer: boolean }) {
  return (
    <div className="flex gap-4">
      <span className="font-bold text-sm text-gray-700 min-w-[1.5rem]">{number}.</span>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="text-sm text-gray-800 leading-relaxed flex-1">{question.text}</p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Bloom badge */}
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${BLOOM_COLORS[question.bloom as BloomLevel] || 'bloom-understand'}`}>
              {question.bloom?.charAt(0).toUpperCase() + question.bloom?.slice(1)}
            </span>
            {/* Difficulty badge */}
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${DIFF_COLORS[question.difficulty as Difficulty] || 'diff-medium'}`}>
              {question.difficulty?.charAt(0).toUpperCase() + question.difficulty?.slice(1)}
            </span>
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">[{question.marks}M]</span>
          </div>
        </div>

        {/* Topic tag */}
        {question.topic && (
          <p className="text-xs text-gray-400 mb-2">Topic: {question.topic}</p>
        )}

        {/* MCQ options */}
        {question.type === 'mcq' && question.options && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2">
            {question.options.map((opt, i) => (
              <div key={i} className={`flex gap-2 text-xs py-0.5 ${showAnswer && opt === question.answer ? 'text-green-700 font-semibold' : 'text-gray-700'}`}>
                <span className="text-gray-400 font-medium">{String.fromCharCode(65+i)}.</span>
                <span>{opt.replace(/^[A-D]\.\s*/i, '')}</span>
                {showAnswer && opt === question.answer && <span className="text-green-600">✓</span>}
              </div>
            ))}
          </div>
        )}

        {/* True/False */}
        {question.type === 'true_false' && (
          <div className="flex gap-6 mt-2 text-xs text-gray-600">
            {['True','False'].map(opt => (
              <label key={opt} className={`flex items-center gap-2 ${showAnswer && opt.toLowerCase() === question.answer?.toLowerCase() ? 'text-green-700 font-semibold' : ''}`}>
                <span className="w-3.5 h-3.5 rounded-full border border-gray-400 inline-block" />
                {opt} {showAnswer && opt.toLowerCase() === question.answer?.toLowerCase() && '✓'}
              </label>
            ))}
          </div>
        )}

        {/* Answer lines for written questions */}
        {!['mcq','true_false'].includes(question.type) && !showAnswer && (
          <div className="mt-2 space-y-1">
            {Array(question.type === 'long_answer' ? 6 : 3).fill(0).map((_, i) => (
              <div key={i} className="border-b border-dashed border-gray-200 h-5" />
            ))}
          </div>
        )}

        {/* Answer reveal */}
        {showAnswer && question.answer && !['mcq','true_false'].includes(question.type) && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs font-semibold text-green-800 mb-1">Answer:</p>
            <p className="text-xs text-green-900">{question.answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
