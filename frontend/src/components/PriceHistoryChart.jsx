import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { TrendingDown, TrendingUp, Calendar, Info } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs max-w-[200px]">
        <div className="text-slate-400 font-medium mb-1 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {data.date}
        </div>
        <div className="text-base font-bold text-white mb-0.5">
          ₹{data.price.toLocaleString('en-IN')}
        </div>
        <div className="text-slate-300 text-[11px] font-medium bg-slate-800/80 px-2 py-0.5 rounded mt-1 inline-block">
          {data.note || 'Normal Listing'}
        </div>
      </div>
    );
  }
  return null;
};

export const PriceHistoryChart = ({ history = [], avg30Price, lowest30Price, currentPrice }) => {
  const [timeRange, setTimeRange] = useState('30d');

  // Filter or slice based on timeRange
  const chartData = timeRange === '30d' ? history.slice(-30) : history;

  const minPrice = Math.min(...chartData.map((d) => d.price), lowest30Price || currentPrice);
  const maxPrice = Math.max(...chartData.map((d) => d.price));

  // Determine price trend
  const firstPrice = chartData[0]?.price || currentPrice;
  const lastPrice = chartData[chartData.length - 1]?.price || currentPrice;
  const isDropping = lastPrice <= firstPrice;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-soft">
      {/* Header with Title and Range Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              Historical Price Intelligence
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              Daily Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare today's quote against the 30-day baseline to avoid inflated pricing traps.
          </p>
        </div>

        {/* 30D / 90D Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              timeRange === '30d'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              timeRange === '90d'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All-Time / 90D
          </button>
        </div>
      </div>

      {/* Metric Highlighting Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
        <div>
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Current Best
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
            ₹{currentPrice?.toLocaleString('en-IN')}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            30-Day Average
          </div>
          <div className="text-sm sm:text-base font-semibold text-slate-700 mt-0.5">
            ₹{avg30Price?.toLocaleString('en-IN')}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            30-Day Floor
          </div>
          <div className="text-sm sm:text-base font-semibold text-emerald-600 mt-0.5">
            ₹{lowest30Price?.toLocaleString('en-IN')}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            30-Day Peak
          </div>
          <div className="text-sm sm:text-base font-semibold text-slate-600 mt-0.5">
            ₹{maxPrice?.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* The Area Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              tickFormatter={(val) => {
                const parts = val.split('-');
                return parts.length === 3 ? `${parts[1]}/${parts[2]}` : val;
              }}
            />
            <YAxis
              domain={[Math.floor(minPrice * 0.95), Math.ceil(maxPrice * 1.05)]}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            {avg30Price && (
              <ReferenceLine
                y={avg30Price}
                stroke="#94A3B8"
                strokeDasharray="4 4"
                label={{
                  value: '30D Avg',
                  fill: '#64748B',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="price"
              stroke="#4F46E5"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
          <span>Verified Price Points</span>
          <span className="mx-1 text-slate-300">•</span>
          <span className="w-4 h-0.5 bg-slate-400 inline-block border-t border-dashed"></span>
          <span>30D Baseline</span>
        </div>
        <div className="flex items-center gap-1 text-slate-600 font-medium">
          {isDropping ? (
            <>
              <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Downward Trend (-{Math.round(((firstPrice - lastPrice) / firstPrice) * 100)}%)</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-amber-700">Recent Spike (+{Math.round(((lastPrice - firstPrice) / firstPrice) * 100)}%)</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

