import React from 'react';
import { ShieldCheck, AlertCircle, Sparkles, HelpCircle, Check, AlertTriangle } from 'lucide-react';

export const DealScoreGauge = ({ realDealScore }) => {
  if (!realDealScore) return null;

  const { score, tier, color, hasInflatedMrp, mrpInflationPercentage, couponRealityNote, isCouponFake, scoreBreakdown } = realDealScore;

  // Determine stroke color for the dial
  const strokeColor = score >= 80 ? '#10B981' : score >= 60 ? '#4F46E5' : score >= 40 ? '#F59E0B' : '#EF4444';
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Real Deal Score™</h3>
            <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
              Picksy Algorithm
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Objective value rating (0–100) stripping away fake marketing markups.
          </p>
        </div>

        <div className="text-right">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
              score >= 80
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : score >= 60
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : score >= 40
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {tier}
          </span>
        </div>
      </div>

      {/* Main Score & Radial Meter */}
      <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-100 mb-6">
        <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="#E2E8F0"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={strokeColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-slate-900 leading-none">{score}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">/ 100</span>
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="text-sm font-bold text-slate-800">
            {score >= 80 ? (
              <span className="text-emerald-700 flex items-center justify-center sm:justify-start gap-1.5">
                <Sparkles className="w-4 h-4" /> Genuine verified price low with zero fake conditions.
              </span>
            ) : score >= 60 ? (
              <span className="text-indigo-700 flex items-center justify-center sm:justify-start gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Solid, fair pricing in line with historical seasonal averages.
              </span>
            ) : (
              <span className="text-rose-700 flex items-center justify-center sm:justify-start gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Artificially inflated discount or restrictive coupon terms detected.
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {couponRealityNote}
          </p>

          {/* Inflated MRP Callout if detected */}
          {hasInflatedMrp && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-200/80 px-2.5 py-1 rounded-lg text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>
                <strong>MRP Inflated by {mrpInflationPercentage}%:</strong> Sellers marked up the catalog price to advertise exaggerated discounts.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Transparent Breakdown Breakdown List */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          Transparent Score Breakdown
        </h4>

        <div className="space-y-3">
          {scoreBreakdown?.map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-100 p-3 hover:border-slate-200 transition-colors">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-800">{item.category}</span>
                <span className="font-bold text-slate-900">
                  {item.score} <span className="text-slate-400 font-normal">/ {item.maxScore} pts</span>
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full rounded-full transition-all duration-700 bg-indigo-600"
                  style={{ width: `${Math.round((item.score / item.maxScore) * 100)}%` }}
                ></div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                <span>{item.note}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

