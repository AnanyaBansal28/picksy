import React, { useState } from 'react';
import { Bell, X, Check, ArrowDownRight, Sparkles } from 'lucide-react';
import { alertService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const PriceAlertModal = ({ product, isOpen, onClose, onSuccess }) => {
  const { isAuthenticated, quickDemoLogin } = useAuth();
  const currentBestPrice = product?.decision?.cheapestPlatform?.netPayablePrice || product?.mrp || 0;
  const lowest30Price = product?.decision?.verdict?.lowest30Price || Math.round(currentBestPrice * 0.9);

  const [targetPrice, setTargetPrice] = useState(lowest30Price);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!targetPrice || targetPrice <= 0) {
      setError('Please enter a valid target price.');
      return;
    }
    if (targetPrice >= currentBestPrice) {
      setError(`Target price must be lower than the current price (₹${currentBestPrice.toLocaleString('en-IN')}).`);
      return;
    }

    setLoading(true);
    try {
      if (!isAuthenticated) {
        await quickDemoLogin();
      }

      await alertService.create({
        productId: product._id || product.id,
        targetPrice: Number(targetPrice),
      });

      setSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to set price alert.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPreset = (percentage) => {
    const discounted = Math.round(currentBestPrice * (1 - percentage / 100));
    setTargetPrice(discounted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-elevated border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Set Price Drop Alert</h3>
            <p className="text-xs text-slate-500">Picksy will monitor platforms 24/7 and alert you.</p>
          </div>
        </div>

        {/* Product mini card */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3 mb-5">
          <img
            src={product.image}
            alt={product.title}
            className="w-12 h-12 object-cover rounded-lg border border-slate-200"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 truncate">{product.title}</h4>
            <div className="text-xs text-slate-500 mt-0.5">
              Current Best: <span className="font-bold text-slate-900">₹{currentBestPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {success ? (
          <div className="text-center py-6 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-600">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold">Price Alert Activated!</h4>
            <p className="text-xs text-emerald-700 mt-1">
              You will be notified as soon as {product.title} drops to ₹{Number(targetPrice).toLocaleString('en-IN')}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Alert Price (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. 59999"
                  required
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                Suggested Drop Targets:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetPrice(lowest30Price)}
                  className="text-xs font-semibold py-1.5 px-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                >
                  30D Low (₹{lowest30Price.toLocaleString('en-IN')})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(5)}
                  className="text-xs font-semibold py-1.5 px-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                >
                  5% Drop
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(10)}
                  className="text-xs font-semibold py-1.5 px-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
                >
                  10% Drop
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <span>Configuring Monitor...</span>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  <span>Activate Price Drop Alert</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

