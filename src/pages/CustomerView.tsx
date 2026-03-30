import React, { useEffect, useState } from 'react';
import { useLiveRates, RateItem } from '../useLiveRates';
import { useAppConfig } from '../useAppConfig';
import { RefreshCw, AlertCircle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PriceFlash } from '../components/PriceFlash';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface HistoricalRate {
  type: string;
  symbol: string;
  bid: number;
  ask: number;
  timestamp: string;
}

export default function CustomerView() {
  const { goldRates, silverRates, error, lastUpdated } = useLiveRates();
  const { config, loading } = useAppConfig();
  const [historicalData, setHistoricalData] = useState<HistoricalRate[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/historical-rates');
        if (res.ok) {
          const data = await res.json();
          setHistoricalData(data);
        }
      } catch (err) {
        console.error('Error fetching historical rates:', err);
      } finally {
        setFetchingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const renderHistoricalChart = () => {
    if (fetchingHistory) return null;
    if (historicalData.length === 0) return null;

    // Process data for the chart
    // We group by timestamp and have gold/silver values
    const chartDataMap = new Map<string, any>();
    historicalData.forEach(item => {
      const date = new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      if (!chartDataMap.has(date)) {
        chartDataMap.set(date, { date });
      }
      const entry = chartDataMap.get(date);
      if (item.type === 'gold') entry.gold = item.ask;
      if (item.type === 'silver') entry.silver = item.ask;
    });

    const chartData = Array.from(chartDataMap.values());

    return (
      <div className="mb-8 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 shadow-xl backdrop-blur-sm p-6">
        <div className="mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-400" />
          <h2 className="text-xl font-semibold text-zinc-100">Historical Rates (Last 7 Days)</h2>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="date" 
                stroke="#71717a" 
                fontSize={10}
                tickFormatter={(val) => val.split(',')[0]} // Show only date on X axis for clarity
              />
              <YAxis stroke="#71717a" fontSize={10} domain={['auto', 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Legend />
              <Line type="monotone" dataKey="gold" stroke="#fbbf24" name="Gold" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="silver" stroke="#94a3b8" name="Silver" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderTable = (title: string, rates: RateItem[], type: 'gold' | 'silver') => {
    if (loading) return null;
    const visibleRates = rates.filter(r => config.itemVisibility[r.id] !== false);
    
    if (visibleRates.length === 0) return null;

    return (
      <div className="mb-8 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 shadow-xl backdrop-blur-sm">
        <div className="border-b border-white/10 bg-zinc-800/50 px-6 py-4">
          <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-800/30 text-xs uppercase text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium text-right">Live Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {visibleRates.map((rate) => {
                  return (
                    <motion.tr
                      key={rate.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-zinc-200">
                        {rate.name}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <PriceFlash price={rate.ask} defaultColor="text-emerald-400" />
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Live Bullion Rates</h1>
            <p className="mt-1 text-sm text-zinc-400">Real-time gold and silver prices</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              Live Updates
            </div>
            {lastUpdated && (
              <span className="text-xs text-zinc-500 font-mono">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </header>

        {error && (
          <div className="mb-8 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {!error && goldRates.length === 0 && silverRates.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl border border-white/5 bg-zinc-900/20">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm text-zinc-400">Connecting to live feed...</p>
          </div>
        )}

        {(goldRates.length > 0 || silverRates.length > 0) && (
          <div className="space-y-8">
            {renderHistoricalChart()}
            {renderTable('Gold', goldRates, 'gold')}
            {renderTable('Silver', silverRates, 'silver')}
          </div>
        )}
      </div>
    </div>
  );
}
