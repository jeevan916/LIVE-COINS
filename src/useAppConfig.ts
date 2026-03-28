import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface AppConfig {
  goldCommPerGram: number;
  silverCommPerGram: number;
  itemCommissions: Record<string, number>;
  itemVisibility: Record<string, boolean>;
  socketKeys: string[];
}

export const defaultConfig: AppConfig = {
  goldCommPerGram: 0,
  silverCommPerGram: 0,
  itemCommissions: {},
  itemVisibility: {},
  socketKeys: [],
};

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`/api/settings?t=${Date.now()}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch settings: ${res.status} ${res.statusText} - ${text.substring(0, 100)}`);
      }
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
         const text = await res.text();
         throw new Error(`Expected JSON but received ${contentType}: ${text.substring(0, 100)}`);
      }

      const data = await res.json();
      setConfig({ ...defaultConfig, ...data });
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();

    // Setup real-time updates via Socket.IO
    const socket: Socket = io();
    
    socket.on('config_updated', () => {
      console.log('Config updated event received, refetching...');
      fetchConfig();
    });

    // Still keep a slow poll as fallback (every 30 seconds instead of 5)
    const interval = setInterval(fetchConfig, 30000);

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, [fetchConfig]);

  const updateConfig = async (updates: Partial<AppConfig>) => {
    const newConfig = { ...config, ...updates };
    // Optimistic update
    setConfig(newConfig);
    
    try {
      const adminPass = localStorage.getItem('eliteGoldAdminAuth');
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': adminPass || ''
        },
        body: JSON.stringify(newConfig)
      });
      
      if (!res.ok) {
        throw new Error('Failed to update settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      // Revert on failure
      setConfig(config);
    }
  };

  return { config, updateConfig, loading };
}
