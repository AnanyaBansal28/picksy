import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { productService } from '../services/api';
import { VerdictBadge, DealScoreBadge, PicksyTopPickBadge } from '../components/DecisionBadge';

export const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredDeals, setFeaturedDeals] = useState([]);
  const [loadingDeals, setLoadingDeals] = useState(true);
  const [activeDemoTab, setActiveDemoTab] = useState('buy'); // 'buy' or 'wait'
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-[#FAFAFC] to-white">
        {/* Subtle grid background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#F1F5F9_1px,transparent_1px),linear-gradient(to_bottom,#F1F5F9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-70 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            {/* Top Eyebrow Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold tracking-wide uppercase mb-6 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Next-Gen Shopping Decision Engine</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.12]">
              Pick Smartly, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900 bg-clip-text text-transparent">
                Shop Wisely.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl mx-auto">
              Stop falling for fake discount banners, hidden shipping charges, and inflated MRPs. Picksy evaluates 30-day historical prices, seller reliability, and coupon terms to tell you whether to <strong>Buy Now</strong> or <strong>Wait</strong>.
            </p>

            {/* Live Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="mt-8 max-w-xl mx-auto relative group"
            >
              <div className="relative flex items-center shadow-elevated rounded-2xl bg-white border border-slate-200 group-hover:border-indigo-400 transition-all p-1.5">
                <Search className="w-5 h-5 text-slate-400 ml-3.5 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search iPhone 15, Sony XM5, milk, bread, sneakers..."
                  className="w-full px-3 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0"
                >
                  <span>Decide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Popular quick tags */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-slate-500 font-medium">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Popular:</span>
                {['iPhone 15', 'Sony XM5', 'MacBook Air M2', 'Amul Milk', 'Samsung 4K TV'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setSearchQuery(tag);
                      navigate(`/explore?search=${encodeURIComponent(tag)}`);
                    }}
                    className="hover:text-indigo-600 hover:bg-indigo-50 px-2 py-0.5 rounded-md transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Interactive Demo Preview Card */}
          <div className="mt-14 max-w-3xl mx-auto">
            <div className="text-center mb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Interactive Decision Engine Preview
              </span>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-elevated transition-all">
              {/* Tab Selector */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <button
                  onClick={() => setActiveDemoTab('buy')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeDemoTab === 'buy'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Scenario A: Verified "BUY NOW" Deal</span>
                </button>
                <button
                  onClick={() => setActiveDemoTab('wait')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeDemoTab === 'wait'
                      ? 'bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Scenario B: Pre-Sale "WAIT" Spike</span>
                </button>
              </div>

              {/* Demo Content */}
              {activeDemoTab === 'buy' ? (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-500 uppercase">Apple Flagship</span>
                        <VerdictBadge verdict="BUY NOW" size="md" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Apple iPhone 15 (128 GB) - Black
                      </h3>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-2xl font-black text-slate-900">₹64,499</div>
                      <div className="text-xs text-emerald-700 font-semibold">
                        11% Below 30-Day Average (₹72,400)
                      </div>
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-[#ECFDF5] border border-[#A7F3D0] p-3.5 rounded-2xl">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#065F46]">
                        Real Deal Score
                      </div>
                      <div className="text-2xl font-black text-[#065F46] mt-1">92/100</div>
                      <p className="text-xs text-[#065F46] mt-0.5">
                        Historical low with authentic bank discount.
                      </p>
                    </div>

                    <div className="bg-indigo-50/70 border border-indigo-200/70 p-3.5 rounded-2xl">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                        Picksy Top Choice
                      </div>
                      <div className="text-sm font-bold text-indigo-950 mt-1 flex items-center gap-1">
                        <span>Amazon (Appario)</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Free delivery + 7-Day brand replacement.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Buyer Consensus
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-1">94% Organic</div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Consensus praises battery and USB-C ergonomics.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2">
                    <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Zero hidden checkout surcharges. Clean deal.
                    </span>
                    <Link
                      to="/explore"
                      className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1"
                    >
                      <span>Explore Engine</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-500 uppercase">Sony Premium Audio</span>
                        <VerdictBadge verdict="WAIT" size="md" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Sony WH-1000XM5 Wireless Headphones
                      </h3>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-2xl font-black text-slate-900">₹29,990</div>
                      <div className="text-xs text-amber-800 font-semibold">
                        Price spiked +18% above 30-Day floor (₹24,990)
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-[#FFFBEB] border border-[#FDE68A] p-3.5 rounded-2xl">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#92400E]">
                        Real Deal Score
                      </div>
                      <div className="text-2xl font-black text-[#92400E] mt-1">42/100</div>
                      <p className="text-xs text-[#92400E] mt-0.5">
                        Artificial price spike ahead of weekend sale.
                      </p>
                    </div>

                    <div className="bg-rose-50/70 border border-rose-200/70 p-3.5 rounded-2xl">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
                        Coupon Alert
                      </div>
                      <div className="text-sm font-bold text-rose-950 mt-1">Restricted Terms</div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Advertised ₹2,000 off requires specific high-tier credit card.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Picksy Advice
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-1">Wait 7–10 Days</div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Set a Target Alert at ₹25,000 for automatic notification.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 pt-2">
                    <span className="flex items-center gap-1.5 text-amber-800 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Avoid buying today; expected price drop within 10 days.
                    </span>
                    <Link
                      to="/explore"
                      className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1"
                    >
                      <span>Explore Engine</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Supported Platforms Strip */}
          <div className="mt-14 pt-8 border-t border-slate-200/70">
            <p className="text-xs text-center font-bold uppercase tracking-wider text-slate-600 mb-6">
              Live Intelligence Synced Across Major Platforms
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-80">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Amazon India
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Flipkart
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span> Myntra
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span> Blinkit
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Zepto
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Swiggy Instamart
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Value Pillars Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            Why Picksy Exists
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
            Engineered to Solve Modern Shopping Traps
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Online retail is engineered to make you spend. Picksy gives you the data superpower to buy at the perfect moment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft hover:shadow-elevated transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <TrendingDown className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Buy Now vs. Wait Verdict
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We track daily pricing over 30 and 90 days. If a product just had a temporary markup, our engine tells you to wait.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft hover:shadow-elevated transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Real Deal Score™ (0–100)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We unmask fake MRPs where sellers claim 60% off a price that was never actually charged, exposing actual out-of-pocket savings.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft hover:shadow-elevated transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Smart Cart Optimizer
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Add your weekly groceries. Picksy compares single-app orders against split carts on Blinkit, Zepto, and Instamart.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-soft hover:shadow-elevated transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Tag className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Coupon Reality Check
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              No more discovering a coupon requires a ₹50,000 cart or an obscure bank credit card. We check coupon rules before you click.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Spotlight Deals Section */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
                Live Recommendations
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                Spotlight Shopping Decisions
              </h2>
            </div>
            <Link
              to="/explore"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs transition-all"
            >
              <span>View All Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Deals Grid */}
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
                    {/* Image & Verdict Badge */}
                    <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 mb-4 border border-slate-100">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5">
                        <VerdictBadge verdict={verdict} size="sm" />
                      </div>
                    </div>

                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {product.brand} • {product.subCategory}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug mb-3 group-hover:text-indigo-600 transition-colors">
                      {product.title}
                    </h3>
                  </div>

                  <div>
                    {/* Deal Score & Top Platform */}
                    <div className="flex items-center justify-between text-xs mb-3 pt-3 border-t border-slate-100">
                      <DealScoreBadge score={dealScore} />
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        via {bestPlatform?.platform || 'Amazon'}
                      </span>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-lg font-extrabold text-slate-900">
                          ₹{bestPlatform?.netPayablePrice?.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-slate-600 line-through">
                          MRP ₹{product.mrp?.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center">
                        Inspect →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick-Commerce Split-Cart Promo Banner */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-8 sm:p-12 shadow-elevated relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-400/20">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Smart Cart Engine</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Buying groceries on Blinkit, Zepto, or Instamart?
            </h2>
            <p className="text-indigo-200 text-sm sm:text-base leading-relaxed mb-8">
              Picksy compares single-app checkouts against optimal split-carts. See exactly how much you save when factoring in minimum delivery thresholds and platform handling charges.
            </p>
            <Link
              to="/quick-commerce"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-950 font-bold text-sm hover:bg-indigo-50 transition-all shadow-md"
            >
              <span>Launch Smart Cart Optimizer</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
