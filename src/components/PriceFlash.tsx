import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceFlashProps {
  price: number;
  defaultColor?: string;
}

export function PriceFlash({ price, defaultColor = 'text-zinc-100' }: PriceFlashProps) {
  const prevPriceRef = useRef(price);
  const [flash, setFlash] = useState<'up' | 'down' | 'none'>('none');

  useEffect(() => {
    if (prevPriceRef.current !== 0 && price !== prevPriceRef.current) {
      setFlash(price > prevPriceRef.current ? 'up' : 'down');
      const timer = setTimeout(() => setFlash('none'), 1500);
      prevPriceRef.current = price;
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = price;
  }, [price]);

  let containerClass = 'inline-flex items-center justify-end gap-3 px-4 py-2 rounded-lg transition-all duration-300 min-w-[160px] ';
  let textClass = 'text-xl font-mono font-bold tracking-tight transition-colors duration-300 ';
  let Icon = Minus;
  let iconColor = 'text-zinc-700'; // subtle when not flashing

  if (flash === 'up') {
    containerClass += 'bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] border border-emerald-500/30';
    textClass += 'text-emerald-400';
    Icon = TrendingUp;
    iconColor = 'text-emerald-400';
  } else if (flash === 'down') {
    containerClass += 'bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)] border border-red-500/30';
    textClass += 'text-red-400';
    Icon = TrendingDown;
    iconColor = 'text-red-400';
  } else {
    containerClass += 'bg-zinc-800/40 border border-white/5';
    textClass += defaultColor;
  }

  return (
    <div className={containerClass}>
      <span className={textClass}>
        ₹{price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </span>
      <Icon className={`w-5 h-5 ${iconColor} transition-colors duration-300`} />
    </div>
  );
}
