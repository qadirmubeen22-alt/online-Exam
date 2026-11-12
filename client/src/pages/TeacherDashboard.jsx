import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  PlusCircle,
  BookOpen,
  FileText,
  Clock,
  Users,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  ShieldAlert,
  BarChart3,
  Sparkles
} from 'lucide-react';

export const TeacherDashboard = () => {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/exams');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch exams');
      setExams(data.exams || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteExam = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" and all its student attempts?`)) {
      return;
    }
    try {
      const res = await authFetch(`/api/exams/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete exam');
      setExams(exams.filter(e => String(e._id) !== String(id)));
    } catch (err) {
      alert(err.message);
    }
  };

  // Metrics calculation
  const totalExams = exams.length;
  const totalSubmissions = exams.reduce((acc, e) => acc + (e.submissionCount || 0), 0);
  const totalQuestions = exams.reduce((acc, e) => acc + (e.questionCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instructor Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Teacher Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back, {user?.name}. Monitor active exam rooms, review proctoring logs, and build tests.
          </p>
        </div>

        <Link
          to="/teacher/create-exam"
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Exam</span>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Exams Created</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{totalExams}</div>
          <span className="text-xs text-slate-500 mt-1 block">Active online assessments</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Student Attempts</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{totalSubmissions}</div>
          <span className="text-xs text-slate-500 mt-1 block">Graded & recorded submissions</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Question Bank Size</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">{totalQuestions}</div>
          <span className="text-xs text-slate-500 mt-1 block">MCQs & Coding challenges</span>
        </div>
      </div>

      {/* Exams List Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Your Assessments</h2>
          <span className="text-xs text-slate-400">{exams.length} exams registered</span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-500">
            <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Loading your exams...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No exams created yet</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              Create your first timed exam and question bank to conduct secure proctored testing.
            </p>
            <Link
              to="/teacher/create-exam"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Exam</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {exams.map((exam) => {
              const examId = String(exam._id);
              return (
                <div
                  key={examId}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 shadow-xl transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Code Pill + Duration */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400 font-semibold uppercase">Access Code:</span>
                        <button
                          onClick={() => handleCopyCode(exam.examCode)}
                          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/20 font-mono font-bold text-sm transition-colors"
                          title="Click to copy code for students"
                        >
                          <span>{exam.examCode}</span>
                          {copiedCode === exam.examCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{exam.durationMinutes} mins</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {exam.description || 'No description provided.'}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center space-x-4 text-xs text-slate-400 pb-4 mb-4 border-b border-slate-800/80">
                      <span className="flex items-center space-x-1">
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-slate-200 font-semibold">{exam.questionCount || 0}</span> questions
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-slate-200 font-semibold">{exam.submissionCount || 0}</span> attempts
                      </span>
                      <span className="flex items-center space-x-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        <span>{exam.maxWarnings || 3} Max Strikes</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/teacher/exam/${examId}/questions`}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center space-x-1.5 border border-slate-700/60"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Manage Questions ({exam.questionCount || 0})</span>
                      </Link>

                      <Link
                        to={`/teacher/exam/${examId}/results`}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold transition-colors flex items-center space-x-1.5 border border-indigo-500/30"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Audit Report ({exam.submissionCount || 0})</span>
                      </Link>
                    </div>

                    <button
                      onClick={() => handleDeleteExam(examId, exam.title)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Exam"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
