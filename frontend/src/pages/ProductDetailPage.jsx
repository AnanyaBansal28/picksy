import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Bell,
  Share2,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Tag,
  Star,
  ExternalLink,
  ChevronRight,
  Wallet,
  Zap,
} from 'lucide-react';
import { productService, alertService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { VerdictBadge, DealScoreBadge, PicksyTopPickBadge } from '../components/DecisionBadge';
import { PriceHistoryChart } from '../components/PriceHistoryChart';
import { DealScoreGauge } from '../components/DealScoreGauge';
import { PlatformMatrix } from '../components/PlatformMatrix';
import { CouponInspector } from '../components/CouponInspector';
import { ReviewIntelligence } from '../components/ReviewIntelligence';
import { PriceAlertModal } from '../components/PriceAlertModal';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [lockedSavings, setLockedSavings] = useState(false);
  const [simulatedNotice, setSimulatedNotice] = useState('');

  const { isProductInWishlist, toggleWishlist, isAuthenticated, quickDemoLogin, recordSavings } = useAuth();

  const handleLockSavings = async (amount) => {
    const val = Number(amount) || 0;
    if (val <= 0) return;
    await recordSavings(val, product?.title || 'E-Commerce Deal');
    setLockedSavings(true);
    setSimulatedNotice(`🎉 Success! ₹${val.toLocaleString('en-IN')} added to your Picksy Savings Wallet.`);
    setTimeout(() => {
      setLockedSavings(false);
      setSimulatedNotice('');
    }, 3500);
  };

  const handleSimulateDrop = async () => {
    try {
      if (!isAuthenticated) {
        await quickDemoLogin();
      }
      const res = await alertService.simulateDrop({ productId: product._id || product.id });
      if (res.data?.success) {
        setSimulatedNotice(res.data.message || '⚡ Flash sale drop simulated! Check your notification bell.');
        // Refresh product to show new dropped price
        const refreshed = await productService.getById(id);
        if (refreshed.data?.success) {
          setProduct(refreshed.data.product);
        }
      }
    } catch (err) {
      setSimulatedNotice('⚡ Simulated price drop! Notification dispatched to your bell icon.');
    }
    setTimeout(() => setSimulatedNotice(''), 4000);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await productService.getById(id);
        if (res.data.success) {
          setProduct(res.data.product);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-4"></div>
        <div className="text-sm font-bold text-slate-700">Loading Price Comparison & History...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">The requested item does not exist or has been removed.</p>
        <Link
          to="/explore"
          className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 transition-colors"
        >
          Return to Price Comparison
        </Link>
      </div>
    );
  }

  const decision = product.decision;
  const bestPlatform = decision?.bestPlatform;
  const verdict = decision?.verdict;
  const isSaved = isProductInWishlist(product._id || product.id);

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      await quickDemoLogin();
    }
    await toggleWishlist(product._id || product.id);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/explore" className="hover:text-indigo-600 transition-colors">
            Price Comparison
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span>{product.subCategory}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-bold truncate max-w-xs">{product.title}</span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedShare ? 'Copied!' : 'Share'}</span>
          </button>

          <button
            onClick={() => setIsAlertOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-extrabold hover:bg-amber-100 shadow-2xs transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span>Set Price Drop Alert</span>
          </button>

          <button
            onClick={handleWishlistToggle}
            className={`p-2 rounded-xl border shadow-2xs transition-all ${
              isSaved
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-white text-slate-600 border-slate-200 hover:text-rose-600'
            }`}
            title={isSaved ? 'In Watchlist' : 'Add to Watchlist'}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Picksy Product Header & Signature Verdict Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Product Thumbnail */}
          <div className="lg:col-span-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shadow-xs">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <VerdictBadge verdict={verdict?.action} size="md" />
              </div>
            </div>
            {product.description && (
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Right Column: Comparison Headlines & Verdict Box */}
          <div className="lg:col-span-8 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {product.brand}
                </span>
                <span className="text-xs font-semibold text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-500">
                  {product.subCategory}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-snug">
                {product.title}
              </h1>

              {/* Primary Pricing Banner */}
              <div className="flex flex-wrap items-baseline gap-4 mt-4 pt-4 border-t border-slate-100">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Lowest Net Price (Including Delivery & Coupons)
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-0.5 flex items-center gap-3">
                    <span>₹{bestPlatform?.netPayablePrice?.toLocaleString('en-IN')}</span>
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      via {bestPlatform?.platform}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-600">
                  <div>Catalog MRP: <span className="line-through">₹{product.mrp?.toLocaleString('en-IN')}</span></div>
                  <div className="text-emerald-700 font-extrabold mt-0.5">
                    Real Savings: ₹{(product.mrp - bestPlatform?.netPayablePrice)?.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Savings Lock Button & Simulator Action */}
                <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 mt-2">
                  <button
                    onClick={() => handleLockSavings(product.mrp - (bestPlatform?.netPayablePrice || product.mrp))}
                    disabled={lockedSavings || product.mrp <= bestPlatform?.netPayablePrice}
                    className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>
                      {lockedSavings
                        ? '✓ Saved to Wallet!'
                        : `Lock Deal / Save ₹${(product.mrp - bestPlatform?.netPayablePrice)?.toLocaleString('en-IN')} to Wallet`}
                    </span>
                  </button>

                  <button
                    onClick={handleSimulateDrop}
                    className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-extrabold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    title="Simulate sudden discount drop below target price"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    <span>⚡ Simulate Price Drop</span>
                  </button>
                </div>
              </div>

              {/* Toast banner for simulator / wallet */}
              {simulatedNotice && (
                <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-200 text-xs font-bold text-slate-800 flex items-center gap-2 animate-in fade-in">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{simulatedNotice}</span>
                </div>
              )}

              {/* Clear "Buy Now vs. Wait" Verdict Box */}
              <div
                className={`mt-6 p-5 rounded-2xl border ${
                  verdict?.action === 'BUY NOW'
                    ? 'bg-[#ECFDF5] border-[#A7F3D0]'
                    : verdict?.action === 'WAIT'
                    ? 'bg-[#FFFBEB] border-[#FDE68A]'
                    : 'bg-[#EEF2FF] border-[#C7D2FE]'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <VerdictBadge verdict={verdict?.action} size="lg" />
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wider ${
                        verdict?.action === 'BUY NOW'
                          ? 'text-[#065F46]'
                          : verdict?.action === 'WAIT'
                          ? 'text-[#92400E]'
                          : 'text-[#3730A3]'
                      }`}
                    >
                      {verdict?.summary}
                    </span>
                  </div>

                  <button
                    onClick={() => setIsAlertOpen(true)}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                    <span>Set Target Alert</span>
                  </button>
                </div>

                <p
                  className={`text-xs sm:text-sm font-medium leading-relaxed ${
                    verdict?.action === 'BUY NOW'
                      ? 'text-[#065F46]'
                      : verdict?.action === 'WAIT'
                      ? 'text-[#92400E]'
                      : 'text-[#3730A3]'
                  }`}
                >
                  {verdict?.detail}
                </p>
              </div>

              {/* Price Milestones Strip (Lowest, Highest, Current) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Current Best
                  </div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    ₹{bestPlatform?.netPayablePrice?.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    30-Day Floor (Lowest)
                  </div>
                  <div className="text-sm font-bold text-emerald-600 mt-0.5">
                    ₹{verdict?.lowest30Price?.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    30-Day Peak (Highest)
                  </div>
                  <div className="text-sm font-bold text-slate-600 mt-0.5">
                    ₹{verdict?.highest30Price?.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    vs 30D Average
                  </div>
                  <div
                    className={`text-sm font-bold mt-0.5 ${
                      verdict?.priceVsAvgPct <= 0 ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {verdict?.priceVsAvgPct <= 0
                      ? `${verdict?.priceVsAvgPct}% Cheaper`
                      : `+${verdict?.priceVsAvgPct}% Higher`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Side-by-Side Platform Price Table */}
      <div>
        <PlatformMatrix
          evaluatedPlatforms={decision?.evaluatedPlatforms}
          bestPlatform={bestPlatform}
          recommendationReasons={decision?.recommendationReasons}
        />
      </div>

      {/* Row 3: Interactive Price History Chart & Real Deal Score Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <PriceHistoryChart
            history={product.historicalPrices}
            avg30Price={verdict?.avg30Price}
            lowest30Price={verdict?.lowest30Price}
            currentPrice={bestPlatform?.netPayablePrice}
          />
        </div>

        <div className="lg:col-span-5">
          <DealScoreGauge realDealScore={decision?.realDealScore} />
        </div>
      </div>

      {/* Row 4: Coupon Reality Check */}
      <div>
        <CouponInspector platformListings={product.platformListings} />
      </div>

      {/* Row 5: Review Intelligence */}
      <div>
        <ReviewIntelligence reviewIntelligence={product.reviewIntelligence} />
      </div>

      {/* Target Price Alert Modal */}
      <PriceAlertModal
        product={product}
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
      />
    </div>
  );
};
