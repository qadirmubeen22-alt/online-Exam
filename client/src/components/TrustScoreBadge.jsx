import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

export const TrustScoreBadge = ({ score = 100, isTerminated = false }) => {
  const numericScore = isTerminated ? 0 : Math.max(0, Math.min(100, Math.round(score)));

  let color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let Icon = ShieldCheck;
  let label = 'High Integrity';

  if (isTerminated || numericScore === 0) {
    color = 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse';
    Icon = ShieldX;
    label = 'Terminated';
  } else if (numericScore < 60) {
    color = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    Icon = ShieldAlert;
    label = 'High Risk';
  } else if (numericScore < 85) {
    color = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    Icon = ShieldAlert;
    label = 'Warnings Logged';
  }

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${color}`}>
      <Icon className="w-4 h-4" />
      <span>{numericScore}% Trust</span>
      <span className="opacity-60 font-normal">({label})</span>
    </div>
  );
};
