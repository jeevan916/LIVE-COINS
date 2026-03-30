import React, { useState, useEffect } from 'react';
import { useLiveRates, RateItem } from '../useLiveRates';
import { useAppConfig } from '../useAppConfig';
import { Settings, RefreshCw, AlertCircle, Eye, EyeOff, LogOut, Key, Trash2, Plus, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { PriceFlash } from '../components/PriceFlash';

const BlurInput = ({ value, onChange, placeholder, className }: { value: number | string, onChange: (val: number | string) => void, placeholder?: string, className?: string }) => {
  const [localValue, setLocalValue] = useState(value?.toString() || '');

  useEffect(() => {
    setLocalValue(value?.toString() || '');
  }, [value]);

  const handleBlur = () => {
    if (localValue === '') {
      onChange('');
    } else {
      const parsed = parseFloat(localValue);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    }
  };

  return (
    <input
      type="number"
      min="0"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default function AdminView() {
  const { goldRates, silverRates, error, lastUpdated } = useLiveRates();
  const { config, updateConfig, loading } = useAppConfig();
  const [showSettings, setShowSettings] = useState(true);
  const [newKey, setNewKey] = useState('');
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; error?: string; code?: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setDbStatus({ 
          connected: data.dbConnected, 
          error: data.error,
          code: data.code
        });
      } catch (err) {
        setDbStatus({ connected: false, error: 'Failed to reach health endpoint' });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

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

  const addSocketKey = () => {
    if (!newKey.trim()) return;
    const currentKeys = config.socketKeys || [];
    if (!currentKeys.includes(newKey.trim())) {
      updateConfig({
        socketKeys: [...currentKeys, newKey.trim()]
      });
    }
    setNewKey('');
  };

  const removeSocketKey = (keyToRemove: string) => {
    const currentKeys = config.socketKeys || [];
    updateConfig({
      socketKeys: currentKeys.filter(k => k !== keyToRemove)
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
                  
                  const baseAsk = rate.rawAsk ?? rate.ask;
                  const finalAsk = rate.ask;

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
                        ₹{baseAsk.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <PriceFlash price={finalAsk} defaultColor="text-red-400" />
                      </td>
                      <td className="px-4 py-4 text-right">
                      <BlurInput
                        value={config.itemCommissions[rate.id] ?? ''}
                        onChange={(val) => {
                          if (val === '') {
                            const newComms = { ...config.itemCommissions };
                            delete newComms[rate.id];
                            updateConfig({ itemCommissions: newComms });
                          } else {
                            updateItemCommission(rate.id, val as number);
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
            <h1 className="text-3xl font-bold tracking-tight text-white">Bullion Rates kalyan Admin</h1>
            <p className="mt-1 text-sm text-zinc-400">Manage rates, margins, and visibility</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-2">
              {dbStatus && (
                <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border ${
                  dbStatus.connected 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  <Database className="w-3 h-3" />
                  {dbStatus.connected ? 'DB Connected' : 'DB Error'}
                </div>
              )}
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
                    <BlurInput
                      value={config.goldCommPerGram || ''}
                      onChange={(val) => updateConfig({ goldCommPerGram: val === '' ? 0 : (val as number) })}
                      placeholder="0"
                      className="w-full rounded-lg border border-indigo-500/30 bg-zinc-900/50 py-2 pl-8 pr-3 text-sm text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-indigo-200 mb-1">Silver Margin (per gram)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">₹</span>
                    <BlurInput
                      value={config.silverCommPerGram || ''}
                      onChange={(val) => updateConfig({ silverCommPerGram: val === '' ? 0 : (val as number) })}
                      placeholder="0"
                      className="w-full rounded-lg border border-indigo-500/30 bg-zinc-900/50 py-2 pl-8 pr-3 text-sm text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-indigo-500/20 pt-6">
                <h3 className="text-lg font-medium text-indigo-300 mb-4 flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Keys (Socket Authentication)
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="Enter a new secure key..."
                      className="flex-1 rounded-lg border border-indigo-500/30 bg-zinc-900/50 py-2 px-3 text-sm text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      onKeyDown={(e) => e.key === 'Enter' && addSocketKey()}
                    />
                    <button
                      onClick={addSocketKey}
                      disabled={!newKey.trim()}
                      className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Key
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {config.socketKeys && config.socketKeys.length > 0 ? (
                      config.socketKeys.map((key, index) => (
                        <div key={index} className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-900/50 px-4 py-3">
                          <code className="text-sm text-emerald-400 font-mono">{key}</code>
                          <button
                            onClick={() => removeSocketKey(key)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                            title="Remove Key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-500 italic">No keys configured. Anyone can connect or fallback to environment variable.</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {dbStatus && !dbStatus.connected && (
          <div className="mb-8 flex flex-col gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-bold">CRITICAL: Database Connection Failed</p>
            </div>
            <div className="ml-8 text-xs font-mono opacity-80">
              <p>Error: {dbStatus.error}</p>
              {dbStatus.code && <p>Code: {dbStatus.code}</p>}
              <p className="mt-2 text-zinc-400">Tip: Check your DB_HOST, DB_USER, and DB_PASSWORD in Hostinger's Node.js settings.</p>
            </div>
          </div>
        )}

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
