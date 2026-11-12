import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrustScoreBadge } from '../components/TrustScoreBadge';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Printer
} from 'lucide-react';

export const StudentResult = () => {
  const { submissionId } = useParams();
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const res = await authFetch(`/api/submissions/${submissionId}/result`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to retrieve exam results');
        setResult(data);

        // Fire celebration confetti if student passed and wasn't terminated
        if (data.isPassed && data.submission.status !== 'terminated') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-white">Calculating Official Score...</h2>
        <p className="text-xs text-slate-400 mt-1">Evaluating MCQ responses & proctor telemetry</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Result Error</h2>
          <p className="text-sm text-slate-400 mb-6">{error || 'Could not load submission report.'}</p>
          <Link
            to="/student/lobby"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Back to Exam Lobby
          </Link>
        </div>
      </div>
    );
  }

  const { submission, exam, maxScore, percentage, isPassed, warningCount, proctorLogs, reviewBreakdown } = result;
  const isTerminated = submission.status === 'terminated';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Banner Status */}
      <div className={`rounded-3xl p-6 sm:p-8 mb-8 border shadow-2xl ${
        isTerminated
          ? 'bg-gradient-to-br from-rose-950/80 via-slate-900 to-rose-950/60 border-rose-500/50'
          : isPassed
          ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border-emerald-500/40'
          : 'bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-900 border-amber-500/40'
      }`}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              isTerminated
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : isPassed
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {isTerminated ? (
                <XCircle className="w-9 h-9" />
              ) : isPassed ? (
                <Award className="w-9 h-9" />
              ) : (
                <AlertTriangle className="w-9 h-9" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  isTerminated
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : isPassed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isTerminated ? 'Assessment Terminated' : isPassed ? 'Examination Passed' : 'Did Not Pass'}
                </span>
                <TrustScoreBadge
                  score={100 - (warningCount * 33)}
                  isTerminated={isTerminated}
                />
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                {exam.title}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Attempt completed on {new Date(submission.submittedAt || Date.now()).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Big Score Callout */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-6 py-4 text-center min-w-[140px]">
            <div className={`text-4xl font-extrabold font-mono ${
              isTerminated ? 'text-rose-400' : isPassed ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {submission.totalScore} <span className="text-xl text-slate-500 font-normal">/ {maxScore}</span>
            </div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
              Score: {percentage}%
            </div>
          </div>
        </div>

        {/* Warning notification banner if terminated */}
        {isTerminated && (
          <div className="mt-6 pt-5 border-t border-rose-500/30 text-rose-300 text-xs sm:text-sm bg-rose-950/40 p-4 rounded-xl flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-200">Academic Integrity Violation Policy Triggered:</p>
              <p className="mt-0.5 opacity-90 leading-relaxed">
                {submission.terminationReason || 'This exam was auto-terminated because 3 proctoring strikes were detected (tab switching or fullscreen exit).'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Proctoring Timeline Breakdown */}
      {proctorLogs && proctorLogs.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 shadow-xl">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Proctoring Warnings Logged ({proctorLogs.length})</span>
          </h3>

          <div className="space-y-2.5">
            {proctorLogs.map((log, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs"
              >
                <div className="flex items-start space-x-3">
                  <span className="font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    Strike #{log.warningNumber || idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-slate-200 block capitalize">
                      {log.violationType.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400 text-[11px]">{log.details}</span>
                  </div>
                </div>
                <span className="font-mono text-slate-500 text-[10px] whitespace-nowrap ml-2">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question Review Breakdown */}
      <div className="space-y-4 mb-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>Question-by-Question Breakdown</span>
          </h2>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>

        {reviewBreakdown && reviewBreakdown.map((item, idx) => {
          return (
            <div
              key={idx}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-lg ${
                item.isCorrect
                  ? 'border-emerald-500/30'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    item.type === 'code'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  }`}>
                    {item.type === 'code' ? 'Coding' : 'MCQ'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    item.awardedMarks > 0
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    +{item.awardedMarks} / {item.marks} Marks
                  </span>
                  {item.isCorrect ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                </div>
              </div>

              {/* Question Statement */}
              <p className="text-sm text-slate-200 font-medium mb-3 whitespace-pre-wrap">
                {item.questionText}
              </p>

              {/* MCQ Options Display */}
              {item.type === 'mcq' && item.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-2">
                  {item.options.map((opt, optIdx) => {
                    const isStudentChoice = item.studentResponse !== null && Number(item.studentResponse) === optIdx;
                    const isCorrectAnswer = Number(item.correctOptionIndex) === optIdx;

                    let bg = 'bg-slate-950/50 border-slate-800/80 text-slate-400';
                    if (isCorrectAnswer) {
                      bg = 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-semibold';
                    } else if (isStudentChoice && !isCorrectAnswer) {
                      bg = 'bg-rose-950/40 border-rose-500/40 text-rose-300 font-semibold line-through';
                    }

                    return (
                      <div key={optIdx} className={`p-2 rounded-xl border flex items-center justify-between ${bg}`}>
                        <div className="flex items-center space-x-2 truncate">
                          <span className="font-mono text-[10px] text-slate-500">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <span className="truncate">{opt}</span>
                        </div>
                        {isStudentChoice && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 font-mono ml-1 text-white">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Coding Answer Display */}
              {item.type === 'code' && (
                <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-xs text-indigo-200 overflow-x-auto">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Your Submitted Code:</span>
                  <pre>{item.studentResponse || '(No code submitted)'}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Return Button */}
      <div className="text-center pt-4">
        <Link
          to="/student/lobby"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/30"
        >
          <span>Return to Exam Lobby</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
