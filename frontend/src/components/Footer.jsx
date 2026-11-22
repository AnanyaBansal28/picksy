import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, Zap, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm">
                P
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                Picksy
              </span>
            </div>
            <p className="text-xs text-slate-500 font-semibold mb-2">
              Pick Smartly, Shop Wisely.
            </p>
            <p className="text-xs text-slate-600 max-w-md leading-relaxed">
              An intelligent Shopping Decision Engine that helps modern shoppers decide what to buy, where to buy it, when to buy it, and whether a discount is genuinely authentic.
            </p>
            <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Unbiased Algorithm
              </span>
              <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-200">
                <Sparkles className="w-3.5 h-3.5" /> No Sponsored Rankings
              </span>
            </div>
          </div>

          {/* Supported Platforms */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Supported Platforms
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Amazon</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>Flipkart</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                <span>Myntra</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                <span>Blinkit</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                <span>Zepto</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                <span>Swiggy Instamart</span>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Decision Suite
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link to="/explore" className="hover:text-indigo-600 transition-colors">
                  E-Commerce Price Tracker
                </Link>
              </li>
              <li>
                <Link to="/quick-commerce" className="hover:text-indigo-600 transition-colors">
                  Quick-Commerce Cart Optimizer
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-indigo-600 transition-colors">
                  Target Price Drop Alerts
                </Link>
              </li>
              <li>
                <Link to="/explore?dealFilter=BUY_NOW" className="hover:text-indigo-600 transition-colors">
                  Buy Now Verified Deals
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <div>
            © {new Date().getFullYear()} Picksy Technologies. Pick Smartly, Shop Wisely.
          </div>
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <span>Anti-Fake Discount Policy</span>
            <span>•</span>
            <span>Zero Sponsored Bias</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
