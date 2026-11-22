import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, Zap, Heart, Bell, User, LogOut, Search, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { productService } from '../services/api';
import { VerdictBadge } from './DecisionBadge';

export const Navbar = () => {
  const { user, isAuthenticated, logout, quickDemoLogin } = useAuth();
  const { totalItemCount } = useCart();
  const navigate = useNavigate();

  // Instant Search Autocomplete
  const [navSearch, setNavSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
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
              placeholder="Search phone, laptop, face wash, apples..."
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
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200 flex-shrink-0"
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

          {/* Wishlist & Price Alerts */}
          <Link
            to="/wishlist"
            className="p-2 text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-100 transition-colors"
            title="Price Drop Alerts"
          >
            <Bell className="w-4 h-4" />
          </Link>

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
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={quickDemoLogin}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
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
