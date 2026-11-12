import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, ShieldAlert, Award, FileText, CheckCircle, Sparkles } from 'lucide-react';

export const ExamBuilder = () => {
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [passingScore, setPassingScore] = useState(50);
  const [maxWarnings, setMaxWarnings] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authFetch('/api/exams', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          durationMinutes: Number(durationMinutes),
          passingScore: Number(passingScore),
          maxWarnings: Number(maxWarnings),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create exam');

      // Navigate straight to Question Manager for this new exam
      const newExamId = String(data.exam._id);
      navigate(`/teacher/exam/${newExamId}/questions`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back Button */}
      <Link
        to="/teacher"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="mb-8">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Phase 2: Exam Builder</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Create New Assessment</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure exam duration, integrity thresholds, and auto-generate an Exam Access Code.
        </p>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {error && (
          <div className="p-4 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Exam Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Full-Stack Web Development Midterm Exam"
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Instructions & Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe exam coverage, allowed references, and expectations for students..."
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl p-4 text-sm text-white placeholder-slate-600 outline-none transition-colors resize-none"
            />
          </div>

          {/* Grid settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Duration (Minutes)</span>
              </label>
              <input
                type="number"
                min={1}
                max={240}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Countdown timer limit</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Passing Score (%)</span>
              </label>
              <input
                type="number"
                min={0}
                max={100}
                required
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Minimum % to pass</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Max Warnings</span>
              </label>
              <input
                type="number"
                min={1}
                max={10}
                required
                value={maxWarnings}
                onChange={(e) => setMaxWarnings(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">3-strike auto-submit</span>
            </div>
          </div>

          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center space-x-2 text-indigo-300 font-semibold">
              <CheckCircle className="w-4 h-4 text-indigo-400" />
              <span>What happens next?</span>
            </div>
            <p>
              A unique 6-character access code will be automatically generated. You will be taken immediately to the <strong>Question Manager</strong> to add MCQs and Coding problems.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/teacher')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create & Add Questions →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
