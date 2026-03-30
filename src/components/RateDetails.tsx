import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries, CrosshairMode, LineSeries } from 'lightweight-charts';
import { X } from 'lucide-react';
import { calculateRSI, calculateMACD } from '../lib/indicators';
import { AnalyticsDashboard } from './AnalyticsDashboard';

interface RateDetailsProps {
  rate: { id: string; name: string };
  allRates: { id: string; name: string }[];
  onClose: () => void;
}

export function RateDetails({ rate, allRates, onClose }: RateDetailsProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const comparisonSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  
  const [interval, setInterval] = useState<'1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w'>('15m');
  const [loading, setLoading] = useState(true);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [comparisonSymbol, setComparisonSymbol] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    try {
        const candlestickSeries = chart.addSeries(CandlestickSeries, { 
            upColor: '#10b981', 
            downColor: '#ef4444', 
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
        });
        
        const comparisonSeries = chart.addSeries(LineSeries, { 
            color: '#eab308', 
            lineWidth: 2,
            title: 'Comparison',
            visible: false
        });

        const rsiSeries = chart.addSeries(LineSeries, { 
            color: '#a855f7', 
            lineWidth: 2,
            title: 'RSI 14',
            visible: false
        });
        
        const macdSeries = chart.addSeries(LineSeries, { 
            color: '#f59e0b', 
            lineWidth: 2,
            title: 'MACD',
            visible: false
        });
        
        chartRef.current = chart;
        candlestickSeriesRef.current = candlestickSeries;
        comparisonSeriesRef.current = comparisonSeries;
        rsiSeriesRef.current = rsiSeries;
        macdSeriesRef.current = macdSeries;
    } catch (e) {
        console.error('Failed to add series:', e);
    }

    const resizeObserver = new ResizeObserver(entries => {
        if (entries.length === 0 || !entries[0].contentRect) return;
        const { width } = entries[0].contentRect;
        chart.applyOptions({ width });
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!candlestickSeriesRef.current || !rsiSeriesRef.current || !macdSeriesRef.current || !comparisonSeriesRef.current) return;

    setLoading(true);
    
    const fetchPromises = [
        fetch(`/api/historical-rates?symbol=${rate.id}&range=30&interval=${interval}`).then(res => res.json())
    ];

    if (comparisonSymbol) {
        fetchPromises.push(fetch(`/api/historical-rates?symbol=${comparisonSymbol}&range=30&interval=${interval}`).then(res => res.json()));
    }

    Promise.all(fetchPromises)
      .then(([data, comparisonData]) => {
        const candlestickData = data.map((d: any) => ({ 
            time: new Date(d.time_bucket).getTime() / 1000, 
            open: parseFloat(d.open),
            high: parseFloat(d.high),
            low: parseFloat(d.low),
            close: parseFloat(d.close)
        }));

        const closePrices = candlestickData.map((d: any) => d.close);
        
        // RSI
        const rsiData = calculateRSI(closePrices).map((val, i) => ({
            time: candlestickData[i].time,
            value: val
        })).filter((d: any) => d.value !== null);
        
        // MACD
        const { macd } = calculateMACD(closePrices);
        const macdData = macd.map((val, i) => ({
            time: candlestickData[i].time,
            value: val
        })).filter((d: any) => d.value !== null);

        candlestickSeriesRef.current?.setData(candlestickData);
        rsiSeriesRef.current?.setData(rsiData);
        macdSeriesRef.current?.setData(macdData);
        
        if (comparisonData) {
            const comparisonLineData = comparisonData.map((d: any) => ({
                time: new Date(d.time_bucket).getTime() / 1000,
                value: parseFloat(d.close)
            }));
            comparisonSeriesRef.current?.setData(comparisonLineData);
            comparisonSeriesRef.current?.applyOptions({ visible: true });
        } else {
            comparisonSeriesRef.current?.applyOptions({ visible: false });
        }

        setHistoricalData(candlestickData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching historical rates:', err);
        setLoading(false);
      });
  }, [rate.id, interval, comparisonSymbol]);

  useEffect(() => {
      rsiSeriesRef.current?.applyOptions({ visible: showRSI });
      macdSeriesRef.current?.applyOptions({ visible: showMACD });
  }, [showRSI, showMACD]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-zinc-900 rounded-xl border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{rate.name} - 30 Day History</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {(['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'] as const).map((i) => (
            <button
              key={i}
              onClick={() => setInterval(i)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                interval === i ? 'bg-indigo-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {i.toUpperCase()}
            </button>
          ))}
          <div className="h-6 w-px bg-zinc-700 mx-2" />
          <select
            value={comparisonSymbol || ''}
            onChange={(e) => setComparisonSymbol(e.target.value || null)}
            className="bg-zinc-800 text-zinc-300 text-xs rounded-md px-2 py-1.5 border border-zinc-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Compare with...</option>
            {allRates.filter(r => r.id !== rate.id).map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <div className="h-6 w-px bg-zinc-700 mx-2" />
          <button
            onClick={() => setShowRSI(!showRSI)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              showRSI ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            RSI
          </button>
          <button
            onClick={() => setShowMACD(!showMACD)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              showMACD ? 'bg-amber-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            MACD
          </button>
        </div>

        <div ref={chartContainerRef} className="h-[400px] w-full relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 text-zinc-500 z-10">Loading chart...</div>
          )}
        </div>
        
        <AnalyticsDashboard data={historicalData} />
      </div>
    </div>
  );
}
