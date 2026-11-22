import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Heart,
  Bell,
  ArrowRight,
  Sparkles,
  X,
  ExternalLink,
  Link as LinkIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { productService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { VerdictBadge, DealScoreBadge } from '../components/DecisionBadge';
import { PriceAlertModal } from '../components/PriceAlertModal';

const CATEGORIES = [
  'All',
  'Smartphones',
  'Audio & Wearables',
  'Laptops',
  'Footwear & Fashion',
  'Home Entertainment',
  'Home & Kitchen',
];

export const ExplorerPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialDealFilter = searchParams.get('dealFilter') || 'ALL';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [dealFilter, setDealFilter] = useState(initialDealFilter);
  const [sortBy, setSortBy] = useState('deal_score_desc');

  // URL Analyzer state
  const [isAnalyzingUrl, setIsAnalyzingUrl] = useState(false);
  const [urlError, setUrlError] = useState('');

  // Price Alert Modal State
  const [alertProduct, setAlertProduct] = useState(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const { isProductInWishlist, toggleWishlist, isAuthenticated, quickDemoLogin } = useAuth();
  const navigate = useNavigate();

  const isLinkInput =
    search.trim().startsWith('http://') ||
    search.trim().startsWith('https://') ||
    search.trim().includes('amazon.') ||
    search.trim().includes('flipkart.') ||
    search.trim().includes('myntra.');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        category: 'ecommerce',
        subCategory: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: search.trim() || undefined,
        dealFilter: dealFilter !== 'ALL' ? dealFilter : undefined,
        sort: sortBy,
      };
      const res = await productService.getAll(params);
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, dealFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (isLinkInput) {
      handleAnalyzeUrl();
    } else {
      fetchProducts();
    }
  };

  const handleAnalyzeUrl = async () => {
    setUrlError('');
    if (!search.trim()) return;

    setIsAnalyzingUrl(true);
    try {
      const res = await productService.analyzeUrl({ url: search.trim() });
      if (res.data?.success && res.data.product) {
        navigate(`/product/${res.data.product._id || res.data.product.id}`);
      } else {
        setUrlError('Could not parse this product link.');
      }
    } catch (err) {
      setUrlError(err.response?.data?.message || 'Failed to analyze product URL.');
    } finally {
      setIsAnalyzingUrl(false);
    }
  };

  const handleWishlistClick = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      await quickDemoLogin();
    }
    await toggleWishlist(productId);
  };

  const handleAlertClick = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    setAlertProduct(product);
    setIsAlertOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                E-Commerce Price Tracker
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Amazon • Flipkart • Myntra
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              Compare Prices & Check Buy/Wait Verdicts
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Strictly verified prices across Indian stores. Search by brand or model, or paste any Amazon/Flipkart URL to analyze historical prices and deal scores.
            </p>
          </div>

          {/* Unified Search & URL Analyzer Bar */}
          <div className="w-full md:w-96">
            <form onSubmit={handleSearchSubmit} className="relative">
              {isLinkInput ? (
                <LinkIcon className="w-4 h-4 text-indigo-600 absolute left-3 top-1/2 -translate-y-1/2" />
              ) : (
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              )}
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product or paste Amazon/Flipkart link..."
                className={`w-full pl-9 pr-24 py-2 bg-white border rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 shadow-2xs transition-all ${
                  isLinkInput
                    ? 'border-indigo-400 focus:ring-indigo-500/20 focus:border-indigo-600'
                    : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      fetchProducts();
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {isLinkInput ? (
                  <button
                    type="button"
                    onClick={handleAnalyzeUrl}
                    disabled={isAnalyzingUrl}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-[11px] font-black tracking-wide flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                  >
                    {isAnalyzingUrl ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>Analyze</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    Search
                  </button>
                )}
              </div>
            </form>

            {/* URL Error Message */}
            {urlError && (
              <div className="mt-1 text-[11px] text-rose-600 bg-rose-50 p-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{urlError}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Sorting Control Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft mb-8 space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex-shrink-0">
            Categories:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Verdict & Sort Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] mr-1">
              Verdict Filter:
            </span>
            <button
              onClick={() => setDealFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                dealFilter === 'ALL'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setDealFilter('BUY_NOW')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                dealFilter === 'BUY_NOW'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              BUY NOW Only
            </button>
            <button
              onClick={() => setDealFilter('EXCEPTIONAL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                dealFilter === 'EXCEPTIONAL'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
              }`}
            >
              Deal Score ≥ 80
            </button>
            <button
              onClick={() => setDealFilter('WAIT')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                dealFilter === 'WAIT'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              WAIT Only
            </button>
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="deal_score_desc">Best Real Deal Score</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clean, Decluttered Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-3">
              <div className="aspect-4/3 bg-slate-100 rounded-xl"></div>
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
              <div className="h-5 bg-slate-100 rounded w-3/4"></div>
              <div className="h-8 bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No matching products found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or clearing the verdict filter.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
              setDealFilter('ALL');
              fetchProducts();
            }}
            className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const decision = product.decision;
            const bestPlatform = decision?.bestPlatform;
            const verdict = decision?.verdict?.action;
            const dealScore = decision?.realDealScore?.score;
            const pId = product._id || product.id;
            const saved = isProductInWishlist(pId);
            const savings = product.mrp - (bestPlatform?.netPayablePrice || product.mrp);

            return (
              <div
                key={pId}
                className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-soft hover:shadow-elevated hover:border-indigo-300 transition-all flex flex-col justify-between relative"
              >
                {/* Wishlist & Alert buttons */}
                <div className="absolute top-7 right-7 z-10 flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleAlertClick(e, product)}
                    className="p-2 rounded-xl bg-white/90 backdrop-blur-xs text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-slate-200/80 shadow-2xs transition-all cursor-pointer"
                    title="Set Target Price Drop Alert"
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleWishlistClick(e, pId)}
                    className={`p-2 rounded-xl bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-2xs transition-all cursor-pointer ${
                      saved ? 'text-rose-500 bg-rose-50' : 'text-slate-500 hover:text-rose-500'
                    }`}
                    title={saved ? 'Saved' : 'Save to Watchlist'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-rose-500' : ''}`} />
                  </button>
                </div>

                <div>
                  {/* Strict Fixed-Height Image Container */}
                  <Link
                    to={`/product/${pId}`}
                    className="block relative w-full h-48 rounded-xl overflow-hidden bg-[#F8FAFC] border border-slate-100 flex items-center justify-center p-4 mb-4"
                  >
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <VerdictBadge verdict={verdict} size="sm" />
                    </div>
                  </Link>

                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {product.brand} • {product.subCategory}
                  </div>

                  <Link to={`/product/${pId}`}>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors h-11 line-clamp-2 leading-snug mb-3">
                      {product.title}
                    </h3>
                  </Link>
                </div>

                {/* Simplified Crisp Footer */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <DealScoreBadge score={dealScore} />
                    {savings > 0 && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Save ₹{savings.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <div className="text-xl font-black text-slate-900">
                        ₹{bestPlatform?.netPayablePrice?.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-400 line-through">
                        MRP ₹{product.mrp?.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      on {bestPlatform?.platform}
                    </span>
                  </div>

                  {/* Single Crisp CTA Button */}
                  <Link
                    to={`/product/${pId}`}
                    className="w-full py-2.5 bg-slate-900 group-hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Picksy View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Price Alert Modal */}
      {alertProduct && (
        <PriceAlertModal
          product={alertProduct}
          isOpen={isAlertOpen}
          onClose={() => setIsAlertOpen(false)}
        />
      )}
    </div>
  );
};
