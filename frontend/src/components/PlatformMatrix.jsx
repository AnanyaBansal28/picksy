import React from 'react';
import { Check, Star, ShieldCheck, Truck, RefreshCw, ExternalLink, Sparkles, Tag, AlertTriangle } from 'lucide-react';
import { PicksyTopPickBadge } from './DecisionBadge';

export const PlatformMatrix = ({ evaluatedPlatforms = [], bestPlatform, recommendationReasons = [] }) => {
  if (!evaluatedPlatforms || evaluatedPlatforms.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">
                Side-by-Side Platform Price Comparison (Picksy View)
              </h3>
              <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                All Hidden Fees Included
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              We calculate actual out-of-pocket cost by adding shipping fees and applying verified coupon discounts.
            </p>
          </div>
        </div>

        {/* Best Platform Recommendation Banner */}
        {bestPlatform && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-white to-emerald-50/50 border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-xs uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                🏆 Best Platform to Buy: {bestPlatform.platform}
              </span>
              <span className="text-xs font-bold text-slate-900">
                Final Net Price: ₹{bestPlatform.netPayablePrice?.toLocaleString('en-IN')}
              </span>
            </div>

            {recommendationReasons.length > 0 && (
              <ul className="space-y-1.5 pl-1 mt-2">
                {recommendationReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Comparison Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
              <th className="py-3 px-3 rounded-l-xl">Platform</th>
              <th className="py-3 px-3">Base Price</th>
              <th className="py-3 px-3">Delivery & Fees</th>
              <th className="py-3 px-3">Applicable Coupon</th>
              <th className="py-3 px-3">Final Net Price</th>
              <th className="py-3 px-3">Seller Rating & Returns</th>
              <th className="py-3 px-3">ETA</th>
              <th className="py-3 px-3 text-right rounded-r-xl">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {evaluatedPlatforms.map((listing, index) => {
              const isBest = bestPlatform && listing.platform === bestPlatform.platform;
              const coupon = listing.couponDetails;

              return (
                <tr
                  key={index}
                  className={`transition-colors ${
                    isBest ? 'bg-emerald-50/40 font-medium' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Platform Name */}
                  <td className="py-4 px-3 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 font-extrabold text-slate-900 text-sm">
                        <span>{listing.platform}</span>
                      </div>
                      {isBest && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full w-fit">
                          ★ Best Deal
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Base Price */}
                  <td className="py-4 px-3 align-top font-bold text-slate-800 text-sm">
                    ₹{listing.basePrice?.toLocaleString('en-IN')}
                  </td>

                  {/* Delivery & Fees */}
                  <td className="py-4 px-3 align-top">
                    {listing.deliveryFee === 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        FREE Delivery
                      </span>
                    ) : (
                      <span className="text-amber-900 font-bold">
                        +₹{listing.deliveryFee} shipping
                      </span>
                    )}
                    {listing.handlingFee > 0 && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        +₹{listing.handlingFee} handling
                      </div>
                    )}
                  </td>

                  {/* Coupon Details with Reality Check */}
                  <td className="py-4 px-3 align-top">
                    {coupon?.code ? (
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[11px]">
                            <Tag className="w-3 h-3" />
                            {coupon.code} (-₹{coupon.discountAmount})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 max-w-[150px]">
                          {coupon.terms}
                        </div>
                        {coupon.isFakeDiscount && (
                          <div className="text-[10px] text-rose-700 font-bold mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Fake / Restricted Coupon</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">No Coupon Needed</span>
                    )}
                  </td>

                  {/* Final Net Price */}
                  <td className="py-4 px-3 align-top">
                    <div className="text-base font-black text-slate-950">
                      ₹{listing.netPayablePrice?.toLocaleString('en-IN')}
                    </div>
                    {listing.savingsVsMrp > 0 && (
                      <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        Save ₹{listing.savingsVsMrp.toLocaleString('en-IN')} vs MRP
                      </div>
                    )}
                  </td>

                  {/* Seller & Return Policy */}
                  <td className="py-4 px-3 align-top">
                    <div className="flex items-center gap-1 text-slate-900 font-bold">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{listing.sellerRating}★</span>
                      <span className="text-slate-500 font-normal truncate max-w-[120px]" title={listing.sellerName}>
                        {listing.sellerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-1 font-medium">
                      <RefreshCw className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate max-w-[140px]" title={listing.returnPolicy}>
                        {listing.returnPolicy}
                      </span>
                    </div>
                  </td>

                  {/* ETA */}
                  <td className="py-4 px-3 align-top font-medium text-slate-700">
                    <div className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{listing.eta}</span>
                    </div>
                  </td>

                  {/* Direct Buy CTA */}
                  <td className="py-4 px-3 align-top text-right">
                    <a
                      href={listing.productUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                        isBest
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>Buy on {listing.platform}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
