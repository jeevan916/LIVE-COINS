import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export interface RateItem {
  id: string;
  name: string;
  bid: number;
  ask: number;
  rawBid?: number;
  rawAsk?: number;
  high: number;
  low: number;
  weight: number;
  type: 'gold' | 'silver';
}

export function useLiveRates() {
  const [goldRates, setGoldRates] = useState<RateItem[]>([]);
  const [silverRates, setSilverRates] = useState<RateItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    // Connect to the same host that served the page
    const socket: Socket = io({
      auth: {
        token: localStorage.getItem('eliteGoldSocketToken') || ''
      }
    });

    socket.on('connect', () => {
      console.log('Connected to live rates socket');
      setError(null);
    });

    socket.on('rates', (data: { goldRates: RateItem[]; silverRates: RateItem[]; timestamp: string }) => {
      setGoldRates(data.goldRates);
      setSilverRates(data.silverRates);
      setLastUpdated(new Date(data.timestamp));
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError(`Connection error: ${err.message}`);
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
      setError(`Socket error: ${err.message}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { goldRates, silverRates, error, lastUpdated };
}
