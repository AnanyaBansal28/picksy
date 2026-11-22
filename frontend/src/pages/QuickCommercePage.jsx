import React, { useState, useEffect } from 'react';
import {
  Zap,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Search,
  Check,
  Split,
  ChevronRight,
  ArrowRightLeft,
  Store,
} from 'lucide-react';
import { productService } from '../services/api';
import { useCart } from '../context/CartContext';

const GROCERY_CATEGORIES = [
  'All',
  'Personal Care',
  'Fruits & Veggies',
  'Dairy & Breakfast',
  'Beverages & Snacks',
];

export const QuickCommercePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const {
    cartItems,
    totalItemCount,
    optimization,
    optimizing,
    addToPlatform,
    updatePlatformQuantity,
    removeFromPlatform,
    getPlatformQuantity,
    autoOptimizeCart,
    clearCart,
    setCartItems,
  } = useCart();

  useEffect(() => {
    const fetchGroceries = async () => {
      setLoading(true);
      try {
        const res = await productService.getAll({
          category: 'quick-commerce',
          subCategory: category !== 'All' ? category : undefined,
          search: search.trim() || undefined,
        });
        if (res.data.success) {
          setProducts(res.data.products);
        }
      } catch (err) {
        console.error('Failed to load groceries:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroceries();
  }, [category, search]);

  const handleAddPlatform = (product, platform) => {
    addToPlatform(product, platform, 1);
    setToastMessage(`Added to ${platform}: ${product.title.split('(')[0]}`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  // 1-Click Test: Pre-fill realistic split cart with Face Wash on Zepto (₹249) + Apples (₹139) & Bananas (₹35) on Blinkit
  const handleLoadSampleSplitCart = () => {
    const faceWash = products.find((p) => p.title.toLowerCase().includes('cetaphil')) || products[0];
    const apples = products.find((p) => p.title.toLowerCase().includes('apple')) || products[3];
    const bananas = products.find((p) => p.title.toLowerCase().includes('banana')) || products[4];
    const milk = products.find((p) => p.title.toLowerCase().includes('milk')) || products[6];

    if (faceWash && apples && bananas) {
      setCartItems([
        { product: faceWash, platform: 'Zepto', quantity: 1, unitPrice: 249 },
        { product: apples, platform: 'Blinkit', quantity: 1, unitPrice: 139 },
        { product: bananas, platform: 'Blinkit', quantity: 1, unitPrice: 35 },
        { product: milk, platform: 'Zepto', quantity: 1, unitPrice: 70 },
      ]);
      setToastMessage('Sample Split Cart Loaded: Face Wash & Milk on Zepto + Fruits on Blinkit!');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  const customCart = optimization?.customCart;
  const optimalSplit = optimization?.smartSplitOption;
  const singleStores = optimization?.singleStores;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-elevated text-xs font-bold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-extrabold uppercase tracking-wider mb-2 border border-amber-200">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>10-Minute Grocery Split-Cart Engine</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
              Compare 10-Min Stores & Select Per-App Cart
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Each grocery item below shows live prices across <strong>Blinkit</strong>, <strong>Zepto</strong>, and <strong>Swiggy Instamart</strong>. Choose which app you want to add each item from, or let Picksy auto-optimize your order!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSampleSplitCart}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>⚡ Load Sample Split Cart (Zepto + Blinkit)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Split-Screen Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Grocery Catalog with 3 Platform Rows per Item */}
        <div className="lg:col-span-7 space-y-6">
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search face wash, apples, bananas, coffee, milk, bread..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {GROCERY_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    category === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grocery Items List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white p-4 rounded-2xl border border-slate-200 animate-pulse h-36"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => {
                const pId = product._id || product.id;
                const blinkit = product.platformListings?.find((l) => l.platform === 'Blinkit');
                const zepto = product.platformListings?.find((l) => l.platform === 'Zepto');
                const instamart = product.platformListings?.find((l) => l.platform === 'Instamart');

                const validListings = [blinkit, zepto, instamart].filter(Boolean);
                const minPrice = Math.min(...validListings.map((l) => l.basePrice));
                const platformOptions = [
                  { platform: 'Blinkit', listing: blinkit, color: 'border-yellow-200 bg-yellow-50/40 text-yellow-950', dot: 'bg-yellow-500' },
                  { platform: 'Zepto', listing: zepto, color: 'border-purple-200 bg-purple-50/40 text-purple-950', dot: 'bg-purple-600' },
                  { platform: 'Instamart', listing: instamart, color: 'border-orange-200 bg-orange-50/40 text-orange-950', dot: 'bg-orange-500' },
                ];

                return (
                  <div
                    key={pId}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-soft hover:shadow-elevated transition-all space-y-3"
                  >
                    {/* Item Image & Title */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#F8FAFC] border border-slate-200 flex-shrink-0 p-1 flex items-center justify-center">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {product.brand} • {product.unit}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {product.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {product.description || 'Quick-commerce daily essential'}
                        </p>
                      </div>
                    </div>

                    {/* 3 Distinct Platform Rows with Individual + Add Steppers */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                      {platformOptions.map(({ platform, listing, color, dot }) => {
                        if (!listing) return null;
                        const qty = getPlatformQuantity(pId, platform);
                        const isCheapest = listing.basePrice === minPrice;
                        const isFastest = platform === 'Zepto';

                        return (
                          <div
                            key={platform}
                            className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                              qty > 0
                                ? 'border-indigo-400 bg-indigo-50/40 shadow-2xs'
                                : isCheapest
                                ? 'border-emerald-300 bg-emerald-50/30'
                                : 'border-slate-200 bg-slate-50/50'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="flex items-center gap-1.5 font-extrabold text-xs text-slate-900">
                                <span className={`w-2 h-2 rounded-full ${dot}`}></span>
                                <span>{platform}</span>
                              </span>
                              <div className="flex items-center gap-1">
                                {isCheapest && (
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.2 rounded-full shadow-2xs">
                                    Cheapest
                                  </span>
                                )}
                                {isFastest && !isCheapest && (
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-purple-600 text-white px-1.5 py-0.2 rounded-full shadow-2xs">
                                    Fastest
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-baseline justify-between mb-2">
                              <div>
                                <span className="text-base font-black text-slate-950">
                                  ₹{listing.basePrice}
                                </span>
                                <span className="text-[10px] text-slate-400 line-through ml-1.5">
                                  ₹{product.mrp}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                {listing.eta}
                              </span>
                            </div>

                            {/* Platform-Specific + Add / Quantity Stepper Button */}
                            <div>
                              {qty === 0 ? (
                                <button
                                  onClick={() => handleAddPlatform(product, platform)}
                                  className={`w-full py-1.5 px-2 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1 shadow-2xs ${
                                    isCheapest
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                                      : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                                  }`}
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add from {platform}</span>
                                </button>
                              ) : (
                                <div className="flex items-center justify-between bg-white border border-indigo-300 rounded-lg p-0.5 text-xs font-bold text-indigo-900 shadow-2xs">
                                  <button
                                    onClick={() => updatePlatformQuantity(pId, platform, qty - 1)}
                                    className="p-1 hover:bg-indigo-100 rounded text-indigo-700"
                                    title="Decrease quantity"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="font-black text-xs text-indigo-950">{qty}</span>
                                  <button
                                    onClick={() => updatePlatformQuantity(pId, platform, qty + 1)}
                                    className="p-1 hover:bg-indigo-100 rounded text-indigo-700"
                                    title="Increase quantity"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Side-by-Side Cart & Optimizer Panel */}
        <div className="lg:col-span-5 sticky top-20 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-elevated space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-extrabold text-slate-900">
                  Your Grocery Cart
                </h2>
                <span className="text-xs bg-indigo-100 text-indigo-800 font-black px-2 py-0.5 rounded-full">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                </span>
              </div>

              {cartItems.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Empty State */}
            {cartItems.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Your Cart is Empty</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4 max-w-xs mx-auto">
                  Click "+ Add from Blinkit", "+ Add from Zepto", or "+ Add from Instamart" on any item to build your split order!
                </p>
                <button
                  onClick={handleLoadSampleSplitCart}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-xs"
                >
                  ⚡ Load Sample Split Cart (4 Items)
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* 1. YOUR CUSTOM CART BREAKDOWN (PLATFORM-WISE) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-indigo-600" />
                      <span>1. Your Custom Cart (Per App)</span>
                    </span>
                    <span className="text-sm font-black text-slate-950">
                      Total: ₹{customCart?.totalCost || 0}
                    </span>
                  </div>

                  {/* List of stores with items selected by user */}
                  {customCart?.storeGroups?.map((group) => (
                    <div
                      key={group.platform}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between font-extrabold text-slate-900">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              group.platform === 'Blinkit'
                                ? 'bg-yellow-500'
                                : group.platform === 'Zepto'
                                ? 'bg-purple-600'
                                : 'bg-orange-500'
                            }`}
                          ></span>
                          <span>{group.platform} Order ({group.itemsCount} {group.itemsCount === 1 ? 'item' : 'items'}):</span>
                        </span>
                        <span className="font-black text-slate-950">
                          ₹{group.storeTotal}
                        </span>
                      </div>

                      {/* Items in this store */}
                      <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-slate-100">
                        {group.items.map((it) => (
                          <div
                            key={`${it.productId}_${group.platform}`}
                            className="flex items-center justify-between text-[11px]"
                          >
                            <span className="truncate max-w-[190px] font-medium text-slate-700">
                              {it.title} (x{it.quantity})
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">₹{it.lineTotal}</span>
                              <div className="flex items-center gap-1 bg-slate-100 rounded px-1">
                                <button
                                  onClick={() => updatePlatformQuantity(it.productId, group.platform, it.quantity - 1)}
                                  className="text-slate-500 hover:text-slate-900 p-0.5"
                                >
                                  -
                                </button>
                                <span className="font-extrabold text-[10px] w-3 text-center">{it.quantity}</span>
                                <button
                                  onClick={() => updatePlatformQuantity(it.productId, group.platform, it.quantity + 1)}
                                  className="text-slate-500 hover:text-slate-900 p-0.5"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Store Fee breakdown */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium pt-1 border-t border-slate-200/60">
                        <span>
                          Items ₹{group.subtotal} + Delivery{' '}
                          {group.freeDeliveryUnlocked ? (
                            <strong className="text-emerald-700 font-extrabold">FREE</strong>
                          ) : (
                            `₹${group.deliveryFee}`
                          )}{' '}
                          + Handling ₹{group.handlingFee}
                        </span>
                        <span>ETA: {group.eta}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Switch Suggestions if any item was placed in an expensive store */}
                {customCart?.switchSuggestions?.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-950">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>💡 Smart Savings Tip:</span>
                      </div>
                      <button
                        onClick={autoOptimizeCart}
                        className="text-[11px] font-black uppercase tracking-wide bg-amber-500 hover:bg-amber-600 text-slate-950 px-2.5 py-1 rounded-lg transition-colors shadow-2xs flex items-center gap-1"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Auto-Optimize to Cheapest</span>
                      </button>
                    </div>

                    <ul className="space-y-1 text-xs text-amber-900 font-medium">
                      {customCart.switchSuggestions.map((s, idx) => (
                        <li key={idx} className="flex items-center justify-between text-[11px]">
                          <span>
                            Switch <strong>{s.productTitle.split(' ')[0]}</strong> to {s.betterPlatform}:
                          </span>
                          <span className="font-black text-emerald-800">
                            Save ₹{s.totalSavings}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 2. PICKSY SMART RECOMMENDATION & SAVINGS COMPARISON */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 border-2 border-emerald-300 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wide">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>2. Picksy Smart Recommendation</span>
                    </div>
                    {customCart?.savingsVsCheapestSingle > 0 ? (
                      <span className="text-[11px] font-black uppercase tracking-wide bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                        {customCart.summaryBadge}
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        Comparison Result
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {customCart?.explanation}
                  </p>

                  {/* Comparison vs All-Blinkit, All-Zepto, All-Instamart */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-emerald-100 text-[11px]">
                    <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                      <div className="text-[10px] font-bold text-slate-400">All-Blinkit</div>
                      <div className="font-black text-slate-900 mt-0.5">
                        ₹{singleStores?.blinkit?.netTotal}
                      </div>
                      {customCart?.savingsVsBlinkit > 0 && (
                        <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
                          -₹{customCart.savingsVsBlinkit}
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                      <div className="text-[10px] font-bold text-slate-400">All-Zepto</div>
                      <div className="font-black text-slate-900 mt-0.5">
                        ₹{singleStores?.zepto?.netTotal}
                      </div>
                      {customCart?.savingsVsZepto > 0 && (
                        <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
                          -₹{customCart.savingsVsZepto}
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-2 rounded-xl border border-slate-200 text-center">
                      <div className="text-[10px] font-bold text-slate-400">All-Instamart</div>
                      <div className="font-black text-slate-900 mt-0.5">
                        ₹{singleStores?.instamart?.netTotal}
                      </div>
                      {customCart?.savingsVsInstamart > 0 && (
                        <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
                          -₹{customCart.savingsVsInstamart}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
