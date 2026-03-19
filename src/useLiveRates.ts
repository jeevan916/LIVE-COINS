import { useState, useEffect } from 'react';

export interface RateItem {
  id: string;
  name: string;
  bid: number;
  ask: number;
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
    let isMounted = true;

    const fetchRates = async () => {
      try {
        const [goldRes, silverRes] = await Promise.all([
          fetch('https://bcast.elitegold.net:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/elite'),
          fetch('https://bcast.elitegold.net:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/elitesilvercoin')
        ]);

        if (!goldRes.ok || !silverRes.ok) {
          throw new Error('Failed to fetch rates');
        }

        const goldText = await goldRes.text();
        const silverText = await silverRes.text();

        if (isMounted) {
          setGoldRates(parseRates(goldText, 'gold'));
          setSilverRates(parseRates(silverText, 'silver'));
          setLastUpdated(new Date());
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { goldRates, silverRates, error, lastUpdated };
}

function extractWeight(name: string): number {
  // Matches patterns like "50gm", "1 KG", "200mg", "0.5gm", "1g"
  const match = name.match(/(\d+(?:\.\d+)?)\s*(kg|gm|g|mg)/i);
  if (match) {
    const val = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === 'kg') return val * 1000;
    if (unit === 'mg') return val / 1000;
    return val; // g or gm
  }
  return 1; // Default to 1 multiplier if no weight is found in the name
}

function parseRates(text: string, type: 'gold' | 'silver'): RateItem[] {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  return lines.map(line => {
    const parts = line.split('\t');
    let name = parts[2] || '';
    
    // Remove specific unwanted text
    name = name.replace('(Min.2 Pc.)', '').trim();
    
    return {
      id: parts[1],
      name: name,
      bid: parseFloat(parts[3]) || 0,
      ask: parseFloat(parts[4]) || 0,
      high: parseFloat(parts[5]) || 0,
      low: parseFloat(parts[6]) || 0,
      weight: extractWeight(name),
      type
    };
  }).filter(item => item.id && item.name);
}
