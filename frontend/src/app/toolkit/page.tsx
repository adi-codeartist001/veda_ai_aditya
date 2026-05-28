'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import TopBar from '../../components/TopBar';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

const ARCHETYPES: Record<string, { emoji: string; color: string }> = {
  bright: { emoji: '🌟', color: '#fbbf24' },
  confused: { emoji: '😕', color: '#94a3b8' },
  bored: { emoji: '😴', color: '#64748b' },
  curious: { emoji: '🤔', color: '#818cf8' },
  shy: { emoji: '😊', color: '#f9a8d4' },
  backbencher: { emoji: '😏', color: '#fb923c' },
  overachiever: { emoji: '🏆', color: '#34d399' },
  average: { emoji: '😐', color: '#a3a3a3' },
};

const EXPRESSION_EMOJI: Record<string, string> = {
  neutral: '😐', happy: '😊', confused: '😕', bored: '😴',
  excited: '🤩', hand_raised: '🙋', sleeping: '😴', whispering: '🤫',
};

interface Student {
  id: string; name: string; archetype: string;
  row: number; col: number; expression: string; engagementScore: number;
}

interface ChatMsg { role: 'teacher' | 'ai'; content: string; timestamp: Date; }
interface StudentReaction { studentId: string; expression: string; message?: string; isQuestion: boolean; }

