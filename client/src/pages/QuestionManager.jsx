import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  PlusCircle,
  Trash2,
  CheckCircle2,
  Code2,
  ListOrdered,
  FileQuestion,
  Sparkles,
  HelpCircle,
  Copy,
  ExternalLink
} from 'lucide-react';

export const QuestionManager = () => {
  const { id: examId } = useParams();
  const { authFetch } = useAuth();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [qType, setQType] = useState('mcq'); // 'mcq' | 'code'
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [starterCode, setStarterCode] = useState('function solution() {\n  // Write your code here\n}');
  const [sampleInput, setSampleInput] = useState('');
  const [sampleOutput, setSampleOutput] = useState('');
  const [marks, setMarks] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  const fetchExamAndQuestions = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`/api/exams/${examId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch exam');
      setExam(data.exam);
      setQuestions(data.questions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExamAndQuestions();
  }, [examId]);

  const handleOptionChange = (idx, val) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    if (qType === 'mcq') {
      const emptyOptions = options.some(opt => !opt.trim());
      if (emptyOptions) {
        alert('Please fill in all 4 multiple-choice options.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload = {
        examId,
        type: qType,
        questionText: questionText.trim(),
        marks: Number(marks) || 1,
        options: qType === 'mcq' ? options.map(o => o.trim()) : [],
        correctOptionIndex: qType === 'mcq' ? Number(correctOptionIndex) : 0,
        starterCode: qType === 'code' ? starterCode : '',
        sampleInput: qType === 'code' ? sampleInput : '',
        sampleOutput: qType === 'code' ? sampleOutput : '',
      };

      const res = await authFetch('/api/questions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create question');

      setQuestions([...questions, data.question]);

      // Reset form
      setQuestionText('');
      setOptions(['', '', '', '']);
      setCorrectOptionIndex(0);
      setSampleInput('');
      setSampleOutput('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      const res = await authFetch(`/api/questions/${qId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete question');
      setQuestions(questions.filter(q => String(q._id) !== String(qId)));
    } catch (err) {
      alert(err.message);
    }
  };

  const totalExamMarks = questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Header */}
      <Link
        to="/teacher"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      {loading ? (
        <div className="text-center py-16 text-slate-500">
          <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading exam question manager...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      ) : (
        <>
          {/* Exam Header Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Exam Access Code: {exam.examCode}
                </span>
                <span className="text-xs text-slate-400">• {exam.durationMinutes} minutes limit</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white">{exam.title}</h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">{exam.description}</p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl px-4 py-3 text-center">
                <span className="text-2xl font-extrabold text-white">{questions.length}</span>
                <span className="text-[11px] uppercase font-bold text-slate-400 block">Questions</span>
              </div>
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl px-4 py-3 text-center">
                <span className="text-2xl font-extrabold text-emerald-400">{totalExamMarks}</span>
                <span className="text-[11px] uppercase font-bold text-slate-400 block">Total Marks</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Add Question Form */}
            <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl h-fit">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <PlusCircle className="w-5 h-5 text-indigo-400" />
                  <span>Add New Question</span>
                </h2>

                {/* Type Switcher */}
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setQType('mcq'); setMarks(2); }}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      qType === 'mcq'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>MCQ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setQType('code'); setMarks(5); }}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      qType === 'code'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Coding</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      {qType === 'mcq' ? 'Question Statement *' : 'Problem Statement *'}
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs text-slate-400">Marks:</span>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={marks}
                        onChange={(e) => setMarks(e.target.value)}
                        className="w-16 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-center text-white"
                      />
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder={qType === 'mcq' ? "e.g. Which method removes the last element from an array in JavaScript?" : "e.g. Write a function reverseString(str) that reverses the string..."}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-sm text-white placeholder-slate-600 outline-none resize-none"
                  />
                </div>

                {/* MCQ Options */}
                {qType === 'mcq' ? (
                  <div className="space-y-2.5">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      4 Multiple Choice Options (Select the correct option below):
                    </label>
                    {options.map((opt, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center space-x-3 p-2.5 rounded-xl border transition-all ${
                          correctOptionIndex === idx
                            ? 'bg-emerald-950/30 border-emerald-500/50'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <input
                          type="radio"
                          name="correctOption"
                          checked={correctOptionIndex === idx}
                          onChange={() => setCorrectOptionIndex(idx)}
                          className="w-4 h-4 text-emerald-500 focus:ring-0 cursor-pointer"
                        />
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {String.fromCharCode(65 + idx)}.
                        </span>
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}...`}
                          className="flex-1 bg-transparent text-sm text-white placeholder-slate-600 outline-none"
                        />
                        {correctOptionIndex === idx && (
                          <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            Correct
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Coding Question Fields */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Starter Code Template
                      </label>
                      <textarea
                        rows={4}
                        value={starterCode}
                        onChange={(e) => setStarterCode(e.target.value)}
                        className="w-full bg-slate-950/90 font-mono text-xs text-indigo-200 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Sample Input
                        </label>
                        <input
                          type="text"
                          value={sampleInput}
                          onChange={(e) => setSampleInput(e.target.value)}
                          placeholder='e.g. "hello"'
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                          Sample Expected Output
                        </label>
                        <input
                          type="text"
                          value={sampleOutput}
                          onChange={(e) => setSampleOutput(e.target.value)}
                          placeholder='e.g. "olleh"'
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-600/30 active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center space-x-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{submitting ? 'Saving Question...' : 'Add Question to Exam'}</span>
                </button>
              </form>
            </div>

            {/* Right Column: Existing Questions List */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-white">
                  Exam Questions ({questions.length})
                </h2>
                <span className="text-xs text-slate-400">Total Marks: {totalExamMarks}</span>
              </div>

              {questions.length === 0 ? (
                <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-10 text-center text-slate-500">
                  <FileQuestion className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                  <p className="text-sm font-semibold text-slate-400">No questions added yet</p>
                  <p className="text-xs text-slate-500 mt-1">Use the form on the left to add MCQs and Coding challenges.</p>
                </div>
              ) : (
                questions.map((q, idx) => {
                  const qId = String(q._id);
                  return (
                    <div
                      key={qId || idx}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative group transition-all hover:border-slate-700"
                    >
                      {/* Question Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                            q.type === 'code'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}>
                            {q.type === 'code' ? 'Coding Problem' : 'MCQ'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {q.marks || 1} Marks
                          </span>
                          <button
                            onClick={() => handleDeleteQuestion(qId)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Text */}
                      <p className="text-sm font-medium text-slate-200 mb-3 whitespace-pre-wrap">
                        {q.questionText}
                      </p>

                      {/* Details depending on type */}
                      {q.type === 'mcq' && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-2 rounded-lg border flex items-center space-x-2 ${
                                q.correctOptionIndex === oIdx
                                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-semibold'
                                  : 'bg-slate-950/50 border-slate-800 text-slate-400'
                              }`}
                            >
                              <span className="font-mono text-[10px] text-slate-500">
                                {String.fromCharCode(65 + oIdx)}.
                              </span>
                              <span className="truncate">{opt}</span>
                              {q.correctOptionIndex === oIdx && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-auto flex-shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === 'code' && (
                        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80 font-mono text-xs text-indigo-300/90 overflow-x-auto">
                          <pre>{q.starterCode || '// Starter code'}</pre>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
