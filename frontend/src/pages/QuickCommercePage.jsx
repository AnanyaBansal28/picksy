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
  const [lastAddedItem, setLastAddedItem] = useState(null);

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

  const handleAddToCartWithToast = (product) => {
    addToCart(product, 1);
    setLastAddedItem(product.title);
    setTimeout(() => setLastAddedItem(null), 2200);
  };

  // Pre-fill realistic sample split cart: Face Wash + Apples + Bananas + Milk
  const handleLoadSampleCart = () => {
    const faceWash = products.find((p) => p.title.toLowerCase().includes('cetaphil')) || products[0];
    const apples = products.find((p) => p.title.toLowerCase().includes('apple')) || products[3];
    const bananas = products.find((p) => p.title.toLowerCase().includes('banana')) || products[4];
    const milk = products.find((p) => p.title.toLowerCase().includes('milk')) || products[6];

    if (faceWash && apples && bananas) {
      setCartItems([
        { product: faceWash, quantity: 1 }, // Cheaper on Zepto (₹249)
        { product: apples, quantity: 1 },   // Cheaper on Blinkit (₹139)
        { product: bananas, quantity: 1 },  // Cheaper on Blinkit (₹35)
        { product: milk, quantity: 1 },     // Daily staple
      ]);
      setLastAddedItem('Sample 4-Item Split Cart Loaded!');
      setTimeout(() => setLastAddedItem(null), 2500);
    }
  };

  const splitOpt = optimization?.smartSplitOption;
  const single = optimization?.singleStores;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Notification */}
      {lastAddedItem && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-elevated text-xs font-bold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{lastAddedItem}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-extrabold uppercase tracking-wider mb-2 border border-amber-200">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Tool 2: 10-Minute Grocery Split-Cart Optimizer</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
              Compare 10-Min Stores & Split Cart to Save
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Skincare & coffee are often cheaper on <strong>Zepto</strong>, while fresh fruits & veggies are cheaper on <strong>Blinkit</strong>. Build your cart to see how much you save by splitting orders!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSampleCart}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>⚡ Load Sample Split Cart (Face Wash + Apples + Bananas)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Split-Screen Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Grocery Catalog */}
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
                <div key={n} className="bg-white p-4 rounded-2xl border border-slate-200 animate-pulse h-28"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3.5">
              {products.map((product) => {
                const pId = product._id || product.id;
                const qty = getItemQuantity(pId);
                const blinkit = product.platformListings?.find((l) => l.platform === 'Blinkit');
                const zepto = product.platformListings?.find((l) => l.platform === 'Zepto');
                const instamart = product.platformListings?.find((l) => l.platform === 'Instamart');

                // Determine lowest price platform for badge
                const validListings = [blinkit, zepto, instamart].filter(Boolean);
                const minPrice = Math.min(...validListings.map((l) => l.basePrice));

                return (
                  <div
                    key={pId}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-soft hover:shadow-elevated transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Item Image & Title */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {product.brand} • {product.unit}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {product.title}
                        </h3>

                        {/* Live Price Comparison Chips across Blinkit, Zepto, Instamart */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
                          {zepto && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-extrabold border ${
                                zepto.basePrice === minPrice
                                  ? 'bg-purple-100 text-purple-950 border-purple-300'
                                  : 'bg-purple-50 text-purple-900 border-purple-200/60'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                              Zepto: ₹{zepto.basePrice}
                              {zepto.basePrice === minPrice && ' (Cheapest)'}
                            </span>
                          )}

                          {blinkit && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-extrabold border ${
                                blinkit.basePrice === minPrice
                                  ? 'bg-yellow-100 text-yellow-950 border-yellow-300'
                                  : 'bg-yellow-50 text-yellow-900 border-yellow-200/60'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                              Blinkit: ₹{blinkit.basePrice}
                              {blinkit.basePrice === minPrice && ' (Cheapest)'}
                            </span>
                          )}

                          {instamart && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-extrabold border ${
                                instamart.basePrice === minPrice
                                  ? 'bg-orange-100 text-orange-950 border-orange-300'
                                  : 'bg-orange-50 text-orange-900 border-orange-200/60'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                              Instamart: ₹{instamart.basePrice}
                              {instamart.basePrice === minPrice && ' (Cheapest)'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Working Add to Cart Stepper */}
                    <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                      {qty === 0 ? (
                        <button
                          onClick={() => handleAddToCartWithToast(product)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add to Cart</span>
                        </button>
                      ) : (
                        <div className="flex items-center bg-indigo-50 border border-indigo-200 rounded-xl p-1 text-xs font-bold text-indigo-900">
                          <button
                            onClick={() => updateQuantity(pId, qty - 1)}
                            className="p-1 hover:bg-indigo-200 rounded-lg text-indigo-700 transition-colors"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-black">{qty}</span>
                          <button
                            onClick={() => updateQuantity(pId, qty + 1)}
                            className="p-1 hover:bg-indigo-200 rounded-lg text-indigo-700 transition-colors"
                            title="Increase quantity"
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

        {/* Right Column: Live Smart Cart Optimizer (4 Options View) */}
        <div className="lg:col-span-5 sticky top-20 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-elevated">
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-extrabold text-slate-900">
                  Picksy Cart Optimizer
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

            {/* Cart Empty State */}
            {cartItems.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Your Grocery Cart is Empty</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4 max-w-xs mx-auto">
                  Add Face Wash, Apples, Bananas, or Milk to see how splitting orders across Blinkit & Zepto saves money!
                </p>
                <button
                  onClick={handleLoadSampleCart}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-xs"
                >
                  ⚡ Load Sample Cart (4 Items)
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cart Items List */}
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
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
                            Qty: {item.quantity} • {item.product.unit}
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

                {/* Loading optimization */}
                {optimizing ? (
                  <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent mb-2"></div>
                    <div className="text-xs font-bold text-slate-600">
                      Comparing Blinkit, Zepto, and Instamart...
                    </div>
                  </div>
                ) : optimization ? (
                  <div className="space-y-4 pt-2">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Comparing Your 4 Checkout Options:
                    </div>

                    {/* OPTION 1: 🏆 PICKSY SMART SPLIT (RECOMMENDED) */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/40 border-2 border-emerald-300 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wide">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          <span>Option 1: 🏆 Picksy Smart Split</span>
                        </div>
                        {splitOpt?.isRecommended ? (
                          <span className="text-[11px] font-black uppercase tracking-wide bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                            {splitOpt.badgeText}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                            Single Store Cheaper
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        {splitOpt?.explanation}
                      </p>

                      {/* Explicit Item Groups by Store */}
                      <div className="space-y-2 pt-1 border-t border-emerald-100">
                        {splitOpt?.groups?.map((group, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-3 rounded-xl border border-emerald-200/80 text-xs shadow-2xs space-y-1"
                          >
                            <div className="flex items-center justify-between font-extrabold text-slate-900">
                              <span className="flex items-center gap-1 text-indigo-700">
                                <span>📦 Order from {group.platform}:</span>
                              </span>
                              <span className="text-slate-950 font-black">
                                ₹{group.storeTotal}
                              </span>
                            </div>

                            {/* Itemized List */}
                            <ul className="space-y-0.5 text-[11px] text-slate-600 pl-1">
                              {group.items.map((it, itemIdx) => (
                                <li key={itemIdx} className="flex items-center justify-between">
                                  <span>
                                    • {it.title} (x{it.quantity})
                                  </span>
                                  <span className="font-semibold text-slate-800">
                                    ₹{it.lineTotal}
                                  </span>
                                </li>
                              ))}
                            </ul>

                            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between font-medium">
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

                      {/* Total Split Cost Banner */}
                      <div className="flex items-center justify-between pt-2 border-t border-emerald-200 font-extrabold text-sm text-slate-900">
                        <span>Total Split Cost:</span>
                        <span className="text-base font-black text-emerald-800">
                          ₹{splitOpt?.totalCost}
                        </span>
                      </div>
                    </div>

                    {/* OPTIONS 2, 3, 4: SINGLE-STORE TOTALS */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Single Store Checkout Totals:
                      </div>

                      {/* Option 2: All from Blinkit */}
                      {single?.blinkit && (
                        <div className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all text-xs">
                          <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                              <span>Option 2: All from Blinkit</span>
                            </span>
                            <span className="font-black text-sm">
                              ₹{single.blinkit.netTotal}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                            <span>
                              Items: ₹{single.blinkit.itemSubtotal} | Delivery:{' '}
                              {single.blinkit.freeDeliveryUnlocked ? (
                                <strong className="text-emerald-700">FREE</strong>
                              ) : (
                                `₹${single.blinkit.deliveryFee}`
                              )}{' '}
                              | Fee: ₹{single.blinkit.handlingFee}
                            </span>
                            <span>ETA: {single.blinkit.eta}</span>
                          </div>
                        </div>
                      )}

                      {/* Option 3: All from Zepto */}
                      {single?.zepto && (
                        <div className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all text-xs">
                          <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                              <span>Option 3: All from Zepto</span>
                            </span>
                            <span className="font-black text-sm">
                              ₹{single.zepto.netTotal}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                            <span>
                              Items: ₹{single.zepto.itemSubtotal} | Delivery:{' '}
                              {single.zepto.freeDeliveryUnlocked ? (
                                <strong className="text-emerald-700">FREE</strong>
                              ) : (
                                `₹${single.zepto.deliveryFee}`
                              )}{' '}
                              | Fee: ₹{single.zepto.handlingFee}
                            </span>
                            <span>ETA: {single.zepto.eta}</span>
                          </div>
                        </div>
                      )}

                      {/* Option 4: All from Swiggy Instamart */}
                      {single?.instamart && (
                        <div className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all text-xs">
                          <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                              <span>Option 4: All from Instamart</span>
                            </span>
                            <span className="font-black text-sm">
                              ₹{single.instamart.netTotal}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                            <span>
                              Items: ₹{single.instamart.itemSubtotal} | Delivery:{' '}
                              {single.instamart.freeDeliveryUnlocked ? (
                                <strong className="text-emerald-700">FREE</strong>
                              ) : (
                                `₹${single.instamart.deliveryFee}`
                              )}{' '}
                              | Fee: ₹{single.instamart.handlingFee}
                            </span>
                            <span>ETA: {single.instamart.eta}</span>
                          </div>
                        </div>
                      )}
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
