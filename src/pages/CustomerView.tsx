import React, { useState } from 'react';
import { useLiveRates, RateItem } from '../useLiveRates';
import { RefreshCw, AlertCircle, Calculator, TrendingUp } from 'lucide-react';
import { PriceFlash } from '../components/PriceFlash';
import { JewelleryCalculator } from '../components/JewelleryCalculator';
import { RateDetails } from '../components/RateDetails';

export default function CustomerView() {
  const { goldRates, silverRates, error, lastUpdated } = useLiveRates();
  const [activeTab, setActiveTab] = useState<'rates' | 'calculator'>('rates');
  const [selectedRate, setSelectedRate] = useState<RateItem | null>(null);

const renderTable = (title: string, rates: RateItem[], type: 'gold' | 'silver') => {
  if (rates.length === 0) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 shadow-xl backdrop-blur-sm">
      <div className="border-b border-white/10 bg-zinc-800/50 px-6 py-4">
        <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
      </div>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-zinc-800/30 text-xs uppercase text-zinc-400">
            <tr>
              <th className="px-6 py-4 font-medium">Product</th>
              <th className="px-6 py-4 font-medium text-right">Live Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rates.map((rate) => (
              <tr
                key={rate.id}
                onClick={() => setSelectedRate(rate)}
                className="hover:bg-zinc-800/30 transition-colors cursor-pointer"
              >
                <td className="px-6 py-4 font-medium text-zinc-200">
                  {rate.name}
                </td>
                <td className="px-6 py-4 text-right">
                  <PriceFlash price={rate.ask} defaultColor="text-emerald-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30">
      {selectedRate && (
        <RateDetails 
          rate={selectedRate} 
          allRates={[...goldRates, ...silverRates]} 
          onClose={() => setSelectedRate(null)} 
        />
      )}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Bullion Rates kalyan</h1>
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

        {/* Tabs */}
        <div className="mb-8 flex space-x-2 rounded-lg bg-zinc-900/50 p-1 border border-white/5 w-fit">
          <button
            onClick={() => setActiveTab('rates')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'rates' 
                ? 'bg-indigo-500 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Live Rates
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'calculator' 
                ? 'bg-indigo-500 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Jewellery Calculator
          </button>
        </div>

        {!error && goldRates.length === 0 && silverRates.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl border border-white/5 bg-zinc-900/20">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm text-zinc-400">Connecting to live feed...</p>
          </div>
        )}

        {activeTab === 'rates' && (goldRates.length > 0 || silverRates.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {renderTable('Gold Coins', goldRates, 'gold')}
            {renderTable('Silver Coins', silverRates, 'silver')}
          </div>
        )}

        {activeTab === 'calculator' && (goldRates.length > 0 || silverRates.length > 0) && (
          <JewelleryCalculator goldRates={goldRates} silverRates={silverRates} />
        )}
      </div>
    </div>
  );
}
