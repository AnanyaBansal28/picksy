import React, { useState } from 'react';
import { Tag, AlertTriangle, CheckCircle, Copy, Check } from 'lucide-react';

export const CouponInspector = ({ platformListings = [] }) => {
  const [copiedCode, setCopiedCode] = useState(null);

  const listingsWithCoupons = platformListings.filter(
    (l) => l.couponDetails && l.couponDetails.code
  );

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (listingsWithCoupons.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
      <div className="flex items-center gap-2 mb-2">
        <Tag className="w-4 h-4 text-indigo-600" />
        <h3 className="text-base font-bold text-slate-900">Coupon Reality Check™</h3>
        <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
          Anti-Trap Engine
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-5">
        We test coupon validity against real checkout criteria to alert you of restrictive terms or fake savings.
      </p>

      <div className="space-y-3">
        {listingsWithCoupons.map((l, idx) => {
          const coupon = l.couponDetails;
          const isFake = coupon.isFakeDiscount;
          const isCopied = copiedCode === coupon.code;

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all ${
                isFake
                  ? 'bg-rose-50/50 border-rose-200'
                  : 'bg-emerald-50/40 border-emerald-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg flex-shrink-0 ${
                      isFake ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {isFake ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-slate-700">
                        {l.platform}
                      </span>
                      <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-900 shadow-2xs">
                        {coupon.code}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          isFake ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        -₹{coupon.discountAmount?.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 mt-1 font-medium">
                      {coupon.terms}
                    </div>

                    {isFake && coupon.fakeDiscountReason && (
                      <div className="text-[11px] text-rose-700 font-semibold mt-1">
                        ⚠️ {coupon.fakeDiscountReason}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleCopy(coupon.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all shadow-2xs cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-extrabold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
