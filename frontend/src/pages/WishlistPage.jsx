import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Bell,
  Trash2,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  Clock,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { wishlistService, alertService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { VerdictBadge, DealScoreBadge } from '../components/DecisionBadge';

export const WishlistPage = () => {
  const { user, isAuthenticated, quickDemoLogin, logout } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('wishlist'); // 'wishlist' or 'alerts'

  const loadData = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        const [wRes, aRes] = await Promise.all([
          wishlistService.getAll(),
          alertService.getAll(),
        ]);
        if (wRes.data.success) setWishlist(wRes.data.wishlist || []);
        if (aRes.data.success) setAlerts(aRes.data.alerts || []);
      }
    } catch (err) {
      console.error('Failed to load user wishlist/alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const handleRemoveWishlist = async (productId) => {
    try {
      await wishlistService.remove(productId);
      setWishlist((prev) => prev.filter((p) => (p._id || p.id) !== productId));
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await alertService.delete(alertId);
      setAlerts((prev) => prev.filter((a) => (a._id || a.id) !== alertId));
    } catch (err) {
      console.error('Failed to delete alert:', err);
    }
  };

  const handleDemoSignIn = async () => {
    try {
      await quickDemoLogin();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-2xs">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Save Items & Track Price Drops
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-md mx-auto">
          Sign in to your Picksy account to monitor saved products and receive automated price alerts when target prices are hit.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleDemoSignIn}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Sign In as Demo User</span>
          </button>
          <Link
            to="/login"
            className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
          >
            Sign In with Email
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
            User Workspace
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Wishlist & Price Drop Watchlist
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Logged in as <strong>{user?.name}</strong> ({user?.email})
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'wishlist'
                ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Wishlist ({wishlist.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Price Alerts ({alerts.length})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3"></div>
          <div className="text-xs font-semibold text-slate-500">Loading your saved items...</div>
        </div>
      ) : activeTab === 'wishlist' ? (
        /* Wishlist Grid */
        wishlist.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Your Wishlist is Empty</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Browse products and click the heart icon to save them for decision tracking.
            </p>
            <Link
              to="/explore"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((product) => {
              const pId = product._id || product.id;
              const decision = product.decision;
              const bestPlatform = decision?.bestPlatform;
              const verdict = decision?.verdict?.action;

              return (
                <div
                  key={pId}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft hover:shadow-elevated transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 mb-3 border border-slate-100">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5">
                        <VerdictBadge verdict={verdict} size="sm" />
                      </div>
                      <button
                        onClick={() => handleRemoveWishlist(pId)}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/90 text-slate-400 hover:text-rose-600 transition-colors shadow-2xs"
                        title="Remove from Wishlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                      {product.brand} • {product.subCategory}
                    </div>

                    <Link to={`/product/${pId}`}>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-2 hover:text-indigo-600 transition-colors mb-2">
                        {product.title}
                      </h3>
                    </Link>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-base font-extrabold text-slate-900">
                        ₹{bestPlatform?.netPayablePrice?.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Best on {bestPlatform?.platform}
                      </div>
                    </div>

                    <Link
                      to={`/product/${pId}`}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1"
                    >
                      <span>Decide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Alerts List */
        alerts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Active Price Alerts</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Set target price alerts on products to be notified the moment a sale drops below your target.
            </p>
            <Link
              to="/explore"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
            >
              Browse Products to Monitor
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => {
              const aId = alert._id || alert.id;
              const prod = alert.productId || {};
              const targetMet = alert.isTriggered;

              return (
                <div
                  key={aId}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft hover:shadow-elevated transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={prod.image || 'https://images.unsplash.com/photo-1546435770-a3e426bf472b'}
                      alt={prod.title}
                      className="w-14 h-14 object-cover rounded-xl border border-slate-200 flex-shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {prod.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>
                          Target: <strong className="text-slate-900">₹{alert.targetPrice?.toLocaleString('en-IN')}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Current Best: <strong className="text-indigo-600">₹{alert.currentPrice?.toLocaleString('en-IN')}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Created At Price: ₹{alert.currentPriceAtCreation?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {targetMet ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Target Price Reached!</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Active Monitoring</span>
                      </span>
                    )}

                    <button
                      onClick={() => handleDeleteAlert(aId)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                      title="Dismiss Alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};
