import React from 'react';
import { AlertTriangle, ShieldAlert, Maximize2, XCircle } from 'lucide-react';

export const WarningModal = ({ alert, isFullscreen, onEnterFullscreen, onDismiss, isTerminated }) => {
  if (!alert) return null;

  const isFinalStrike = isTerminated || alert.count >= alert.max;

  const getTitle = () => {
    if (isFinalStrike) return '🚨 EXAM TERMINATED - 3RD STRIKE DETECTED';
    return `⚠️ PROCTOR WARNING: STRIKE ${alert.count} OF ${alert.max}`;
  };

  const getViolationName = (type) => {
    switch (type) {
      case 'tab_switch':
        return 'Tab Switch / Window Focus Lost';
      case 'fullscreen_exit':
        return 'Exited Compulsory Full-Screen Mode';
      case 'copy_attempt':
        return 'Unauthorized Copy / Paste / Context Menu Action';
      default:
        return 'Integrity Policy Violation';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className={`w-full max-w-lg rounded-2xl border ${
        isFinalStrike ? 'border-rose-600 bg-rose-950/90' : 'border-amber-500/80 bg-slate-900/95'
      } p-6 sm:p-8 shadow-2xl shadow-rose-950/50 animate-pulse-danger`}>
        
        {/* Header Icon */}
        <div className="flex items-center space-x-3 mb-4">
          <div className={`p-3 rounded-xl ${isFinalStrike ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
            {isFinalStrike ? <XCircle className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
          </div>
          <div>
            <h3 className={`text-lg sm:text-xl font-bold tracking-tight ${isFinalStrike ? 'text-rose-300' : 'text-amber-300'}`}>
              {getTitle()}
            </h3>
            <span className="text-xs text-slate-400 font-mono">Logged at {alert.timestamp}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Violation Type</span>
            <span className="text-xs font-mono font-bold text-rose-400">{getViolationName(alert.type)}</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">
            {alert.details}
          </p>
        </div>

        {/* Strike Indicator Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs font-semibold mb-2 text-slate-300">
            <span>Violations Counter:</span>
            <span className={isFinalStrike ? 'text-rose-400 font-bold' : 'text-amber-400'}>
              {alert.count} / {alert.max} Strikes
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((strike) => (
              <div
                key={strike}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  strike <= alert.count
                    ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Policy Notice */}
        {isFinalStrike ? (
          <div className="bg-rose-900/30 border border-rose-500/40 rounded-xl p-4 text-center mb-6">
            <p className="text-sm font-semibold text-rose-200">
              You have reached the maximum allowed 3 strikes. Your exam has been locked and automatically submitted to your instructor for academic integrity audit.
            </p>
          </div>
        ) : (
          <div className="text-xs text-slate-400 bg-slate-800/40 rounded-lg p-3 mb-6 space-y-1">
            <p className="font-semibold text-slate-300">⚠️ 3-Strike Auto-Termination Reminder:</p>
            <p>Every tab switch, application change, or fullscreen exit is permanently logged with timestamps. Upon 3 warnings, you are immediately locked out.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!isFullscreen && !isFinalStrike && (
            <button
              onClick={onEnterFullscreen}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/30"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Re-enter Full-Screen</span>
            </button>
          )}

          {!isFinalStrike ? (
            <button
              onClick={onDismiss}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              I Understand, Continue Exam
            </button>
          ) : (
            <button
              onClick={onDismiss}
              className="w-full px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-rose-600/30"
            >
              View Submission Status
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
