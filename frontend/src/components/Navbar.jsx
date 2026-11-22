import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Zap,
  Heart,
  Bell,
  User,
  LogOut,
  Search,
  ArrowRight,
  X,
  Wallet,
  Sparkles,
  TrendingDown,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { productService, alertService } from '../services/api';
import { VerdictBadge } from './DecisionBadge';

export const Navbar = () => {
  const { user, isAuthenticated, logout, quickDemoLogin, totalSavings } = useAuth();
  const { totalItemCount } = useCart();
  const navigate = useNavigate();

  // Instant Search Autocomplete
  const [navSearch, setNavSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  // Notification Bell State
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 'mock_init_1',
      productId: 'prod_101',
      title: 'Apple iPhone 15 (128 GB)',
      message: 'Dropped to ₹58,999 on Flipkart (Target was ₹62,000)!',
      platform: 'Flipkart',
      droppedPrice: 58999,
      timestamp: '10 mins ago',
      isRead: false,
    },
  ]);
  const notifContainerRef = useRef(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Load real triggered alerts if user is authenticated
  useEffect(() => {
    const fetchAlerts = async () => {
      if (isAuthenticated) {
        try {
          const res = await alertService.getAll();
          if (res.data?.success && res.data.alerts) {
            const triggered = res.data.alerts
              .filter((a) => a.isTriggered || a.status === 'triggered')
              .map((a) => ({
                id: a._id || a.id,
                productId: a.productId?._id || a.productId?.id || a.productId,
                title: a.productId?.title || 'Monitored Item',
                message: `Dropped to ₹${(a.currentPrice || a.targetPrice - 500).toLocaleString('en-IN')} (Target: ₹${a.targetPrice.toLocaleString('en-IN')})`,
                platform: 'Flipkart',
                droppedPrice: a.currentPrice || a.targetPrice - 500,
                timestamp: 'Active Now',
                isRead: false,
              }));

            if (triggered.length > 0) {
              setNotifications(triggered);
            }
          }
        } catch (err) {
          // Silent fallback for guest/offline
        }
      }
    };

    fetchAlerts();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!navSearch.trim() || navSearch.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await productService.getAll({ search: navSearch.trim() });
        if (res.data.success) {
          setSuggestions(res.data.products.slice(0, 5));
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Navbar search error:', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [navSearch]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      setShowDropdown(false);
      navigate(`/explore?search=${encodeURIComponent(navSearch.trim())}`);
    }
  };

  const handleSelectProduct = (product) => {
    setNavSearch('');
    setShowDropdown(false);
    if (product.category === 'quick-commerce') {
      navigate('/quick-commerce');
    } else {
      navigate(`/product/${product._id || product.id}`);
    }
  };

  // Simulate price drop from navbar
  const handleQuickSimulate = async () => {
    setIsSimulating(true);
    try {
      if (!isAuthenticated) {
        await quickDemoLogin();
      }
      const res = await alertService.simulateDrop({});
      if (res.data?.success && res.data.notification) {
        setNotifications((prev) => [res.data.notification, ...prev]);
        setIsNotifOpen(true);
      }
    } catch (err) {
      // Create instant simulated visual notification
      const mockNotif = {
        id: `sim_${Date.now()}`,
        productId: 'prod_101',
        title: 'Apple iPhone 15 (128 GB)',
        message: '⚡ Flash Sale Drop: Dropped to ₹59,499 on Flipkart!',
        platform: 'Flipkart',
        droppedPrice: 59499,
        timestamp: 'Just now',
        isRead: false,
      };
      setNotifications((prev) => [mockNotif, ...prev]);
      setIsNotifOpen(true);
    } finally {
      setIsSimulating(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <span className="font-extrabold text-base tracking-tighter">P</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute ml-3 mt-3"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                Picksy
              </span>
            </div>
            <p className="hidden sm:block text-[10px] text-slate-500 font-bold -mt-0.5 tracking-tight">
              Pick Smartly, Shop Wisely.
            </p>
          </div>
        </Link>

        {/* 2-Mode Primary Navigation Tools */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-bold">
          <NavLink
            to="/explore"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            <span>Compare Prices & Buy/Wait</span>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/70 px-1.5 py-0.2 rounded">
              Amazon • Flipkart
            </span>
          </NavLink>

          <NavLink
            to="/quick-commerce"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>10-Min Grocery Optimizer</span>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/70 px-1.5 py-0.2 rounded">
              Blinkit • Zepto
            </span>
          </NavLink>
        </nav>

        {/* Instant Search Bar with Live Dropdown */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-xs md:max-w-sm hidden sm:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true);
              }}
              placeholder="Search product or paste URL..."
              className="w-full pl-9 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {navSearch && (
              <button
                type="button"
                onClick={() => {
                  setNavSearch('');
                  setShowDropdown(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Instant Dropdown Results */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-elevated border border-slate-200 p-2 z-50 animate-in fade-in duration-150">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Instant Price Matches
              </div>
              <div className="divide-y divide-slate-100">
                {suggestions.map((p) => {
                  const best = p.decision?.bestPlatform || p.platformListings?.[0];
                  return (
                    <button
                      key={p._id || p.id}
                      onClick={() => handleSelectProduct(p)}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-3 group"
                    >
                      <img
                        src={p.image}
                        alt={p.title}
                        className="w-10 h-10 object-contain rounded-lg border border-slate-200 flex-shrink-0 bg-slate-50 p-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                          {p.title}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-extrabold text-slate-900">
                            ₹{best?.basePrice?.toLocaleString('en-IN') || p.mrp}
                          </span>
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded font-semibold">
                            {p.category === 'quick-commerce' ? '10-Min App' : best?.platform || 'E-Commerce'}
                          </span>
                        </div>
                      </div>
                      {p.decision?.verdict && (
                        <div className="flex-shrink-0">
                          <VerdictBadge verdict={p.decision.verdict.action} size="sm" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={handleSearchSubmit}
                className="w-full mt-1 pt-2 border-t border-slate-100 text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 py-1"
              >
                View all results for "{navSearch}" →
              </button>
            </div>
          )}
        </div>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Total Saved Lifetime Pill Badge */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-xs font-bold shadow-2xs"
            title="Total verified money saved using Picksy shopping decisions & cart optimization"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline text-[11px] text-emerald-700 font-semibold">Saved:</span>
            <span className="font-black text-emerald-950 font-mono">
              ₹{(totalSavings || 0).toLocaleString('en-IN')}
            </span>
          </div>

          {/* Quick-Commerce Cart Pill */}
          <Link
            to="/quick-commerce"
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 bg-white transition-all shadow-xs"
            title="Unified 10-Min Grocery Cart"
          >
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
            <span className="hidden md:inline">Grocery Cart</span>
            {totalItemCount > 0 ? (
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-extrabold flex items-center justify-center animate-pulse">
                {totalItemCount}
              </span>
            ) : null}
          </Link>

          {/* Live Notification Bell with Dropdown */}
          <div ref={notifContainerRef} className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Price Drop Alerts & Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-elevated border border-slate-200 p-4 z-50 animate-in fade-in duration-150 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 tracking-tight">
                      Price Drop Alerts
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                    }}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600"
                  >
                    Mark read
                  </button>
                </div>

                {/* Notifications List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 transition-colors flex items-start gap-2.5"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <TrendingDown className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{n.title}</div>
                        <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          {n.message}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                          <span>{n.timestamp}</span>
                          <Link
                            to={`/product/${n.productId}`}
                            onClick={() => setIsNotifOpen(false)}
                            className="font-bold text-indigo-600 hover:text-indigo-800"
                          >
                            View Deal →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Simulator Shortcut in Dropdown */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={handleQuickSimulate}
                    disabled={isSimulating}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200 text-amber-900 hover:from-amber-100 hover:to-indigo-100 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    <span>{isSimulating ? 'Triggering...' : '⚡ Simulate Flash Sale Drop'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Auth */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/wishlist"
                className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors text-xs font-semibold text-slate-800"
              >
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-extrabold">
                  {user?.name?.[0] || 'U'}
                </div>
                <span className="hidden sm:inline">{user?.name?.split(' ')[0]}</span>
              </Link>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={quickDemoLogin}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
              >
                Demo
              </button>
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
