import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, Zap, Heart, Bell, User, LogOut, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const Navbar = () => {
  const { user, isAuthenticated, logout, quickDemoLogin } = useAuth();
  const { totalItemCount } = useCart();
  const navigate = useNavigate();

  const handleDemoSignIn = async () => {
    try {
      await quickDemoLogin();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <span className="font-extrabold text-base tracking-tighter">P</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute ml-3 mt-3"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                Picksy
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                PRO
              </span>
            </div>
            <p className="hidden sm:block text-[10px] text-slate-600 font-bold -mt-0.5 tracking-tight">
              Pick Smartly, Shop Wisely.
            </p>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl border border-slate-200/50 text-xs font-semibold">
          <NavLink
            to="/explore"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            E-Commerce Engine
          </NavLink>
          <NavLink
            to="/quick-commerce"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Smart Cart Optimizer</span>
          </NavLink>
          <NavLink
            to="/wishlist"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Price Alerts</span>
          </NavLink>
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Quick-Commerce Cart Button */}
          <Link
            to="/quick-commerce"
            className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 bg-white transition-all shadow-2xs"
            title="Unified Quick-Commerce Cart"
          >
            <ShoppingBag className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Picksy Cart</span>
            {totalItemCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-extrabold flex items-center justify-center">
                {totalItemCount}
              </span>
            )}
          </Link>

          {/* User Auth Menu */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/wishlist"
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                  {user?.name?.[0] || 'U'}
                </div>
                <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
                  {user?.name?.split(' ')[0]}
                </span>
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
                onClick={handleDemoSignIn}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Demo User</span>
              </button>
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
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
