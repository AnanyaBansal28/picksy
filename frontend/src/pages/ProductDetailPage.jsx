import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Bell,
  Share2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Tag,
  Star,
  ExternalLink,
} from 'lucide-react';
import { productService } from '../services/api';
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

  const { isProductInWishlist, toggleWishlist, isAuthenticated, quickDemoLogin } = useAuth();

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
        <div className="text-sm font-semibold text-slate-600">Running Decision Engine analysis...</div>
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
          Return to E-Commerce Explorer
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
      {/* Back breadcrumb and Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Explorer</span>
        </Link>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedShare ? 'Link Copied!' : 'Share Decision'}</span>
          </button>

          <button
            onClick={() => setIsAlertOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 shadow-2xs transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span>Set Price Alert</span>
          </button>

          <button
            onClick={handleWishlistToggle}
            className={`p-2 rounded-xl border shadow-2xs transition-all ${
              isSaved
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-white text-slate-600 border-slate-200 hover:text-rose-600'
            }`}
            title={isSaved ? 'Remove from Wishlist' : 'Add to Wishlist'}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero Decision Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-soft">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Product Media Preview */}
          <div className="lg:col-span-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200">
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

          {/* Right: Decision Headline & Signature Verdict */}
          <div className="lg:col-span-8 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
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
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Picksy Best Net Price
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-0.5">
                    ₹{bestPlatform?.netPayablePrice?.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-xs text-slate-600">
                  <div>Catalog MRP: <span className="line-through">₹{product.mrp?.toLocaleString('en-IN')}</span></div>
                  <div className="text-emerald-700 font-bold mt-0.5">
                    Real Savings: ₹{(product.mrp - bestPlatform?.netPayablePrice)?.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Signature Feature: "Buy Now vs. Wait" Verdict Banner */}
              <div
                className={`mt-6 p-5 rounded-2xl border ${
                  verdict?.action === 'BUY NOW'
                    ? 'bg-[#ECFDF5] border-[#A7F3D0]'
                    : verdict?.action === 'WAIT'
                    ? 'bg-[#FFFBEB] border-[#FDE68A]'
                    : 'bg-[#EEF2FF] border-[#C7D2FE]'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <VerdictBadge verdict={verdict?.action} size="lg" />
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
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

              {/* Micro stats banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    30D Average
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    ₹{verdict?.avg30Price?.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    30D Record Low
                  </div>
                  <div className="text-sm font-bold text-emerald-600 mt-0.5">
                    ₹{verdict?.lowest30Price?.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Diff vs 30D Avg
                  </div>
                  <div
                    className={`text-sm font-bold mt-0.5 ${
                      verdict?.priceVsAvgPct <= 0 ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {verdict?.priceVsAvgPct <= 0
                      ? `${verdict?.priceVsAvgPct}% Cheaper`
                      : `+${verdict?.priceVsAvgPct}% Above Avg`}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Top Platform
                  </div>
                  <div className="text-sm font-bold text-indigo-700 mt-0.5">
                    {bestPlatform?.platform}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Price History Chart & Real Deal Score Gauge */}
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

      {/* Row 3: Platform Comparison Matrix */}
      <div>
        <PlatformMatrix
          evaluatedPlatforms={decision?.evaluatedPlatforms}
          bestPlatform={bestPlatform}
          recommendationReasons={decision?.recommendationReasons}
        />
      </div>

      {/* Row 4: Coupon Reality Check */}
      <div>
        <CouponInspector platformListings={product.platformListings} />
      </div>

      {/* Row 5: Review Intelligence */}
      <div>
        <ReviewIntelligence reviewIntelligence={product.reviewIntelligence} />
      </div>

      {/* Price Alert Modal */}
      <PriceAlertModal
        product={product}
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
      />
    </div>
  );
};
