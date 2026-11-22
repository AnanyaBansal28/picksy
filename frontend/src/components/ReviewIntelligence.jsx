import React from 'react';
import { ThumbsUp, ThumbsDown, ShieldCheck, AlertCircle, MessageSquareText, Target } from 'lucide-react';

export const ReviewIntelligence = ({ reviewIntelligence }) => {
  if (!reviewIntelligence) return null;

  const {
    verifiedBuyerConsensus,
    authenticityScore = 90,
    suspiciousReviewFlag,
    pros = [],
    cons = [],
    bestUseFor,
  } = reviewIntelligence;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              Review Intelligence™
            </h3>
            <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
              Verified Buyer Consensus
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            AI synthesis of hundreds of verified purchase reviews, filtering out bot spam and sponsored fluff.
          </p>
        </div>

        {/* Authenticity Score Meter */}
        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900">
                {authenticityScore}%
              </span>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Authentic Reviews
              </span>
            </div>
            <div className="w-32 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${authenticityScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Consensus Summary */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex items-start gap-3">
        <MessageSquareText className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
            Real Buyer Sentiment Consensus
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            "{verifiedBuyerConsensus}"
          </p>
        </div>
      </div>

      {/* Suspicious Patterns Callout */}
      {suspiciousReviewFlag && (
        <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-xl mb-6 flex items-start gap-2.5 text-xs text-amber-900 font-medium">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Pattern Analysis: </span>
            <span>{suspiciousReviewFlag}</span>
          </div>
        </div>
      )}

      {/* Pros & Cons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Pros */}
        <div className="bg-[#ECFDF5]/50 border border-[#A7F3D0]/70 p-4 rounded-xl">
          <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-3">
            <ThumbsUp className="w-4 h-4 text-emerald-600" />
            <span>Consensus Strengths (Pros)</span>
          </div>
          <ul className="space-y-2">
            {pros.map((pro, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-slate-700">
                <span className="text-emerald-600 font-bold text-sm leading-none mt-0.5">✓</span>
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons */}
        <div className="bg-[#FEF2F2]/50 border border-[#FECACA]/70 p-4 rounded-xl">
          <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs uppercase tracking-wider mb-3">
            <ThumbsDown className="w-4 h-4 text-rose-600" />
            <span>Honest Caveats (Cons)</span>
          </div>
          <ul className="space-y-2">
            {cons.map((con, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-slate-700">
                <span className="text-rose-500 font-bold text-sm leading-none mt-0.5">✕</span>
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Ideal For */}
      {bestUseFor && (
        <div className="flex items-center gap-2 text-xs bg-indigo-50/60 p-3 rounded-xl border border-indigo-100/70 text-indigo-950 font-medium">
          <Target className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>
            <strong>Picksy Recommended Audience:</strong> {bestUseFor}
          </span>
        </div>
      )}
    </div>
  );
};

