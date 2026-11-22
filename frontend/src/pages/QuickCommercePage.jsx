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
} from 'lucide-react';
import { productService } from '../services/api';
import { useCart } from '../context/CartContext';

const GROCERY_CATEGORIES = ['All', 'Dairy & Breakfast', 'Bakery & Bread', 'Beverages & Coffee'];

export const QuickCommercePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const {
    cartItems,
    totalItemCount,
    optimization,
    optimizing,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getItemQuantity,
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

  // Load realistic sample grocery cart for 1-click test
  const handleLoadSampleCart = () => {
    if (products.length >= 4) {
      setCartItems([
        { product: products[0], quantity: 2 }, // Milk
        { product: products[1], quantity: 1 }, // Bread
        { product: products[3], quantity: 1 }, // Eggs
        { product: products[4], quantity: 1 }, // Butter
      ]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-200">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Mode A & B: Quick-Commerce Intelligence</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Grocery Comparison & Smart Cart Optimizer
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Compare items across <strong>Blinkit</strong>, <strong>Zepto</strong>, and <strong>Swiggy Instamart</strong>. Build your cart to discover whether a single store or an optimized split-order saves more money.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSampleCart}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Load 4-Item Sample Cart</span>
            </button>
          </div>
        </div>
      </div>

      {/* Split-Screen Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Grocery Catalog (Mode A) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-soft space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search milk, bread, butter, coffee, eggs..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
              {GROCERY_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
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
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white p-4 rounded-2xl border border-slate-200 animate-pulse h-28"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => {
                const pId = product._id || product.id;
                const qty = getItemQuantity(pId);
                const blinkitListing = product.platformListings?.find((l) => l.platform === 'Blinkit');
                const zeptoListing = product.platformListings?.find((l) => l.platform === 'Zepto');
                const instamartListing = product.platformListings?.find((l) => l.platform === 'Instamart');

                return (
                  <div
                    key={pId}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-soft hover:shadow-elevated transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Item info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {product.brand} • {product.unit}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {product.title}
                        </h3>

                        {/* Mode A: Platform Live Price Comparison Matrix */}
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                          {blinkitListing && (
                            <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-950 font-bold px-2 py-0.5 rounded border border-yellow-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                              Blinkit: ₹{blinkitListing.basePrice}
                            </span>
                          )}
                          {zeptoListing && (
                            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-950 font-bold px-2 py-0.5 rounded border border-purple-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                              Zepto: ₹{zeptoListing.basePrice}
                            </span>
                          )}
                          {instamartListing && (
                            <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-950 font-bold px-2 py-0.5 rounded border border-orange-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                              Instamart: ₹{instamartListing.basePrice}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Add to Cart Stepper */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {qty === 0 ? (
                        <button
                          onClick={() => addToCart(product, 1)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Picksy Cart</span>
                        </button>
                      ) : (
                        <div className="flex items-center bg-indigo-50 border border-indigo-200 rounded-xl p-1 text-xs font-bold text-indigo-900">
                          <button
                            onClick={() => updateQuantity(pId, qty - 1)}
                            className="p-1 hover:bg-indigo-200 rounded-lg text-indigo-700"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold">{qty}</span>
                          <button
                            onClick={() => updateQuantity(pId, qty + 1)}
                            className="p-1 hover:bg-indigo-200 rounded-lg text-indigo-700"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Smart Cart Optimizer (Mode B) */}
        <div className="lg:col-span-5 sticky top-24 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-elevated">
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Smart Cart Optimizer
                </h2>
                <span className="text-xs bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded-full">
                  {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                </span>
              </div>

              {cartItems.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cartItems.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Your Unified Cart is Empty</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Add items from the grocery list or load the sample cart to see the multi-platform optimizer in action.
                </p>
                <button
                  onClick={handleLoadSampleCart}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Load 4-Item Sample Cart
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Micro Item Chips */}
                <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                  {cartItems.map((item) => {
                    const pId = item.product._id || item.product.id;
                    return (
                      <div
                        key={pId}
                        className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-slate-900 truncate">
                            {item.product.title}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Qty: {item.quantity} • MRP ₹{item.product.mrp * item.quantity}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateQuantity(pId, item.quantity - 1)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-bold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(pId, item.quantity + 1)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Optimization Highlights Banner */}
                {optimizing ? (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent mb-2"></div>
                    <div className="text-xs font-semibold text-slate-600">
                      Computing delivery thresholds & split carts...
                    </div>
                  </div>
                ) : optimization ? (
                  <div className="space-y-4 pt-2">
                    {/* Top Highlights: Cheapest vs Fastest */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-[#ECFDF5] border border-[#A7F3D0] p-3 rounded-2xl">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#065F46]">
                          Cheapest Choice
                        </div>
                        <div className="text-base font-black text-[#065F46] mt-0.5">
                          ₹{optimization.cheapestOption?.netTotal?.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-800 truncate">
                          {optimization.cheapestOption?.platform}
                        </div>
                      </div>

                      <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-2xl">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                          Fastest Delivery
                        </div>
                        <div className="text-base font-black text-indigo-950 mt-0.5">
                          {optimization.fastestOption?.eta}
                        </div>
                        <div className="text-[11px] font-semibold text-indigo-800 truncate">
                          {optimization.fastestOption?.platform} (₹{optimization.fastestOption?.netTotal})
                        </div>
                      </div>
                    </div>

                    {/* Mode B: Split Cart Optimizer Card */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/40 border border-indigo-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <span>Picksy Split-Cart Verdict</span>
                        </div>
                        {optimization.splitCartAnalysis?.isCheaper ? (
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            Saves ₹{optimization.splitCartAnalysis.savings}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                            Single Cart Optimal
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 font-medium leading-relaxed mb-3">
                        {optimization.splitCartAnalysis?.recommendationNote}
                      </p>

                      {/* Split cart breakdown details if split */}
                      {optimization.splitCartAnalysis?.isCheaper && (
                        <div className="space-y-2 pt-2 border-t border-indigo-100">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Optimal Dispatch Plan:
                          </div>
                          {optimization.splitCartAnalysis.platformsUsed?.map((p, idx) => (
                            <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                              <div className="flex items-center justify-between font-bold text-slate-900">
                                <span>{p.platform} ({p.itemsCount} items)</span>
                                <span>₹{p.subtotal + p.deliveryFee + p.handlingFee}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                                <span>Items: {p.items.map((i) => i.title.split(' ')[0]).join(', ')}</span>
                                <span>ETA: {p.eta}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Mode A: Single Platform Direct Comparison Cards */}
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Single-Platform Checkouts
                      </h4>

                      <div className="space-y-2.5">
                        {optimization.singlePlatformOptions?.map((p, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-extrabold text-slate-900 text-sm">
                                {p.platform}
                              </span>
                              <span className="text-sm font-black text-slate-900">
                                ₹{p.netTotal}
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-500 py-1 border-t border-slate-100 mt-1">
                              <div>Items: ₹{p.itemSubtotal}</div>
                              <div>
                                Delivery:{' '}
                                {p.freeDeliveryUnlocked ? (
                                  <span className="text-emerald-700 font-bold">FREE</span>
                                ) : (
                                  `₹${p.deliveryFee}`
                                )}
                              </div>
                              <div>Handling: ₹{p.handlingFee}</div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1 pt-1 border-t border-slate-50">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>ETA: {p.eta}</span>
                              </span>
                              {!p.freeDeliveryUnlocked && (
                                <span className="text-amber-700 font-medium">
                                  Add ₹{p.amountNeededForFreeDelivery} for free delivery
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
