import React from 'react';
import { CheckCircle2, Bookmark, HelpCircle } from 'lucide-react';

export const QuestionPalette = ({
  questions = [],
  currentIndex = 0,
  answers = {},
  markedForReview = {},
  onSelect,
}) => {
  // Count states
  const total = questions.length;
  let answeredCount = 0;
  let reviewCount = 0;

  questions.forEach((q, idx) => {
    const qId = String(q._id || q.id);
    const hasAnswer = answers[qId] !== undefined && answers[qId] !== null && String(answers[qId]).trim() !== '';
    if (hasAnswer) answeredCount++;
    if (markedForReview[qId]) reviewCount++;
  });

  const unansweredCount = total - answeredCount;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          Question Palette
        </h3>
        <span className="text-xs text-slate-400 font-mono font-semibold">
          {currentIndex + 1} / {total}
        </span>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-xl p-2">
          <div className="text-emerald-400 font-bold text-base">{answeredCount}</div>
          <div className="text-[10px] text-emerald-400/80 uppercase font-semibold">Answered</div>
        </div>
        <div className="bg-amber-950/40 border border-amber-500/20 rounded-xl p-2">
          <div className="text-amber-400 font-bold text-base">{reviewCount}</div>
          <div className="text-[10px] text-amber-400/80 uppercase font-semibold">Review</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2">
          <div className="text-slate-300 font-bold text-base">{unansweredCount}</div>
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Remaining</div>
        </div>
      </div>

      {/* Numbers Grid */}
      <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
        {questions.map((q, idx) => {
          const qId = String(q._id || q.id);
          const isCurrent = idx === currentIndex;
          const hasAnswer = answers[qId] !== undefined && answers[qId] !== null && String(answers[qId]).trim() !== '';
          const isReview = Boolean(markedForReview[qId]);

          let statusClass = 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700';
          if (isReview) {
            statusClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30';
          } else if (hasAnswer) {
            statusClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30';
          }

          if (isCurrent) {
            statusClass += ' ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900 font-bold scale-105';
          }

          return (
            <button
              key={qId || idx}
              onClick={() => onSelect(idx)}
              className={`relative h-10 rounded-xl border text-sm font-semibold flex items-center justify-center transition-all ${statusClass}`}
              title={`Question ${idx + 1} (${q.type === 'code' ? 'Coding' : 'MCQ'})`}
            >
              <span>{idx + 1}</span>
              {isReview && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-slate-900" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 space-y-1.5">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
          <span>Answered question</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50" />
          <span>Marked for review</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
          <span>Not answered yet</span>
        </div>
      </div>
    </div>
  );
};
