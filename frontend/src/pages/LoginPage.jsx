import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isWrongPassword, setIsWrongPassword] = useState(false);
  const [isUserNotFound, setIsUserNotFound] = useState(false);
  const [successNotification, setSuccessNotification] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const { login, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/explore';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsWrongPassword(false);
    setIsUserNotFound(false);
    setSuccessNotification('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Invalid email or password.';
      setError(errorMsg);

      if (
        err.response?.data?.isUserNotFound ||
        errorMsg.toLowerCase().includes('user not found') ||
        errorMsg.toLowerCase().includes('please sign up') ||
        errorMsg.toLowerCase().includes('no account found')
      ) {
        setIsUserNotFound(true);
      } else if (
        err.response?.data?.isWrongPassword ||
        errorMsg.toLowerCase().includes('incorrect password') ||
        errorMsg.toLowerCase().includes('wrong password')
      ) {
        setIsWrongPassword(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = async () => {
    setError('');
    setIsWrongPassword(false);
    setIsUserNotFound(false);
    setSuccessNotification('');
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

  const handleResetSuccess = (resetEmail) => {
    if (resetEmail) setEmail(resetEmail);
    setPassword('');
    setError('');
    setIsWrongPassword(false);
    setIsUserNotFound(false);
    setSuccessNotification('Password reset successfully! Please sign in with your new password.');
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
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-50 to-emerald-50 hover:from-indigo-100 hover:to-emerald-100 border border-indigo-200/80 text-xs font-bold text-indigo-950 flex items-center justify-center gap-2 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
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

        {/* Success Banner */}
        {successNotification && (
          <div className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200 font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successNotification}</span>
          </div>
        )}

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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 ${
                  isWrongPassword
                    ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                    : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
              />
            </div>
          </div>

          {/* Prominent User Not Found Alert with 1-Click Register Trigger */}
          {isUserNotFound ? (
            <div className="p-4 rounded-2xl bg-indigo-50/90 border border-indigo-200/90 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>No account found for this email</span>
              </div>
              <p className="text-[11px] text-indigo-700 leading-relaxed">
                You haven't signed up with this email address yet. Join Picksy in seconds to unlock smart price comparisons!
              </p>
              <Link
                to="/register"
                state={{ email }}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <span>Create Free Account →</span>
              </Link>
            </div>
          ) : isWrongPassword ? (
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Incorrect password for this account</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Can't remember your password? Reset it in under 60 seconds with an email OTP code.
              </p>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Reset Password with Email OTP</span>
              </button>
            </div>
          ) : (
            error && (
              <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )
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

      {/* Forgot Password OTP Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        initialEmail={email}
        onSuccess={handleResetSuccess}
      />
    </div>
  );
};
