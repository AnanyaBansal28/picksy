import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Star,
  ExternalLink,
  ShoppingBag,
  Layers,
  ChevronRight,
  Check,
} from 'lucide-react';
import { productService } from '../services/api';
import { VerdictBadge, DealScoreBadge, PicksyTopPickBadge } from '../components/DecisionBadge';

export const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [featuredDeals, setFeaturedDeals] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [activeMode, setActiveMode] = useState('ecommerce'); // 'ecommerce' | 'grocery'
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const res = await productService.getSpotlightDeals();
        if (res.data.success) {
          setFeaturedDeals(res.data.deals);
        }
      } catch (err) {
        console.error('Failed to load spotlight deals:', err);
      } finally {
        setLoadingDeals(false);
      }
    };
    fetchDeals();
  }, []);

  // Live Instant Search Autocomplete
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await productService.getAll({ search: searchQuery.trim() });
        if (res.data.success) {
          setSuggestions(res.data.products.slice(0, 6));
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Live search error:', err);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSelectProduct = (p) => {
    setSearchQuery('');
    setShowSuggestions(false);
    if (p.category === 'quick-commerce') {
      navigate('/quick-commerce');
    } else {
      navigate(`/product/${p._id || p.id}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-[#FAFAFC] to-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#F1F5F9_1px,transparent_1px),linear-gradient(to_bottom,#F1F5F9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Top 2-Mode Selector Pill */}
            <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200/80 shadow-2xs mb-6 text-xs font-bold">
              <button
                onClick={() => setActiveMode('ecommerce')}
                className={`px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeMode === 'ecommerce'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🛒 1. Price Compare & Buy/Wait</span>
              </button>
              <button
                onClick={() => setActiveMode('grocery')}
                className={`px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeMode === 'grocery'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>2. 10-Min Grocery Optimizer</span>
              </button>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
              {activeMode === 'ecommerce' ? (
                <>
                  Compare Prices Across Platforms. <br />
                  <span className="bg-gradient-to-r from-indigo-600 to-indigo-900 bg-clip-text text-transparent">
                    Know Exactly When to Buy or Wait.
                  </span>
                </>
              ) : (
                <>
                  Split Your Grocery Cart. <br />
                  <span className="bg-gradient-to-r from-indigo-600 to-indigo-900 bg-clip-text text-transparent">
                    Save Big on Blinkit, Zepto & Instamart.
                  </span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              {activeMode === 'ecommerce'
                ? 'Picksy compares base price, delivery fees, seller ratings, and 30-day price history across Amazon, Flipkart & Myntra to give you a clear "Buy Now vs. Wait" verdict.'
                : 'Different 10-minute grocery apps have completely different item prices. Picksy checks item-by-item prices across Blinkit, Zepto, and Instamart to automatically split your order for maximum savings.'}
            </p>

            {/* Live Search Bar with Instant Autocomplete */}
            <div ref={searchRef} className="mt-8 max-w-xl mx-auto relative text-left">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center shadow-elevated rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 focus-within:border-indigo-600 transition-all p-1.5">
                <Search className="w-5 h-5 text-slate-400 ml-3.5 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  placeholder={
                    activeMode === 'ecommerce'
                      ? 'Search iPhone 15, Sony headphones, MacBook, sneakers...'
                      : 'Search face wash, apples, bananas, milk, eggs, coffee...'
                  }
                  className="w-full px-3 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0"
                >
                  <span>Compare</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Instant Dropdown Match */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-elevated border border-slate-200 p-2 z-50 animate-in fade-in duration-150">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                    Matching Products ({suggestions.length})
                  </div>
                  <div className="divide-y divide-slate-100">
                    {suggestions.map((p) => {
                      const best = p.decision?.bestPlatform || p.platformListings?.[0];
                      return (
                        <button
                          key={p._id || p.id}
                          onClick={() => handleSelectProduct(p)}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3 group"
                        >
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                              {p.title}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="font-extrabold text-slate-900">
                                ₹{best?.basePrice?.toLocaleString('en-IN') || p.mrp}
                              </span>
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.2 rounded font-semibold">
                                {p.category === 'quick-commerce' ? '10-Min Delivery' : `Best on ${best?.platform || 'Amazon'}`}
                              </span>
                            </div>
                          </div>
                          {p.decision?.verdict && (
                            <VerdictBadge verdict={p.decision.verdict.action} size="sm" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleSearchSubmit}
                    className="w-full mt-1 pt-2 border-t border-slate-100 text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 py-1"
                  >
                    View all matching results for "{searchQuery}" →
                  </button>
                </div>
              )}

              {/* Quick Suggestion Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-slate-500 font-medium">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Try Searching:
                </span>
                {(activeMode === 'ecommerce'
                  ? ['iPhone 15', 'Sony XM5', 'MacBook Air M2', 'Jordan 1 Low', 'Samsung 4K TV']
                  : ['Face Wash', 'Apples', 'Bananas', 'Milk', 'Eggs', 'Nescafe Coffee']
                ).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSearchQuery(tag);
                      if (activeMode === 'ecommerce') {
                        navigate(`/explore?search=${encodeURIComponent(tag)}`);
                      } else {
                        navigate(`/quick-commerce`);
                      }
                    }}
                    className="hover:text-indigo-600 hover:bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-slate-200/60 bg-white transition-colors text-[11px] font-semibold"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dual Tool Showcase Cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Tool 1 Card: Picksy E-Commerce Price Compare */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-elevated flex flex-col justify-between hover:border-indigo-300 transition-all">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider border border-indigo-200/60">
                    <span>Tool 1: E-Commerce</span>
                  </div>
                  <VerdictBadge verdict="BUY NOW" size="sm" />
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Price Compare & Buy/Wait
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Track 30-day historical prices, unmask fake discount markups, and compare final checkout prices across Amazon, Flipkart & Myntra.
                </p>

                {/* Micro Demo Snapshot */}
                <div className="mt-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Apple iPhone 15 (128 GB)</span>
                    <span className="text-emerald-700">₹64,499</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-200/70">
                    <div>Amazon: <strong>₹64,499</strong> (Best)</div>
                    <div>Flipkart: <strong>₹66,147</strong></div>
                    <div>Tata CliQ: <strong>₹67,900</strong></div>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg">
                    ✓ 11% below 30-day average. Buy now before weekend price hike.
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Supports Amazon, Flipkart, Myntra</span>
                <Link
                  to="/explore"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 shadow-2xs"
                >
                  <span>Compare E-Commerce</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Tool 2 Card: True 10-Minute Split-Cart Optimizer */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-elevated flex flex-col justify-between hover:border-amber-300 transition-all">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider border border-amber-200/60">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Tool 2: 10-Min Groceries</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Save ₹50 to ₹150 / Order
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  10-Min Split-Cart Optimizer
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Face Wash is ₹249 on Zepto vs ₹389 on Blinkit. Fresh Apples are ₹139 on Blinkit vs ₹199 on Zepto. We split your cart automatically!
                </p>

                {/* Micro Demo Snapshot */}
                <div className="mt-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Sample Cart: Face Wash + Apples + Bananas</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-600 pt-2 border-t border-slate-200/70">
                    <div className="flex items-center justify-between">
                      <span>• Order from Zepto: Face Wash</span>
                      <strong>₹254 (Free delivery)</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Order from Blinkit: Apples + Bananas</span>
                      <strong>₹193</strong>
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg flex items-center justify-between">
                    <span>🏆 Total Split Cost: ₹447</span>
                    <span>Save ₹58 vs Zepto & ₹120 vs Blinkit!</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Blinkit • Zepto • Instamart</span>
                <Link
                  to="/quick-commerce"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 shadow-2xs"
                >
                  <span>Open Grocery Optimizer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured / Spotlight Deals Section */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Verified Deals
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              Today's Best E-Commerce Deals
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified against 30-day historical floors so you never buy during artificial pre-sale price spikes.
            </p>
          </div>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs transition-all self-start sm:self-auto"
          >
            <span>View All E-Commerce Items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Deals Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredDeals.map((product) => {
            const bestPlatform = product.decision?.bestPlatform;
            const verdict = product.decision?.verdict?.action;
            const dealScore = product.decision?.realDealScore?.score;

            return (
              <Link
                key={product._id || product.id}
                to={`/product/${product._id || product.id}`}
                className="group bg-white rounded-2xl border border-slate-200 p-4 shadow-soft hover:shadow-elevated hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-full h-48 rounded-xl overflow-hidden bg-[#F8FAFC] border border-slate-100 flex items-center justify-center p-3 mb-3">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <VerdictBadge verdict={verdict} size="sm" />
                    </div>
                  </div>

                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {product.brand} • {product.subCategory}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 h-10 line-clamp-2 leading-snug mb-3 group-hover:text-indigo-600 transition-colors">
                    {product.title}
                  </h3>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-3 pt-3 border-t border-slate-100">
                    <DealScoreBadge score={dealScore} />
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      Best on {bestPlatform?.platform}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-lg font-extrabold text-slate-900">
                        ₹{bestPlatform?.netPayablePrice?.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-400 line-through">
                        MRP ₹{product.mrp?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center">
                      Compare Prices →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};