export default function ToolkitPage() {
  const { token } = useAuthStore();
  const [phase, setPhase] = useState<'setup' | 'classroom'>('setup');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState<'english' | 'hindi' | 'hinglish'>('hinglish');
  const [students, setStudents] = useState<Student[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [reactions, setReactions] = useState<StudentReaction[]>([]);
  const [bubbles, setBubbles] = useState<{ studentId: string; text: string; isQuestion: boolean }[]>([]);
  const [engagementScore, setEngagementScore] = useState(65);
  const [mood, setMood] = useState('mixed');
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{role:string;content:string}[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Voice input setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = language === 'hindi' ? 'hi-IN' : 'en-IN'; // en-IN handles Hinglish well
        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
          setInput(transcript);
        };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => { setIsListening(false); toast.error('Voice input error. Try typing.'); };
        recognitionRef.current = recognition;
      }
    }
  }, [language]);

  const toggleVoice = () => {
    if (!recognitionRef.current) { toast.error('Voice not supported in this browser'); return; }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = language === 'hindi' ? 'hi-IN' : 'en-IN';
      recognitionRef.current.start();
      setIsListening(true);
      toast('Listening... speak now 🎤', { icon: '🎤' });
    }
  };

  const startSession = async () => {
    if (!subject.trim() || !topic.trim()) { toast.error('Enter subject and topic'); return; }
    setStarting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/classroom/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, topic, studentCount: 25, language }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setStudents(data.data.students);
      setSessionId(data.data.sessionId);
      setPhase('classroom');
      setMessages([{
        role: 'ai',
        content: `Class has started! You're teaching ${subject} — Topic: ${topic}. 25 students are ready. Start teaching! 🎓`,
        timestamp: new Date(),
      }]);
      toast.success('Classroom ready! Start teaching.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to start');
    } finally { setStarting(false); }
  };

  const sendMessage = async (msg?: string) => {
    const text = (msg || input).trim();
    if (!text) return;
    setInput('');
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    setLoading(true);

    const newMsg: ChatMsg = { role: 'teacher', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, newMsg]);
    const newHistory = [...conversationHistory, { role: 'user', content: text }];
    setConversationHistory(newHistory);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/classroom/teach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, subject, topic, students, conversationHistory: newHistory, language }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const result = data.data;

      // Update student expressions
      setStudents(prev => prev.map(s => {
        const reaction = result.studentReactions?.find((r: StudentReaction) => r.studentId === s.id);
        return reaction ? { ...s, expression: reaction.expression } : s;
      }));

      // Show speech bubbles
      const questionBubbles = result.studentReactions
        ?.filter((r: StudentReaction) => r.message)
        .slice(0, 4)
        .map((r: StudentReaction) => ({ studentId: r.studentId, text: r.message!, isQuestion: r.isQuestion }));
      setBubbles(questionBubbles || []);
      setTimeout(() => setBubbles([]), 6000);

      setReactions(result.studentReactions || []);
      setMood(result.classroomMood || 'mixed');
      setEngagementScore(prev => Math.max(10, Math.min(100, prev + (result.engagementChange || 0))));
      setTeacherFeedback(result.teacherFeedback || '');
      setNextAction(result.suggestedNextAction || '');

      setConversationHistory(prev => [...prev, { role: 'assistant', content: JSON.stringify(result) }]);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: result.teacherFeedback || 'Students have reacted!',
        timestamp: new Date(),
      }]);
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const moodColor = { engaged: '#10b981', confused: '#f59e0b', bored: '#94a3b8', excited: '#8b5cf6', mixed: '#3b82f6' }[mood] || '#3b82f6';

  if (phase === 'setup') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 ml-[280px]">
          <TopBar title="AI Teacher's Toolkit" />
          <div className="p-8 max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 px-4 py-2 rounded-full text-sm text-orange-700 font-medium mb-4">
                <span className="animate-pulse">🎭</span> AI Mock Classroom
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Practice Teaching with AI Students</h1>
              <p className="text-gray-500 text-base max-w-lg mx-auto">
                25 AI-powered students will react to your teaching in real time — asking questions, showing confusion, getting bored or excited. Just like a real class.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <input value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Physics, Mathematics, History"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Topic for Today</label>
                <input value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Newton's Laws of Motion"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Teaching Language</label>
                <div className="flex gap-2">
                  {(['english','hindi','hinglish'] as const).map(l => (
                    <button key={l} onClick={() => setLanguage(l)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border capitalize transition-all ${
                        language === l ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Student archetypes preview */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Class Will Have</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ARCHETYPES).map(([arch, { emoji }]) => (
                    <div key={arch} className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-gray-100 text-xs text-gray-600">
                      <span>{emoji}</span> {arch}
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={startSession} disabled={starting}
                className="w-full bg-gray-900 text-white rounded-xl py-4 text-sm font-bold hover:bg-gray-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {starting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Setting up class...</>
                  : <><span className="text-orange-400 text-lg">▶</span> Start Mock Class</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <div className="hidden"><Sidebar /></div>

      {/* Full screen classroom */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Classroom header */}
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setPhase('setup')} className="text-gray-400 hover:text-white text-sm">← Exit</button>
            <div className="h-4 w-px bg-gray-600" />
            <div>
              <p className="text-white font-semibold text-sm">{subject} — {topic}</p>
              <p className="text-gray-400 text-xs">{students.length} students • {language}</p>
            </div>
          </div>
          {/* Engagement meter */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-400">Class Engagement</p>
              <p className="text-white font-bold text-lg">{engagementScore}%</p>
            </div>
            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${engagementScore}%`, backgroundColor: moodColor }} />
            </div>
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: moodColor }} />
            <span className="text-xs text-gray-300 capitalize">{mood}</span>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Classroom grid — left 65% */}
          <div className="w-[65%] bg-gradient-to-b from-gray-800 to-gray-900 relative overflow-hidden p-6">
            {/* Blackboard */}
            <div className="w-full h-20 bg-gray-700/50 border border-gray-600 rounded-xl mb-6 flex items-center justify-center relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400 text-xs font-mono opacity-60">
                📋 {subject}
              </div>
              <p className="text-gray-300 text-sm font-medium">{topic}</p>
              <div className="absolute right-3 top-2 flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              </div>
            </div>

            {/* Student grid */}
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              {students.map(student => {
                const arch = ARCHETYPES[student.archetype] || ARCHETYPES.average;
                const bubble = bubbles.find(b => b.studentId === student.id);
                const expr = EXPRESSION_EMOJI[student.expression] || '😐';

                return (
                  <div key={student.id} className="relative flex flex-col items-center">
                    {/* Speech bubble */}
                    {bubble && (
                      <div className={`absolute -top-14 left-1/2 -translate-x-1/2 z-10 max-w-[140px] text-center animate-fade-in ${
                        bubble.isQuestion ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'
                      } text-xs px-2.5 py-1.5 rounded-xl shadow-lg border border-white/20`}
                        style={{ minWidth: '80px' }}>
                        {bubble.isQuestion && <span className="mr-1">❓</span>}
                        {bubble.text}
                        <div className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent ${
                          bubble.isQuestion ? 'border-t-blue-500' : 'border-t-white'
                        }`} />
                      </div>
                    )}

                    {/* Student avatar */}
                    <div className={`relative w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border-2 ${
                      bubble ? 'scale-110 border-blue-400 shadow-lg shadow-blue-500/30' : 'border-transparent'
                    }`}
                      style={{ backgroundColor: arch.color + '20', borderColor: bubble ? undefined : arch.color + '40' }}>
                      <span className="text-xl">{expr}</span>
                      <div className="absolute -top-1 -right-1 text-xs">{arch.emoji}</div>
                      {/* Engagement dot */}
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800"
                        style={{ backgroundColor: student.engagementScore > 70 ? '#10b981' : student.engagementScore > 40 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                    <p className="text-gray-400 text-xs mt-1.5 text-center truncate w-full">{student.name.split(' ')[0]}</p>
                  </div>
                );
              })}
            </div>

            {/* Teacher podium */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-2">
              <span className="text-lg">👩‍🏫</span>
              <span className="text-orange-300 text-xs font-medium">You (Teacher)</span>
              {isListening && <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />}
            </div>
          </div>

          {/* Right panel — chat + feedback */}
          <div className="flex-1 flex flex-col bg-gray-950 border-l border-gray-800">
            {/* Feedback cards */}
            {(teacherFeedback || nextAction) && (
              <div className="p-3 space-y-2 border-b border-gray-800">
                {teacherFeedback && (
                  <div className="bg-green-900/30 border border-green-800/50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-green-400 mb-1">💬 Feedback</p>
                    <p className="text-xs text-green-200 leading-relaxed">{teacherFeedback}</p>
                  </div>
                )}
                {nextAction && (
                  <div className="bg-blue-900/30 border border-blue-800/50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-blue-400 mb-1">💡 Suggested Next</p>
                    <p className="text-xs text-blue-200 leading-relaxed">{nextAction}</p>
                  </div>
                )}
              </div>
            )}

            {/* Chat */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'teacher' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 text-sm">🏫</div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    msg.role === 'teacher'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-800 text-gray-200'
                  }`}>
                    {msg.content}
                    <p className={`text-xs mt-1 ${msg.role === 'teacher' ? 'text-orange-200' : 'text-gray-500'}`}>
                      {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {msg.role === 'teacher' && (
                    <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 text-sm">👩‍🏫</div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-sm">🏫</div>
                  <div className="bg-gray-800 rounded-2xl px-4 py-3 flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Quick prompts */}
            <div className="px-3 pb-2 flex gap-2 overflow-x-auto">
              {['Explain with example', 'Ask a question', 'Check understanding', 'Summarize'].map(p => (
                <button key={p} onClick={() => sendMessage(p)}
                  className="flex-shrink-0 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full border border-gray-700 transition-all">
                  {p}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-800">
              <div className={`flex gap-2 items-end bg-gray-800 rounded-2xl p-2 border transition-all ${isListening ? 'border-red-500 shadow-lg shadow-red-500/20' : 'border-gray-700'}`}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={isListening ? '🎤 Listening...' : 'Type or speak what you want to teach...'}
                  rows={2}
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none resize-none px-2 py-1"
                />
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={toggleVoice}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                    🎤
                  </button>
                  <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
                    className="w-9 h-9 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 rounded-xl flex items-center justify-center text-white transition-all">
                    ➤
                  </button>
                </div>
              </div>
              <p className="text-center text-xs text-gray-600 mt-1.5">Enter to send • Shift+Enter for newline</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
