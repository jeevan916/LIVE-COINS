import React, { useState, useMemo } from 'react';
import { RateItem } from '../useLiveRates';

interface JewelleryCalculatorProps {
  goldRates: RateItem[];
  silverRates: RateItem[];
}

export function JewelleryCalculator({ goldRates, silverRates }: JewelleryCalculatorProps) {
  const [metal, setMetal] = useState<'gold' | 'silver'>('gold');
  const [purity, setPurity] = useState<number>(0.916); // Default 22K Gold
  const [weight, setWeight] = useState<string>('10');
  const [makingChargeType, setMakingChargeType] = useState<'percent' | 'perGram'>('percent');
  const [makingCharge, setMakingCharge] = useState<string>('8');
  const [gst, setGst] = useState<string>('3');

  // Calculate base 1gm rate from the first available rate of the selected metal
  const baseRatePerGram = useMemo(() => {
    const rates = metal === 'gold' ? goldRates : silverRates;
    if (!rates || rates.length === 0) return 0;
    
    // Use the first item as the benchmark (usually the main 24K or 999 item)
    const benchmark = rates[0];
    return benchmark.ask / benchmark.weight;
  }, [metal, goldRates, silverRates]);

  const calculations = useMemo(() => {
    const numWeight = parseFloat(weight) || 0;
    const numMakingCharge = parseFloat(makingCharge) || 0;
    const numGst = parseFloat(gst) || 0;

    const metalRatePerGram = baseRatePerGram * purity;
    const totalMetalValue = metalRatePerGram * numWeight;
    
    let makingChargesAmount = 0;
    if (makingChargeType === 'percent') {
      makingChargesAmount = totalMetalValue * (numMakingCharge / 100);
    } else {
      makingChargesAmount = numMakingCharge * numWeight;
    }

    const subTotal = totalMetalValue + makingChargesAmount;
    const gstAmount = subTotal * (numGst / 100);
    const grandTotal = subTotal + gstAmount;

    return {
      metalRatePerGram,
      totalMetalValue,
      makingChargesAmount,
      subTotal,
      gstAmount,
      grandTotal
    };
  }, [baseRatePerGram, purity, weight, makingCharge, makingChargeType, gst]);

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 shadow-xl backdrop-blur-sm">
      <div className="border-b border-white/10 bg-zinc-800/50 px-6 py-4">
        <h2 className="text-xl font-semibold text-zinc-100">Live Jewellery Calculator</h2>
        <p className="text-sm text-zinc-400 mt-1">Calculate estimated jewellery prices based on real-time market rates.</p>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Metal & Purity Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Metal</label>
            <div className="flex rounded-lg bg-zinc-800/50 p-1 border border-white/5">
              <button
                onClick={() => { setMetal('gold'); setPurity(0.916); }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${metal === 'gold' ? 'bg-yellow-500/20 text-yellow-500' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Gold
              </button>
              <button
                onClick={() => { setMetal('silver'); setPurity(0.999); }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${metal === 'silver' ? 'bg-zinc-300/20 text-zinc-300' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Silver
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Purity</label>
            <select
              value={purity}
              onChange={(e) => setPurity(parseFloat(e.target.value))}
              className="w-full rounded-lg border border-white/10 bg-zinc-800/50 px-3 py-2.5 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
            >
              {metal === 'gold' ? (
                <>
                  <option value={1.000}>24K (99.9%)</option>
                  <option value={0.916}>22K (91.6%)</option>
                  <option value={0.750}>18K (75.0%)</option>
                  <option value={0.583}>14K (58.3%)</option>
                </>
              ) : (
                <>
                  <option value={0.999}>Fine Silver (99.9%)</option>
                  <option value={0.925}>Sterling Silver (92.5%)</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Weight & Making Charges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Weight (Grams)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. 10"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-medium text-zinc-300">Making Charges</label>
              <div className="flex items-center space-x-2 text-xs">
                <button 
                  onClick={() => setMakingChargeType('percent')}
                  className={`${makingChargeType === 'percent' ? 'text-indigo-400' : 'text-zinc-500'}`}
                >%</button>
                <span className="text-zinc-600">|</span>
                <button 
                  onClick={() => setMakingChargeType('perGram')}
                  className={`${makingChargeType === 'perGram' ? 'text-indigo-400' : 'text-zinc-500'}`}
                >₹/gm</button>
              </div>
            </div>
            <div className="relative">
              {makingChargeType === 'perGram' && <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">₹</span>}
              <input
                type="number"
                min="0"
                step="0.1"
                value={makingCharge}
                onChange={(e) => setMakingCharge(e.target.value)}
                className={`w-full rounded-lg border border-white/10 bg-zinc-800/50 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${makingChargeType === 'perGram' ? 'pl-7 pr-3' : 'px-3'}`}
                placeholder={makingChargeType === 'percent' ? "e.g. 8" : "e.g. 500"}
              />
              {makingChargeType === 'percent' && <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500">%</span>}
            </div>
          </div>
        </div>

        {/* GST */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">GST (%)</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.1"
              value={gst}
              onChange={(e) => setGst(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500">%</span>
          </div>
        </div>

        {/* Results */}
        <div className="mt-8 rounded-xl bg-zinc-950/50 p-5 border border-white/5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Live Base Rate (24K/999)</span>
            <span className="text-zinc-200 font-mono">₹{baseRatePerGram.toLocaleString('en-IN', { maximumFractionDigits: 2 })} /gm</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Applied Rate ({purity * 100}%)</span>
            <span className="text-zinc-200 font-mono">₹{calculations.metalRatePerGram.toLocaleString('en-IN', { maximumFractionDigits: 2 })} /gm</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Metal Value</span>
            <span className="text-zinc-200 font-mono">₹{calculations.totalMetalValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Making Charges</span>
            <span className="text-zinc-200 font-mono">+ ₹{calculations.makingChargesAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">GST ({gst}%)</span>
            <span className="text-zinc-200 font-mono">+ ₹{calculations.gstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          
          <div className="pt-3 mt-3 border-t border-white/10 flex justify-between items-end">
            <span className="text-base font-medium text-zinc-300">Estimated Total</span>
            <span className="text-2xl font-bold text-emerald-400 font-mono">₹{calculations.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
        
        <p className="text-xs text-zinc-500 text-center mt-4">
          * This is an estimate based on live market rates. Final showroom prices may vary slightly due to rounding and specific item designs.
        </p>
      </div>
    </div>
  );
}
