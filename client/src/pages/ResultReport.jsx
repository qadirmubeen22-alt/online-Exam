import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrustScoreBadge } from '../components/TrustScoreBadge';
import {
  ArrowLeft,
  Users,
  Award,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Clock,
  Printer,
  Sparkles,
  AlertTriangle,
  XCircle,
  CheckCircle2
} from 'lucide-react';

export const ResultReport = () => {
  const { id: examId } = useParams();
  const { authFetch } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchAuditReport = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await authFetch(`/api/exams/${examId}/audit-report`);
      const reportData = await res.json();
      if (!res.ok) throw new Error(reportData.message || 'Failed to fetch audit report');
      setData(reportData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuditReport();
  }, [examId]);

  // Auto-refresh poll every 5 seconds for live evaluator dual-window presentation
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchAuditReport(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, examId]);

  const toggleExpand = (subId) => {
    setExpandedRow(expandedRow === subId ? null : subId);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
        <div className="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm">Loading proctoring audit telemetry...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm mb-4">
          {error || 'Unable to load report.'}
        </div>
        <Link to="/teacher" className="text-indigo-400 font-semibold underline text-sm">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { exam, maxScore, totalAttempts, reports } = data;

  // KPI Calculations
  const completedAttempts = reports.filter(r => r.status === 'completed');
  const terminatedAttempts = reports.filter(r => r.status === 'terminated');
  const passedCount = reports.filter(r => r.isPassed && r.status !== 'terminated').length;
  const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;
  const avgTrustScore = totalAttempts > 0
    ? Math.round(reports.reduce((acc, r) => acc + r.trustScore, 0) / totalAttempts)
    : 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Link
          to="/teacher"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center space-x-3">
          {/* Live Polling Switch */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              autoRefresh
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Auto-polls for student violations in real-time"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
            <span>{autoRefresh ? 'Live Monitoring Active' : 'Live Polling Paused'}</span>
          </button>

          <button
            onClick={() => fetchAuditReport(true)}
            disabled={refreshing}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export / Print</span>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 mb-8 shadow-2xl">
        <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Phase 5: Integrity Audit & Results Telemetry</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{exam.title}</h1>
        <p className="text-xs text-slate-400">
          Access Code: <span className="font-mono font-bold text-emerald-400">{exam.examCode}</span> • Max Warnings Policy: {exam.maxWarnings || 3} Strikes • Passing Score: {exam.passingScore}%
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Attempts</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{totalAttempts}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Students submitted or active</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Passing Rate</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{passRate}%</div>
          <span className="text-[11px] text-slate-500 mt-1 block">{passedCount} of {totalAttempts} passed</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Terminated (Cheating)</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400">{terminatedAttempts.length}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Exceeded 3 proctor strikes</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg. Trust Score</span>
            <ShieldCheck className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-extrabold text-teal-400">{avgTrustScore}%</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Proctor integrity index</span>
        </div>
      </div>

      {/* Student Submissions Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Student Submission Ledger & Warning Audit</h2>
          <span className="text-xs text-slate-400">{reports.length} records</span>
        </div>

        {reports.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p className="text-sm font-semibold text-slate-400">No student attempts recorded yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Give code <strong className="text-emerald-400 font-mono">{exam.examCode}</strong> to a student to start testing!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {reports.map((report) => {
              const subId = report.submissionId;
              const isExpanded = expandedRow === subId;
              const hasWarnings = report.proctorLogs && report.proctorLogs.length > 0;

              return (
                <div key={subId} className="transition-colors hover:bg-slate-800/20">
                  {/* Table Row Content */}
                  <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Student Info */}
                    <div className="flex items-center space-x-3 min-w-[220px]">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-indigo-400">
                        {report.student?.name ? report.student.name.slice(0, 2).toUpperCase() : 'ST'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{report.student?.name || 'Anonymous Student'}</div>
                        <div className="text-xs text-slate-400 font-mono">{report.student?.email || 'N/A'}</div>
                      </div>
                    </div>

                    {/* Score & Percentage */}
                    <div className="min-w-[130px]">
                      <div className="text-sm font-extrabold text-white">
                        {report.totalScore} / {maxScore} <span className="text-xs font-semibold text-slate-400 font-normal">({report.percentage}%)</span>
                      </div>
                      <span className={`text-[11px] font-semibold ${report.isPassed ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {report.isPassed ? '✓ Passed Assessment' : '✗ Below Pass Mark'}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {report.status === 'terminated' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Terminated (Cheating)</span>
                        </span>
                      ) : report.status === 'completed' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          <span>In-Progress</span>
                        </span>
                      )}
                    </div>

                    {/* Proctor Trust Score & Warnings Pill */}
                    <div className="flex items-center space-x-2">
                      <TrustScoreBadge
                        score={report.trustScore}
                        isTerminated={report.status === 'terminated'}
                      />
                      <span className={`text-xs font-mono font-bold px-2 py-1 rounded-lg border ${
                        report.warningCount > 0
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {report.warningCount} Warnings
                      </span>
                    </div>

                    {/* Expand Timeline Button */}
                    <div>
                      <button
                        onClick={() => toggleExpand(subId)}
                        disabled={!hasWarnings}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
                          hasWarnings
                            ? 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
                            : 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        <span>{hasWarnings ? `Timeline (${report.proctorLogs.length})` : 'Clean Log'}</span>
                        {hasWarnings && (isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Proctoring Warning Timeline */}
                  {isExpanded && hasWarnings && (
                    <div className="px-6 py-4 bg-slate-950/70 border-t border-slate-800/80 animate-fade-in">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-2">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Exact Timestamped Violation Audit Trail:</span>
                      </h4>

                      <div className="space-y-2">
                        {report.proctorLogs.map((log, lIdx) => (
                          <div
                            key={lIdx}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800/90 text-xs"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                Strike #{log.warningNumber || lIdx + 1}
                              </span>
                              <div>
                                <span className="font-semibold text-slate-200 capitalize mr-2">
                                  {log.violationType.replace('_', ' ')}
                                </span>
                                <span className="text-slate-400 text-[11px]">{log.details}</span>
                              </div>
                            </div>

                            <span className="font-mono text-slate-500 text-[11px] whitespace-nowrap ml-4">
                              {new Date(log.timestamp).toLocaleTimeString()} ({new Date(log.timestamp).toLocaleDateString()})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
