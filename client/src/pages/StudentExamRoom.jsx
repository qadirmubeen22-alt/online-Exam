import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProctoring } from '../hooks/useProctoring';
import { QuestionPalette } from '../components/QuestionPalette';
import { CodeEditor } from '../components/CodeEditor';
import { WarningModal } from '../components/WarningModal';
import { WebcamProctorPreview } from '../components/WebcamProctorPreview';
import {
  Clock,
  ShieldAlert,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Send,
  AlertTriangle,
  RotateCcw,
  Maximize2
} from 'lucide-react';

export const StudentExamRoom = () => {
  const { examId } = useParams();
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [exam, setExam] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [qId]: response }
  const [markedForReview, setMarkedForReview] = useState({}); // { [qId]: boolean }

  // Timer states
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Ref to hold submission id for proctoring hook
  const submissionId = submission ? String(submission._id) : null;
  const isExamActive = Boolean(submission && submission.status === 'in-progress' && !isSubmitting);

  // Auto-submit callback triggered if proctor terminates exam (3rd strike)
  const handleAutoTerminate = useCallback(async (reason) => {
    if (!submission) return;
    setIsSubmitting(true);
    try {
      // Exit fullscreen
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      navigate(`/exam/result/${submission._id}`);
    } catch (err) {
      console.error('Terminate redirect error:', err);
    }
  }, [submission, navigate]);

  // Hook for 3-strike proctoring
  const {
    warnings,
    currentAlert,
    isTerminated,
    isFullscreen,
    enterFullscreen,
    dismissAlert,
  } = useProctoring({
    submissionId,
    isActive: isExamActive,
    maxWarnings: exam?.maxWarnings || 3,
    onTerminate: handleAutoTerminate,
  });

  // Initialize exam & session
  useEffect(() => {
    let isMounted = true;
    const startOrResumeExam = async () => {
      try {
        setLoading(true);
        const res = await authFetch('/api/submissions/start', {
          method: 'POST',
          body: JSON.stringify({ examId }),
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.submissionId) {
            navigate(`/exam/result/${data.submissionId}`);
            return;
          }
          throw new Error(data.message || 'Failed to start exam');
        }

        if (isMounted) {
          setExam(data.exam);
          setSubmission(data.submission);
          setQuestions(data.questions || []);
          setRemainingSeconds(data.remainingSeconds);

          // Restore existing answers if resuming
          const initialAnswers = {};
          const initialReview = {};
          if (data.submission.answers && Array.isArray(data.submission.answers)) {
            data.submission.answers.forEach(a => {
              const qId = String(a.questionId);
              initialAnswers[qId] = a.response;
              if (a.isMarkedForReview) initialReview[qId] = true;
            });
          }
          setAnswers(initialAnswers);
          setMarkedForReview(initialReview);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    startOrResumeExam();

    return () => {
      isMounted = false;
    };
  }, [examId]);

  // Submit helper
  const handleSubmitExam = useCallback(async () => {
    if (!submission) return;
    setIsSubmitting(true);
    try {
      // Build final answers payload
      const formattedAnswers = questions.map(q => {
        const qId = String(q._id || q.id);
        return {
          questionId: qId,
          response: answers[qId] !== undefined ? answers[qId] : null,
          isMarkedForReview: Boolean(markedForReview[qId]),
        };
      });

      const res = await authFetch('/api/submissions/submit', {
        method: 'POST',
        body: JSON.stringify({
          submissionId: String(submission._id),
          answers: formattedAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');

      // Exit fullscreen safely
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }

      navigate(`/exam/result/${submission._id}`);
    } catch (err) {
      alert(`Error submitting exam: ${err.message}`);
      setIsSubmitting(false);
    }
  }, [submission, questions, answers, markedForReview, authFetch, navigate]);

  // Live Countdown Timer
  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0 || !isExamActive) return;

    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit when timer hits 00:00
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, isExamActive, handleSubmitExam]);

  // Save single answer update (auto-save in background)
  const saveAnswerToBackend = async (qId, responseVal, reviewVal) => {
    if (!submission) return;
    try {
      await authFetch('/api/submissions/save-answer', {
        method: 'POST',
        body: JSON.stringify({
          submissionId: String(submission._id),
          questionId: qId,
          response: responseVal,
          isMarkedForReview: reviewVal,
        }),
      });
    } catch (err) {
      console.warn('Auto-save answer warning:', err);
    }
  };

  const handleSelectAnswer = (qId, val) => {
    const updated = { ...answers, [qId]: val };
    setAnswers(updated);
    saveAnswerToBackend(qId, val, markedForReview[qId]);
  };

  const toggleMarkForReview = (qId) => {
    const currentStatus = Boolean(markedForReview[qId]);
    const updated = { ...markedForReview, [qId]: !currentStatus };
    setMarkedForReview(updated);
    saveAnswerToBackend(qId, answers[qId], !currentStatus);
  };

  const handleClearAnswer = (qId) => {
    const updated = { ...answers };
    delete updated[qId];
    setAnswers(updated);
    saveAnswerToBackend(qId, null, markedForReview[qId]);
  };

  // Format timer HH:MM:SS or MM:SS
  const formatTimer = (totalSec) => {
    if (totalSec === null || totalSec === undefined) return '--:--';
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold text-white">Initializing Locked Exam Room...</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to proctoring telemetry engine</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Unable to Join Assessment</h2>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/student/lobby')}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Return to Exam Lobby
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentQId = currentQ ? String(currentQ._id || currentQ.id) : null;
  const currentAnswer = currentQId ? answers[currentQId] : null;
  const isMarked = currentQId ? Boolean(markedForReview[currentQId]) : false;
  const isUrgentTimer = remainingSeconds !== null && remainingSeconds < 300; // Under 5 minutes

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col select-none">
      {/* Red Alert Modal for Proctor Violations */}
      <WarningModal
        alert={currentAlert}
        isFullscreen={isFullscreen}
        onEnterFullscreen={enterFullscreen}
        onDismiss={dismissAlert}
        isTerminated={isTerminated}
      />

      {/* Top Proctored Exam Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        {/* Exam Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
            {currentIndex + 1}
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
              {exam.title}
            </h1>
            <span className="text-[11px] text-slate-400 font-mono">
              Code: {exam.examCode} • Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
        </div>

        {/* Center / Right Telemetry: Timer & Warning Counter */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          {/* Proctor Warnings Status */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <ShieldAlert className={`w-4 h-4 ${warnings > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
            <div className="text-xs">
              <span className="text-slate-400 hidden sm:inline">Warnings: </span>
              <span className={`font-mono font-bold ${warnings > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {warnings} / {exam.maxWarnings || 3}
              </span>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-xl border ${
            isUrgentTimer
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 animate-timer-urgent'
              : 'bg-slate-950 border-slate-800 text-slate-200'
          }`}>
            <Clock className={`w-4 h-4 ${isUrgentTimer ? 'text-rose-400' : 'text-amber-400'}`} />
            <span className="font-mono font-bold text-sm sm:text-base tracking-wider">
              {formatTimer(remainingSeconds)}
            </span>
          </div>

          {/* Fullscreen restore button if dropped */}
          {!isFullscreen && (
            <button
              onClick={enterFullscreen}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all animate-pulse"
              title="Click to restore full-screen mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restore Full-Screen</span>
            </button>
          )}

          {/* Submit Exam Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish Test</span>
          </button>
        </div>
      </header>

      {/* Main Test Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Question Interface */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
          {currentQ ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex-1 flex flex-col justify-between">
              <div>
                {/* Question Type & Marks Pill */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                      currentQ.type === 'code'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {currentQ.type === 'code' ? '💻 Coding Challenge' : '📝 Multiple Choice'}
                    </span>
                    {isMarked && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Marked for Review
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    {currentQ.marks || 1} Marks
                  </span>
                </div>

                {/* Question Text */}
                <h2 className="text-base sm:text-lg font-semibold text-white mb-6 leading-relaxed whitespace-pre-wrap">
                  {currentQ.questionText}
                </h2>

                {/* Question Type: MCQ Options */}
                {currentQ.type === 'mcq' && (
                  <div className="space-y-3 mb-6">
                    {currentQ.options && currentQ.options.map((opt, optIdx) => {
                      const isSelected = currentAnswer !== null && currentAnswer !== undefined && Number(currentAnswer) === optIdx;
                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectAnswer(currentQId, optIdx)}
                          className={`flex items-center space-x-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 ring-1 ring-indigo-500'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-mono text-xs font-bold transition-all ${
                            isSelected
                              ? 'border-indigo-400 bg-indigo-500 text-white'
                              : 'border-slate-700 text-slate-400'
                          }`}>
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <span className="text-sm font-medium flex-1">{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Question Type: Code Editor */}
                {currentQ.type === 'code' && (
                  <div className="mb-6">
                    <CodeEditor
                      starterCode={currentQ.starterCode}
                      value={currentAnswer !== null && currentAnswer !== undefined ? currentAnswer : currentQ.starterCode}
                      onChange={(newCode) => handleSelectAnswer(currentQId, newCode)}
                      sampleInput={currentQ.sampleInput}
                      sampleOutput={currentQ.sampleOutput}
                      marks={currentQ.marks}
                    />
                  </div>
                )}
              </div>

              {/* Action Bottom Bar */}
              <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => toggleMarkForReview(currentQId)}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      isMarked
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{isMarked ? 'Unmark Review' : 'Mark for Review'}</span>
                  </button>

                  {currentAnswer !== null && currentAnswer !== undefined && (
                    <button
                      type="button"
                      onClick={() => handleClearAnswer(currentQId)}
                      className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear Response</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                    className="flex items-center space-x-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentIndex === questions.length - 1}
                    onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                    className="flex items-center space-x-1 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-500">No questions available.</div>
          )}
        </div>

        {/* Right Column: Palette & AI Webcam Proctor Feed */}
        <div className="lg:col-span-4 space-y-6">
          {/* Question Palette */}
          <QuestionPalette
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            markedForReview={markedForReview}
            onSelect={(idx) => setCurrentIndex(idx)}
          />

          {/* AI Biometric Camera Feed */}
          <WebcamProctorPreview />
        </div>
      </div>

      {/* Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Confirm Final Submission?</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Once submitted, your answers will be auto-graded and logged. You will not be able to return to this exam session.
            </p>

            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 mb-6 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Questions:</span>
                <span className="text-white font-bold">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Answered:</span>
                <span className="text-emerald-400 font-bold">
                  {Object.keys(answers).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Proctor Warnings:</span>
                <span className={warnings > 0 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                  {warnings} / {exam.maxWarnings || 3}
                </span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors"
              >
                Return to Exam
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitExam}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50"
              >
                {isSubmitting ? 'Grading...' : 'Yes, Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
