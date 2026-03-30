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

  const isUp = flash === 'up';
  const isDown = flash === 'down';

  const containerClass = `inline-flex items-center justify-end gap-3 px-4 py-2 rounded-lg transition-all duration-300 min-w-[160px] ${
    isUp ? 'bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] border border-emerald-500/30' :
    isDown ? 'bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)] border border-red-500/30' :
    'bg-zinc-800/40 border border-white/5'
  }`;
  
  const textClass = `text-xl font-mono font-bold tracking-tight transition-colors duration-300 ${
    isUp ? 'text-emerald-400' :
    isDown ? 'text-red-400' :
    defaultColor
  }`;
  
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const iconColor = isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-zinc-700';

  return (
    <div className={containerClass}>
      <span className={textClass}>
        ₹{price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </span>
      <Icon className={`w-5 h-5 ${iconColor} transition-colors duration-300`} />
    </div>
  );
}
