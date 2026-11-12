import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Clock,
  Code2,
  AlertTriangle,
  Award,
  Users,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Lock,
  Eye,
  FileCheck2
} from 'lucide-react';

export const Home = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = async (role) => {
    try {
      if (role === 'teacher') {
        await login('teacher@exam.com', 'teacher123');
        navigate('/teacher');
      } else {
        await login('student@exam.com', 'student123');
        navigate('/student/lobby');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background Glow Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-emerald-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
        {/* Course Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs sm:text-sm font-semibold mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>1-Year Web Development Course — Final Project Architecture</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6">
          Online Quiz & Exam{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Proctoring System
          </span>
        </h1>

        <p className="max-w-3xl mx-auto text-lg sm:text-xl text-slate-300 mb-10 leading-relaxed">
          Enforce academic integrity during live timed assessments with automatic tab-switch detection, compulsory full-screen lock, clipboard protection, and the industry-standard <span className="text-rose-400 font-semibold">3-Strike Auto-Termination Engine</span>.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          {user ? (
            <Link
              to={user.role === 'teacher' ? '/teacher' : '/student/lobby'}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base rounded-2xl transition-all shadow-xl shadow-indigo-600/30 hover:scale-[1.02]"
            >
              <span>Go to Your {user.role === 'teacher' ? 'Teacher Dashboard' : 'Exam Lobby'}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <button
                onClick={() => handleQuickLogin('teacher')}
                className="w-full sm:w-auto flex items-center justify-center space-x-3 px-7 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02]"
              >
                <Users className="w-5 h-5 text-indigo-200" />
                <span>Demo Login: Teacher Portal</span>
              </button>

              <button
                onClick={() => handleQuickLogin('student')}
                className="w-full sm:w-auto flex items-center justify-center space-x-3 px-7 py-4 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold rounded-2xl shadow-xl transition-all hover:scale-[1.02]"
              >
                <Code2 className="w-5 h-5" />
                <span>Demo Login: Student Portal</span>
              </button>
            </>
          )}
        </div>

        {/* Quick Demo Access Bar */}
        <div className="max-w-xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-2 text-slate-300 font-semibold">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Pre-Loaded Demo Exam Code:</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-base font-extrabold px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 tracking-wider">
              DEV101
            </span>
            <Link
              to="/student/lobby"
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline"
            >
              Take Exam Now
            </Link>
          </div>
        </div>
      </section>

      {/* 5-Phase Architecture Feature Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/80">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Architectural Highlights & Modules</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Built strictly according to the 5-phase full-stack specification blueprint.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Phase 1: Role-Based JWT Auth</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Secure bcrypt password hashing and token authentication distinguishing Teachers from Students, protecting backend endpoints and client routes.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Phase 2: Exam & Question Builder</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Unique 6-character examCode generation, customizable durations, passing marks, and integrated bank for both 4-option MCQs and live coding challenges.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Phase 3: Server-Validated Timer</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Countdown timer synced with server timestamp to prevent browser DevTools manipulation. Instant server-side auto-grading for MCQs upon completion.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 rounded-2xl p-6 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Phase 4: 3-Strike Proctor Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Custom React hook <code className="text-rose-300 font-mono text-xs">useProctoring</code> intercepts tab switches, window blur, fullscreen exits, and copy-paste. Auto-terminates on strike 3!
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-teal-500/40 rounded-2xl p-6 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Phase 5: Integrity Audit Report</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Teacher audit table displaying student scores, completion vs termination flags, and an expandable timeline showing exact millisecond timestamps of every warning.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 rounded-2xl p-6 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Viva Ready: Dual-Window Demo</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Designed specifically for evaluator presentation: run teacher dashboard in standard window and student exam room in incognito window to watch live violation telemetry!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
