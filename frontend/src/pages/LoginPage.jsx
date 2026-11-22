import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/explore';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Invalid email or password.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = async () => {
    setError('');
    setEmail('aarav@picksy.io');
    setPassword('picksy123');
    setLoading(true);
    try {
      await quickDemoLogin();
      navigate(from, { replace: true });
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Demo login failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-elevated space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto mb-3 shadow-sm">
            <span className="font-extrabold text-lg">P</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Sign In to Picksy
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pick Smartly, Shop Wisely.
          </p>
        </div>

        {/* Demo Fast-Login Pill */}
        <button
          type="button"
          onClick={handleFillDemo}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-50 to-emerald-50 hover:from-indigo-100 hover:to-emerald-100 border border-indigo-200/80 text-xs font-bold text-indigo-950 flex items-center justify-center gap-2 transition-all shadow-2xs disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>1-Click Instant Demo Sign In</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
            Or With Email
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-800">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
