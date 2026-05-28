'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Sidebar from '../../../components/Sidebar';
import TopBar from '../../../components/TopBar';
import { useAssignmentStore } from '../../../store/assignmentStore';
import { submitAssignment, apiClient } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { QUESTION_TYPE_LABELS, GRADE_LEVELS, QuestionType, Language, Template } from '../../../types';

const QT_OPTIONS: QuestionType[] = ['mcq','short_answer','long_answer','true_false','fill_blank','numerical','diagram'];

export default function NewAssignmentPage() {
  const router = useRouter();
  const { formData, updateFormData, resetFormData, setGenerationStatus, resetGeneration, templates, setTemplates, addTemplate } = useAssignmentStore();
  const { isAuthenticated } = useAuthStore();
  useEffect(() => { if (!isAuthenticated()) router.replace('/login'); }, []);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    apiClient.listTemplates().then(res => setTemplates(res.data)).catch(() => {});
  }, []);

  const loadTemplate = (t: Template) => {
    updateFormData({
      subject: t.input.subject || '',
      gradeLevel: t.input.gradeLevel || '',
      schoolName: t.input.schoolName || '',
      questionTypes: t.input.questionTypes || formData.questionTypes,
      difficultyDistribution: t.input.difficultyDistribution || formData.difficultyDistribution,
      additionalInstructions: t.input.additionalInstructions || '',
      language: t.input.language || 'english',
    });
    setShowTemplates(false);
    toast.success(`Template "${t.name}" loaded!`);
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) { toast.error('Enter a template name'); return; }
    setSavingTemplate(true);
    try {
      const res = await apiClient.createTemplate(templateName, {
        subject: formData.subject, gradeLevel: formData.gradeLevel,
        schoolName: formData.schoolName, questionTypes: formData.questionTypes,
        difficultyDistribution: formData.difficultyDistribution,
        additionalInstructions: formData.additionalInstructions, language: formData.language,
      });
      addTemplate(res.data);
      setTemplateName('');
      toast.success('Template saved!');
    } catch { toast.error('Failed to save template'); }
    setSavingTemplate(false);
  };

  const handleCalibrate = async (file: File) => {
    setCalibrating(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const calToken = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('vedaai-auth') || '{}')?.state?.token || '' : '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assignments/calibrate`, { method: 'POST', headers: { Authorization: `Bearer ${calToken}` }, body: fd });
      const data = await res.json();
      if (data.success) {
        updateFormData({ difficultyDistribution: { easy: data.data.easy, medium: data.data.medium, hard: data.data.hard } });
        toast.success(`Calibrated from paper: ${data.data.analysis}`);
      }
    } catch { toast.error('Calibration failed'); }
    setCalibrating(false);
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.type === 'text/plain')) {
      updateFormData({ file });
      toast.success(`"${file.name}" attached`);
    } else toast.error('Only PDF or text files');
  }, []);

  const addQT = () => {
    const used = formData.questionTypes.map(q => q.type);
    const avail = QT_OPTIONS.find(t => !used.includes(t));
    if (!avail) { toast.error('All types added'); return; }
    updateFormData({ questionTypes: [...formData.questionTypes, { type: avail, count: 5, marksPerQuestion: 2 }] });
  };

  const removeQT = (i: number) => {
    if (formData.questionTypes.length === 1) { toast.error('Need at least one type'); return; }
    updateFormData({ questionTypes: formData.questionTypes.filter((_, idx) => idx !== i) });
  };

  const updateQT = (i: number, field: string, val: any) => {
    const qt = [...formData.questionTypes];
    qt[i] = { ...qt[i], [field]: val };
    updateFormData({ questionTypes: qt });
  };

  const validateStep1 = () => {
    if (!formData.dueDate) { toast.error('Due date is required'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.title.trim()) { toast.error('Title is required'); return false; }
    if (!formData.subject.trim()) { toast.error('Subject is required'); return false; }
    if (!formData.gradeLevel) { toast.error('Grade level is required'); return false; }
    const total = formData.difficultyDistribution.easy + formData.difficultyDistribution.medium + formData.difficultyDistribution.hard;
    if (Math.abs(total - 100) > 1) { toast.error(`Difficulty must sum to 100% (now ${total}%)`); return false; }
    return true;
  };

  const handleNext = () => { if (validateStep1()) setStep(2); };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setSubmitting(true);
    resetGeneration();
    try {
      const { assignmentId, jobId, shareToken } = await submitAssignment(formData);
      setGenerationStatus({ jobId, assignmentId, shareToken, status: 'pending', progress: 0 });
      toast.success('Generating your question paper!');
      router.push(`/generate/${assignmentId}?jobId=${jobId}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed');
      setSubmitting(false);
    }
  };

  const totalQ = formData.questionTypes.reduce((s, q) => s + q.count, 0);
  const totalM = formData.questionTypes.reduce((s, q) => s + q.count * q.marksPerQuestion, 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-[280px]">
        <TopBar title="Assignment" showBack />
        <div className="p-6 max-w-3xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Create Assignment</h1>
                <p className="text-sm text-gray-500">Set up a new assignment for your students</p>
              </div>
            </div>
            <button onClick={() => setShowTemplates(!showTemplates)}
              className="btn-outline text-sm">
              📋 Templates
            </button>
          </div>

          {/* Templates panel */}
          {showTemplates && (
            <div className="card p-5 mb-5 animate-fade-in">
              <h3 className="font-semibold text-gray-900 mb-3">Saved Templates</h3>
              {templates.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No templates yet. Save your settings as a template after filling the form.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {templates.map(t => (
                    <button key={t._id} onClick={() => loadTemplate(t)}
                      className="text-left p-3 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all">
                      <p className="font-medium text-sm text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.input.subject} • {t.input.gradeLevel}</p>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <input value={templateName} onChange={e => setTemplateName(e.target.value)}
                  placeholder="Template name e.g. Class 10 Physics Board"
                  className="input-field flex-1 !py-2" />
                <button onClick={saveTemplate} disabled={savingTemplate}
                  className="btn-primary !py-2">
                  {savingTemplate ? '...' : 'Save Current'}
                </button>
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div className="flex gap-0 mb-6 rounded-full overflow-hidden h-1.5 bg-gray-200">
            <div className="bg-gray-900 transition-all duration-500" style={{ width: step === 1 ? '50%' : '100%' }} />
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="card p-6 animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Assignment Details</h2>
              <p className="text-sm text-gray-500 mb-6">Basic information about your assignment</p>

              {/* File Upload */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-2xl p-10 text-center mb-6 transition-all ${
                  dragOver ? 'border-orange-400 bg-orange-50' :
                  formData.file ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                }`}
              >
                {formData.file ? (
                  <div>
                    <div className="text-3xl mb-2">📎</div>
                    <p className="font-medium text-green-700">{formData.file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{(formData.file.size/1024).toFixed(1)} KB</p>
                    <div className="flex gap-2 justify-center mt-3">
                      <button onClick={() => updateFormData({ file: null })} className="text-xs text-red-500 underline">Remove</button>
                      <button
                        onClick={() => formData.file && handleCalibrate(formData.file)}
                        disabled={calibrating}
                        className="text-xs text-orange-600 underline font-medium">
                        {calibrating ? 'Calibrating...' : '✨ Auto-calibrate difficulty'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center mx-auto mb-3 text-xl">☁</div>
                    <p className="text-gray-600 text-sm font-medium">Choose a file or drag & drop it here</p>
                    <p className="text-gray-400 text-xs mt-1">JPEG, PNG, PDF, TXT up to 10MB</p>
                    <label className="mt-4 inline-block px-5 py-2 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                      Browse Files
                      <input type="file" className="hidden" accept=".pdf,.txt"
                        onChange={e => { const f = e.target.files?.[0]; if (f) updateFormData({ file: f }); }} />
                    </label>
                    <p className="text-xs text-gray-400 mt-3">Upload images of your preferred document/image</p>
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                <div className="relative">
                  <input type="date" value={formData.dueDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => updateFormData({ dueDate: e.target.value })}
                    className="input-field pr-10" placeholder="DD-MM-YYYY" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
                </div>
              </div>

              {/* Language */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
                <div className="flex gap-2">
                  {(['english','hindi','hinglish'] as Language[]).map(l => (
                    <button key={l} onClick={() => updateFormData({ language: l })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all capitalize ${
                        formData.language === l
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Question Types */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700">Question Type</label>
                  <div className="flex gap-4 text-xs font-semibold text-gray-500">
                    <span className="w-28 text-center">No. of Questions</span>
                    <span className="w-20 text-center">Marks</span>
                    <span className="w-6"></span>
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.questionTypes.map((qt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1 relative">
                        <select value={qt.type} onChange={e => updateQT(i, 'type', e.target.value)}
                          className="input-field appearance-none pr-8">
                          {QT_OPTIONS.map(t => (
                            <option key={t} value={t}
                              disabled={formData.questionTypes.some((q, j) => q.type === t && j !== i)}>
                              {QUESTION_TYPE_LABELS[t]}
                            </option>
                          ))}
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
                      </div>
                      {/* Stepper for count */}
                      <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-2 py-1 bg-white w-28">
                        <button onClick={() => updateQT(i, 'count', Math.max(1, qt.count - 1))}
                          className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 text-lg">−</button>
                        <span className="flex-1 text-center text-sm font-medium">{qt.count}</span>
                        <button onClick={() => updateQT(i, 'count', Math.min(50, qt.count + 1))}
                          className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 text-lg">+</button>
                      </div>
                      {/* Stepper for marks */}
                      <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-2 py-1 bg-white w-20">
                        <button onClick={() => updateQT(i, 'marksPerQuestion', Math.max(0.5, qt.marksPerQuestion - 0.5))}
                          className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 text-lg">−</button>
                        <span className="flex-1 text-center text-sm font-medium">{qt.marksPerQuestion}</span>
                        <button onClick={() => updateQT(i, 'marksPerQuestion', qt.marksPerQuestion + 0.5)}
                          className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-900 text-lg">+</button>
                      </div>
                      <button onClick={() => removeQT(i)}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">✕</button>
                    </div>
                  ))}
                </div>

                <button onClick={addQT} disabled={formData.questionTypes.length >= QT_OPTIONS.length}
                  className="mt-3 text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 disabled:opacity-40">
                  + Add Question Type
                </button>
              </div>

              {/* Stats */}
              <div className="flex gap-3 mt-5 p-4 bg-gray-50 rounded-xl">
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-gray-900">{totalQ}</div>
                  <div className="text-xs text-gray-500">Questions</div>
                </div>
                <div className="w-px bg-gray-200" />
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-gray-900">{totalM}</div>
                  <div className="text-xs text-gray-500">Total Marks</div>
                </div>
                <div className="w-px bg-gray-200" />
                <div className="flex-1 text-center">
                  <div className="text-lg font-bold text-gray-900">{formData.questionTypes.length}</div>
                  <div className="text-xs text-gray-500">Sections</div>
                </div>
              </div>

              {/* Nav */}
              <div className="flex justify-end mt-6">
                <button onClick={handleNext} className="btn-primary">
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="card p-6 animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 mb-1">Paper Configuration</h2>
              <p className="text-sm text-gray-500 mb-6">Set titles, difficulty and additional instructions</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Assessment Title <span className="text-red-500">*</span></label>
                  <input value={formData.title} onChange={e => updateFormData({ title: e.target.value })}
                    placeholder="e.g. Mid-Term Physics Exam" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject <span className="text-red-500">*</span></label>
                  <input value={formData.subject} onChange={e => updateFormData({ subject: e.target.value })}
                    placeholder="e.g. Physics" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">School Name</label>
                  <input value={formData.schoolName || ''} onChange={e => updateFormData({ schoolName: e.target.value })}
                    placeholder="e.g. Delhi Public School" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Grade / Level <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select value={formData.gradeLevel} onChange={e => updateFormData({ gradeLevel: e.target.value })}
                      className="input-field appearance-none pr-8">
                      <option value="">Select grade</option>
                      {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">▾</span>
                  </div>
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Difficulty Distribution</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['easy','medium','hard'] as const).map(d => (
                    <div key={d}>
                      <label className="text-xs text-gray-500 mb-1 block capitalize">{d}</label>
                      <div className="relative">
                        <input type="number" value={formData.difficultyDistribution[d]} min={0} max={100}
                          onChange={e => updateFormData({ difficultyDistribution: { ...formData.difficultyDistribution, [d]: Math.max(0, parseInt(e.target.value)||0) } })}
                          className="input-field pr-7" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 h-2 flex rounded-full overflow-hidden">
                  <div className="bg-green-400 transition-all" style={{ width: `${formData.difficultyDistribution.easy}%` }} />
                  <div className="bg-amber-400 transition-all" style={{ width: `${formData.difficultyDistribution.medium}%` }} />
                  <div className="bg-red-400 transition-all" style={{ width: `${formData.difficultyDistribution.hard}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Easy {formData.difficultyDistribution.easy}%</span>
                  <span>Medium {formData.difficultyDistribution.medium}%</span>
                  <span>Hard {formData.difficultyDistribution.hard}%</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Instructions</label>
                <textarea value={formData.additionalInstructions}
                  onChange={e => updateFormData({ additionalInstructions: e.target.value })}
                  placeholder="Focus on specific topics, question style, etc."
                  rows={3} className="input-field resize-none" />
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="btn-outline">← Previous</button>
                <button onClick={handleSubmit} disabled={submitting}
                  className="btn-primary disabled:opacity-60">
                  {submitting ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                  ) : '✦ Generate Paper'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
