import React, { useState } from 'react';
import { useLiveRates, RateItem } from '../useLiveRates';
import { useAppConfig } from '../useAppConfig';
import { Settings, RefreshCw, AlertCircle, Eye, EyeOff, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { PriceFlash } from '../components/PriceFlash';

export default function AdminView() {
  const { goldRates, silverRates, error, lastUpdated } = useLiveRates();
  const { config, updateConfig, loading } = useAppConfig();
  const [showSettings, setShowSettings] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('eliteGoldAdminAuth');
    navigate('/admin/login');
  };

  const updateItemCommission = (id: string, value: number) => {
    updateConfig({
      itemCommissions: { ...config.itemCommissions, [id]: value }
    });
  };

  const toggleVisibility = (id: string) => {
    const current = config.itemVisibility[id] ?? true;
    updateConfig({
      itemVisibility: { ...config.itemVisibility, [id]: !current }
    });
  };

  const renderTable = (title: string, rates: RateItem[], type: 'gold' | 'silver') => {
    if (loading || rates.length === 0) return null;

    return (
      <div className="mb-8 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 shadow-xl backdrop-blur-sm">
        <div className="border-b border-white/10 bg-zinc-800/50 px-6 py-4">
          <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-800/30 text-xs uppercase text-zinc-400">
              <tr>
                <th className="px-4 py-4 font-medium">Product</th>
                <th className="px-4 py-4 font-medium text-right">Base Ask</th>
                <th className="px-4 py-4 font-medium text-right">Final Sell (Ask)</th>
                <th className="px-4 py-4 font-medium text-right">Margin/gm (₹)</th>
                <th className="px-4 py-4 font-medium text-center">Visible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {rates.map((rate) => {
                  const isVisible = config.itemVisibility[rate.id] ?? true;
                  const baseCommPerGram = type === 'gold' ? config.goldCommPerGram : config.silverCommPerGram;
                  
                  const itemCommPerGram = config.itemCommissions[rate.id] !== undefined 
                    ? config.itemCommissions[rate.id] 
                    : baseCommPerGram;

                  const totalCommission = itemCommPerGram * rate.weight;
                  const finalAsk = rate.ask + totalCommission;

                  return (
                    <motion.tr
                      key={rate.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isVisible ? 1 : 0.4 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-4 py-4 font-medium text-zinc-200">
                        {rate.name}
                        {rate.weight !== 1 && (
                          <span className="ml-2 text-xs text-zinc-500">({rate.weight}g)</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-zinc-500">
                        ₹{rate.ask.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <PriceFlash price={finalAsk} defaultColor="text-red-400" />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <input
                          type="number"
                          min="0"
                          value={config.itemCommissions[rate.id] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              const newComms = { ...config.itemCommissions };
                              delete newComms[rate.id];
                              updateConfig({ itemCommissions: newComms });
                            } else {
                              updateItemCommission(rate.id, parseFloat(val) || 0);
                            }
                          }}
                          placeholder={baseCommPerGram.toString()}
                          className="w-20 rounded-md border border-white/10 bg-zinc-800 px-2 py-1.5 text-right text-sm text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => toggleVisibility(rate.id)}
                          className={`p-1.5 rounded-md transition-colors ${
                            isVisible ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-zinc-500 hover:bg-zinc-500/10'
                          }`}
                          title={isVisible ? "Hide item" : "Show item"}
                        >
                          {isVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
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
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-400">Manage rates, margins, and visibility</p>
          </div>
          <div className="flex items-center gap-4">
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
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`rounded-lg p-2 transition-colors ${
                showSettings ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
              title="Toggle Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4 sm:p-6"
            >
              <h3 className="text-lg font-medium text-indigo-300 mb-4">Global Margins</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-indigo-200 mb-1">Gold Margin (per gram)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={config.goldCommPerGram || ''}
                      onChange={(e) => updateConfig({ goldCommPerGram: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full rounded-lg border border-indigo-500/30 bg-zinc-900/50 py-2 pl-8 pr-3 text-sm text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-indigo-200 mb-1">Silver Margin (per gram)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={config.silverCommPerGram || ''}
                      onChange={(e) => updateConfig({ silverCommPerGram: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full rounded-lg border border-indigo-500/30 bg-zinc-900/50 py-2 pl-8 pr-3 text-sm text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
            {renderTable('Gold Rates', goldRates, 'gold')}
            {renderTable('Silver Rates', silverRates, 'silver')}
          </div>
        )}
      </div>
    </div>
  );
}
