import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Heart,
  Bell,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
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

  // Price Alert Modal State
  const [alertProduct, setAlertProduct] = useState(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const { isProductInWishlist, toggleWishlist, isAuthenticated, quickDemoLogin } = useAuth();

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
    fetchProducts();
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Decision Intelligence
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
              E-Commerce Price Tracker & Decision Suite
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Cross-platform pricing analysis across Amazon, Flipkart, Myntra, and Tata CliQ.
            </p>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search brand, model, tag..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  fetchProducts();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Filter and Sorting Control Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft mb-8 space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex-shrink-0">
            Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Verdict & Sort Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Verdict Filter Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] mr-1">
              Verdict Filter:
            </span>
            <button
              onClick={() => setDealFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                dealFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setDealFilter('BUY_NOW')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                dealFilter === 'BUY_NOW'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              BUY NOW Only
            </button>
            <button
              onClick={() => setDealFilter('EXCEPTIONAL')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                dealFilter === 'EXCEPTIONAL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
              }`}
            >
              Score ≥ 80
            </button>
            <button
              onClick={() => setDealFilter('WAIT')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                dealFilter === 'WAIT'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              WAIT Only
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="deal_score_desc">Real Deal Score (High to Low)</option>
              <option value="verdict">Verdict Priority (Buy First)</option>
              <option value="price_asc">Net Price (Low to High)</option>
              <option value="price_desc">Net Price (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
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
            }}
            className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100"
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

            return (
              <div
                key={pId}
                className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-soft hover:shadow-elevated hover:border-indigo-300 transition-all flex flex-col justify-between relative"
              >
                {/* Wishlist & Alert buttons at top right */}
                <div className="absolute top-7 right-7 z-10 flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleAlertClick(e, product)}
                    className="p-2 rounded-xl bg-white/90 backdrop-blur-xs text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-slate-200/80 shadow-2xs transition-all"
                    title="Set Price Alert"
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleWishlistClick(e, pId)}
                    className={`p-2 rounded-xl bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-2xs transition-all ${
                      saved ? 'text-rose-500 bg-rose-50' : 'text-slate-500 hover:text-rose-500'
                    }`}
                    title={saved ? 'In Wishlist' : 'Save to Wishlist'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-rose-500' : ''}`} />
                  </button>
                </div>

                <div>
                  {/* Image container */}
                  <Link to={`/product/${pId}`} className="block relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 mb-4 border border-slate-100">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <VerdictBadge verdict={verdict} size="sm" />
                    </div>
                  </Link>

                  {/* Category and brand */}
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {product.brand} • {product.subCategory}
                  </div>

                  {/* Title */}
                  <Link to={`/product/${pId}`}>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug mb-3">
                      {product.title}
                    </h3>
                  </Link>

                  {/* Verdict Reasoning Snippet */}
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4 leading-relaxed font-medium">
                    {decision?.verdict?.summary || 'Historical pricing tracked.'}
                  </div>
                </div>

                {/* Footer Section */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <DealScoreBadge score={dealScore} />
                    <span className="text-[11px] font-semibold text-slate-500">
                      Best on <strong className="text-slate-800">{bestPlatform?.platform}</strong>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xl font-black text-slate-900">
                        ₹{bestPlatform?.netPayablePrice?.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-600 line-through">
                        MRP ₹{product.mrp?.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <Link
                      to={`/product/${pId}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      <span>Decision Suite</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
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
