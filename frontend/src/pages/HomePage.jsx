import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Zap,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Store,
  ChevronRight,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { productService } from '../services/api';
import { VerdictBadge, DealScoreBadge } from '../components/DecisionBadge';

export const HomePage = () => {
  const [activeMode, setActiveMode] = useState('ecommerce'); // 'ecommerce' | 'grocery'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTab, setSearchTab] = useState('keyword'); // 'keyword' | 'link'
  const [linkInput, setLinkInput] = useState('');
  const [linkPrice, setLinkPrice] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [urlError, setUrlError] = useState('');

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [featuredDeals, setFeaturedDeals] = useState([]);
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
      }
    };
    fetchDeals();
  }, []);

  // Live Instant Search Autocomplete
  useEffect(() => {
    if (searchTab === 'link' || !searchQuery.trim() || searchQuery.trim().length < 2) {
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
  }, [searchQuery, searchTab]);

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

  const handleLinkAnalyze = async (e) => {
    e.preventDefault();
    setUrlError('');
    if (!linkInput.trim()) {
      setUrlError('Please paste an Amazon, Flipkart, or Myntra product link.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const payload = { url: linkInput.trim() };
      if (linkPrice && !isNaN(Number(linkPrice)) && Number(linkPrice) > 0) {
        payload.currentPrice = Number(linkPrice);
      }
      const res = await productService.analyzeUrl(payload);
      if (res.data?.success && res.data.product) {
        navigate(`/product/${res.data.product._id || res.data.product.id}`);
      } else {
        setUrlError('Could not parse this product link. Please check the URL.');
      }
    } catch (err) {
      setUrlError(err.response?.data?.message || 'Failed to analyze link. Please try again.');
    } finally {
      setIsAnalyzing(false);
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
                className={`px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeMode === 'ecommerce'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>🛒 1. Price Compare & Buy/Wait</span>
              </button>
              <button
                onClick={() => setActiveMode('grocery')}
                className={`px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
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

            {/* Search or Paste Link Container */}
            <div ref={searchRef} className="mt-8 max-w-xl mx-auto relative text-left">
              {/* Tab Selector: Search vs Paste Link */}
              {activeMode === 'ecommerce' && (
                <div className="flex items-center justify-center gap-2 mb-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTab('keyword');
                      setUrlError('');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      searchTab === 'keyword'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search by Product Name</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTab('link');
                      setShowSuggestions(false);
                      setUrlError('');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      searchTab === 'link'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Paste Amazon / Flipkart Link</span>
                  </button>
                </div>
              )}

              {/* Mode A: Keyword Search Form */}
              {searchTab === 'keyword' ? (
                <form
                  onSubmit={handleSearchSubmit}
                  className="relative flex items-center shadow-elevated rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 focus-within:border-indigo-600 transition-all p-1.5"
                >
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
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                  >
                    <span>Compare</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                /* Mode B: Buyhatke-style Link Analyzer Form */
                <form
                  onSubmit={handleLinkAnalyze}
                  className="relative flex flex-col sm:flex-row items-stretch sm:items-center shadow-elevated rounded-2xl bg-white border-2 border-indigo-500 transition-all p-1.5 gap-2 sm:gap-1.5"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <LinkIcon className="w-5 h-5 text-indigo-600 ml-3.5 shrink-0" />
                    <input
                      type="url"
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      placeholder="Paste link: https://www.amazon.in/dp/... or Flipkart URL"
                      required
                      autoFocus
                      className="w-full px-3 py-2 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center sm:border-l border-slate-200 pl-3 pr-2 py-1 shrink-0 bg-slate-50 sm:bg-transparent rounded-xl sm:rounded-none">
                    <span className="text-xs font-black text-indigo-700 mr-1.5">₹</span>
                    <input
                      type="number"
                      min="1"
                      max="1000000"
                      value={linkPrice}
                      onChange={(e) => setLinkPrice(e.target.value)}
                      placeholder="Current Store Price (₹)"
                      className="w-full sm:w-44 py-1 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                      title="Optional: Enter current product price seen on the store for instant 100% exact comparison"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAnalyzing}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <span>Picksy Analyze</span>
                        <Sparkles className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* URL Error Message */}
              {urlError && (
                <div className="mt-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{urlError}</span>
                </div>
              )}

              {/* Instant Dropdown Match */}
              {searchTab === 'keyword' && showSuggestions && suggestions.length > 0 && (
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
                          className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3 group cursor-pointer"
                        >
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-12 h-12 object-contain rounded-lg border border-slate-200 flex-shrink-0 bg-slate-50 p-1"
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
                                {p.category === 'quick-commerce'
                                  ? '10-Min Delivery'
                                  : `Best on ${best?.platform || 'Amazon'}`}
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
                    className="w-full mt-1 pt-2 border-t border-slate-100 text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 py-1 cursor-pointer"
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
                      setSearchTab('keyword');
                      setSearchQuery(tag);
                      if (activeMode === 'ecommerce') {
                        navigate(`/explore?search=${encodeURIComponent(tag)}`);
                      } else {
                        navigate(`/quick-commerce`);
                      }
                    }}
                    className="hover:text-indigo-600 hover:bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-slate-200/60 bg-white transition-colors text-[11px] font-semibold cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dual Tool Showcase Cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Tool 1 Card */}
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

            {/* Tool 2 Card */}
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

                <div className="mt-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Optimal Split (Face Wash + Apples)</span>
                    <span className="text-emerald-700">₹408 Total</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-200/70">
                    <div>Zepto: Face Wash (₹249)</div>
                    <div>Blinkit: Apples (₹139)</div>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg">
                    ✓ Saves ₹65 vs ordering all items from a single app!
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Blinkit • Zepto • Instamart</span>
                <Link
                  to="/quick-commerce"
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 shadow-2xs"
                >
                  <span>Open Grocery Optimizer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured / Spotlight Deals Section with Clean Modern Cards */}
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

        {/* Clean, Decluttered Deals Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredDeals.map((product) => {
            const bestPlatform = product.decision?.bestPlatform;
            const verdict = product.decision?.verdict?.action;
            const dealScore = product.decision?.realDealScore?.score;
            const pId = product._id || product.id;
            const savings = product.mrp - (bestPlatform?.netPayablePrice || product.mrp);

            return (
              <Link
                key={pId}
                to={`/product/${pId}`}
                className="group bg-white rounded-2xl border border-slate-200 p-4 shadow-soft hover:shadow-elevated hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Strict Fixed-Height Image Container */}
                  <div className="relative w-full h-48 rounded-xl overflow-hidden bg-[#F8FAFC] border border-slate-100 flex items-center justify-center p-4 mb-3">
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
                  <div className="flex items-center justify-between text-xs mb-2 pt-3 border-t border-slate-100">
                    <DealScoreBadge score={dealScore} />
                    {savings > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Save ₹{savings.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <div className="text-lg font-black text-slate-900">
                        ₹{bestPlatform?.netPayablePrice?.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-400 line-through">
                        MRP ₹{product.mrp?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500">
                      on {bestPlatform?.platform}
                    </span>
                  </div>

                  {/* Single Crisp CTA Button */}
                  <div className="w-full py-2 bg-slate-900 group-hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1">
                    <span>Picksy View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
