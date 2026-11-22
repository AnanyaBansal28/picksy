import React from 'react';
import { Check, Star, ShieldCheck, Truck, RefreshCw, ExternalLink, Sparkles, Tag } from 'lucide-react';
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
              <h3 className="text-base font-bold text-slate-900">
                Multi-Platform Comparison Matrix
              </h3>
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full">
                All Fees Included
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              We look beyond base price to factor in shipping fees, return safety, and seller reputation.
            </p>
          </div>
        </div>

        {/* Picksy Top Recommendation Callout Box */}
        {recommendationReasons.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/40 border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <PicksyTopPickBadge />
              <span className="text-xs font-bold text-slate-900">
                Why Picksy recommends {bestPlatform?.platform}:
              </span>
            </div>
            <ul className="space-y-1.5 pl-1">
              {recommendationReasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Comparison Grid / Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3">Platform</th>
              <th className="py-3 px-3">Base Price</th>
              <th className="py-3 px-3">Shipping / Hidden Fees</th>
              <th className="py-3 px-3">Coupons / Bank Card</th>
              <th className="py-3 px-3">Net Payable</th>
              <th className="py-3 px-3">Seller & Returns</th>
              <th className="py-3 px-3">ETA</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {evaluatedPlatforms.map((listing, index) => {
              const isBest = bestPlatform && listing.platform === bestPlatform.platform;
              return (
                <tr
                  key={index}
                  className={`transition-colors ${
                    isBest ? 'bg-indigo-50/40 font-medium' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Platform Name */}
                  <td className="py-4 px-3 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                        <span>{listing.platform}</span>
                      </div>
                      {isBest && (
                        <div>
                          <PicksyTopPickBadge />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Base Price */}
                  <td className="py-4 px-3 align-top font-semibold text-slate-700">
                    ₹{listing.basePrice?.toLocaleString('en-IN')}
                  </td>

                  {/* Shipping & Handling */}
                  <td className="py-4 px-3 align-top">
                    {listing.deliveryFee === 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        FREE
                      </span>
                    ) : (
                      <span className="text-amber-800 font-medium">
                        +₹{listing.deliveryFee} shipping
                      </span>
                    )}
                    {listing.handlingFee > 0 && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        +₹{listing.handlingFee} fee
                      </div>
                    )}
                  </td>

                  {/* Coupon details */}
                  <td className="py-4 px-3 align-top">
                    {listing.couponDetails?.code ? (
                      <div>
                        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                          <Tag className="w-3 h-3" />
                          -₹{listing.couponDetails.discountAmount}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1 max-w-[140px] truncate" title={listing.couponDetails.terms}>
                          {listing.couponDetails.terms}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>

                  {/* Net Payable Price */}
                  <td className="py-4 px-3 align-top">
                    <div className="text-base font-extrabold text-slate-900">
                      ₹{listing.netPayablePrice?.toLocaleString('en-IN')}
                    </div>
                    {listing.savingsVsMrp > 0 && (
                      <div className="text-[10px] text-emerald-600 font-medium">
                        Save ₹{listing.savingsVsMrp.toLocaleString('en-IN')} vs MRP
                      </div>
                    )}
                  </td>

                  {/* Seller & Return Policy */}
                  <td className="py-4 px-3 align-top">
                    <div className="flex items-center gap-1 text-slate-800 font-semibold">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{listing.sellerRating}★</span>
                      <span className="text-slate-500 font-normal truncate max-w-[110px]" title={listing.sellerName}>
                        {listing.sellerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
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

                  {/* CTA */}
                  <td className="py-4 px-3 align-top text-right">
                    <a
                      href={listing.productUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isBest
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>Buy Now</span>
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
