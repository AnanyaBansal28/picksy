import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

export const VerdictBadge = ({ verdict, size = 'md' }) => {
  const isBuy = verdict === 'BUY NOW';
  const isWait = verdict === 'WAIT';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1 font-semibold rounded-lg',
    md: 'text-xs px-3 py-1 gap-1.5 font-bold tracking-wide rounded-full',
    lg: 'text-sm px-4 py-1.5 gap-2 font-bold tracking-wide rounded-full shadow-sm',
  };

  if (isBuy) {
    return (
      <span className={`inline-flex items-center bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] ${sizeClasses[size]}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
        <CheckCircle2 className={size === 'lg' ? 'w-4 h-4 text-[#10B981]' : 'w-3.5 h-3.5 text-[#10B981]'} />
        <span>VERDICT: BUY NOW</span>
      </span>
    );
  }

  if (isWait) {
    return (
      <span className={`inline-flex items-center bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] ${sizeClasses[size]}`}>
        <Clock className={size === 'lg' ? 'w-4 h-4 text-[#F59E0B]' : 'w-3.5 h-3.5 text-[#F59E0B]'} />
        <span>VERDICT: WAIT</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center bg-[#EEF2FF] text-[#3730A3] border border-[#C7D2FE] ${sizeClasses[size]}`}>
      <Sparkles className={size === 'lg' ? 'w-4 h-4 text-[#4F46E5]' : 'w-3.5 h-3.5 text-[#4F46E5]'} />
      <span>VERDICT: FAIR PRICE</span>
    </span>
  );
};

export const DealScoreBadge = ({ score, tier }) => {
  if (score >= 80) {
    return (
      <div className="inline-flex items-center gap-1.5 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] px-2.5 py-1 rounded-full text-xs font-semibold">
        <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
        <span>Real Deal: {score}/100</span>
      </div>
    );
  }
  if (score >= 60) {
    return (
      <div className="inline-flex items-center gap-1.5 bg-[#EEF2FF] text-[#3730A3] border border-[#C7D2FE] px-2.5 py-1 rounded-full text-xs font-semibold">
        <span>Real Deal: {score}/100</span>
      </div>
    );
  }
  if (score >= 40) {
    return (
      <div className="inline-flex items-center gap-1.5 bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] px-2.5 py-1 rounded-full text-xs font-semibold">
        <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
        <span>Deal Score: {score}/100</span>
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] px-2.5 py-1 rounded-full text-xs font-semibold">
      <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
      <span>Fake Discount / Overpriced ({score}/100)</span>
    </div>
  );
};

export const PicksyTopPickBadge = () => {
  return (
    <span className="inline-flex items-center gap-1 bg-[#4F46E5] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm tracking-wide uppercase">
      <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
      Picksy's Top Choice
    </span>
  );
};
