import React from 'react';

interface AnalyticsProps {
  data: any[];
}

export function AnalyticsDashboard({ data }: AnalyticsProps) {
  if (!data || data.length === 0) return null;

  const latest = data[data.length - 1];
  const first = data[0];
  const priceChange = latest.close - first.close;
  const percentChange = (priceChange / first.close) * 100;
  
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);
  
  // Simple volatility (range / average price)
  const volatility = ((maxHigh - minLow) / ((maxHigh + minLow) / 2)) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <div className="bg-zinc-800 p-4 rounded-lg">
        <h3 className="text-zinc-400 text-sm">Period Change</h3>
        <p className={`text-2xl font-bold ${percentChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {percentChange.toFixed(2)}%
        </p>
      </div>
      <div className="bg-zinc-800 p-4 rounded-lg">
        <h3 className="text-zinc-400 text-sm">High / Low</h3>
        <p className="text-xl font-bold text-zinc-100">
          {maxHigh.toFixed(2)} / {minLow.toFixed(2)}
        </p>
      </div>
      <div className="bg-zinc-800 p-4 rounded-lg">
        <h3 className="text-zinc-400 text-sm">Volatility</h3>
        <p className="text-2xl font-bold text-zinc-100">
          {volatility.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}
