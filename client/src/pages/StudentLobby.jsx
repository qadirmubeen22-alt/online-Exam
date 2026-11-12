import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Clock,
  FileText,
  Maximize2,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Lock,
  Eye,
  Camera
} from 'lucide-react';

export const StudentLobby = () => {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();

  const [examCode, setExamCode] = useState('DEV101');
  const [examDetails, setExamDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleLookupExam = async (e) => {
    if (e) e.preventDefault();
    if (!examCode.trim()) return;

    setError('');
    setLoading(true);

    try {
      const res = await authFetch(`/api/exams/code/${examCode.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Exam not found');
      setExamDetails(data.exam);
    } catch (err) {
      setError(err.message);
      setExamDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async () => {
    if (!agreed) {
      alert('Please confirm that you have read and agreed to the exam proctoring rules.');
      return;
    }

    try {
      // Request Fullscreen immediately on user gesture
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        await document.documentElement.webkitRequestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request prompt dismissed or handled by room:', err);
    }

    navigate(`/exam/take/${examDetails.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Title Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-3">
          <ShieldCheck className="w-4 h-4" />
          <span>Student Assessment Portal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Join Proctored Examination</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
          Enter your teacher-assigned 6-character exam access code, review integrity rules, and initialize full-screen mode.
        </p>
      </div>

      {/* Code Input Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8">
        <form onSubmit={handleLookupExam} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              6-Character Access Code
            </label>
            <input
              type="text"
              required
              maxLength={10}
              value={examCode}
              onChange={(e) => setExamCode(e.target.value.toUpperCase())}
              placeholder="e.g. DEV101"
              className="w-full bg-slate-950 font-mono text-center tracking-widest text-lg sm:text-xl font-extrabold text-emerald-400 border border-slate-800 focus:border-emerald-500 rounded-2xl py-3 px-4 outline-none uppercase transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto sm:self-end py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Verifying Code...' : 'Lookup Exam'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs sm:text-sm flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Exam Details Card */}
      {examDetails && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
          {/* Header & Meta */}
          <div className="border-b border-slate-800 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <span className="text-xs uppercase font-mono font-bold px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Code: {examDetails.examCode}
              </span>
              <div className="flex items-center space-x-3 text-xs text-slate-400 font-semibold">
                <span className="flex items-center space-x-1 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{examDetails.durationMinutes} Minutes</span>
                </span>
                <span className="flex items-center space-x-1 text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{examDetails.questionCount} Questions</span>
                </span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">{examDetails.title}</h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              {examDetails.description || 'No special instructions provided by the instructor.'}
            </p>
          </div>

          {/* Existing submission check */}
          {examDetails.existingSubmission && (
            <div className={`p-4 rounded-2xl border ${
              examDetails.existingSubmission.status === 'terminated'
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
            }`}>
              <p className="text-sm font-semibold mb-1">
                You already attempted this assessment.
              </p>
              <p className="text-xs opacity-80 mb-3">
                Status: <strong className="uppercase">{examDetails.existingSubmission.status}</strong> • Score: {examDetails.existingSubmission.totalScore}
              </p>
              <button
                type="button"
                onClick={() => navigate(`/exam/result/${examDetails.existingSubmission.id}`)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                View Your Score & Report →
              </button>
            </div>
          )}

          {/* Proctoring Rules Checklist */}
          {(!examDetails.existingSubmission || examDetails.existingSubmission.status === 'in-progress') && (
            <>
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Compulsory Anti-Cheating & Proctoring Rules</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center space-x-2 font-bold text-slate-200">
                      <Maximize2 className="w-4 h-4 text-indigo-400" />
                      <span>Full-Screen Enforcement</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      You must remain in full-screen mode at all times. Exiting full-screen or pressing Escape registers an integrity strike.
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center space-x-2 font-bold text-slate-200">
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>Tab-Switch & Blur Intercept</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      Navigating away to another tab, minimizing the browser, or switching to any external app triggers a strike immediately.
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center space-x-2 font-bold text-slate-200">
                      <Lock className="w-4 h-4 text-purple-400" />
                      <span>Clipboard & Right-Click Lock</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      Copy (Ctrl+C), Paste (Ctrl+V), and right-click context menus are completely locked during active testing.
                    </p>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-1">
                    <div className="flex items-center space-x-2 font-bold text-rose-400">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>3-Strike Auto-Termination</span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                      Each violation is timestamped and recorded. On the <strong>3rd warning</strong>, your exam is terminated and locked out permanently.
                    </p>
                  </div>
                </div>
              </div>

              {/* Agreement checkbox */}
              <label className="flex items-start space-x-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-emerald-500 rounded border-slate-700 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-300 leading-relaxed">
                  I understand that this assessment is proctored with automated tab-switch and full-screen monitoring. I agree not to switch tabs, use external aids, or exit full-screen mode.
                </span>
              </label>

              {/* Start Button */}
              <button
                type="button"
                onClick={handleStartExam}
                disabled={!agreed}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base rounded-2xl transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Maximize2 className="w-5 h-5" />
                <span>Launch Full-Screen & Start Assessment</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
