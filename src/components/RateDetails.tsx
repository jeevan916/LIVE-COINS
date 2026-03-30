import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { X } from 'lucide-react';

interface RateDetailsProps {
  rate: { id: string; name: string };
  onClose: () => void;
}

export function RateDetails({ rate, onClose }: RateDetailsProps) {
  const [data, setData] = useState<any[]>([]);
  const [interval, setInterval] = useState<'15m' | '30m' | '1h'>('15m');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/historical-rates?symbol=${rate.id}&range=30&interval=${interval}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching historical rates:', err);
        setLoading(false);
      });
  }, [rate.id, interval]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-zinc-900 rounded-xl border border-white/10 p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{rate.name} - 30 Day History</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {(['15m', '30m', '1h'] as const).map((i) => (
            <button
              key={i}
              onClick={() => setInterval(i)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                interval === i ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {i === '15m' ? '15 Min' : i === '30m' ? '30 Min' : '1 Hour'}
            </button>
          ))}
        </div>

        <div className="h-96 w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-zinc-500">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time_bucket" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#333' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="ask" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="bid" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
