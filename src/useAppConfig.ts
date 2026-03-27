import { useState, useEffect } from 'react';

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

  if (error) {
    throw error;
  }

  useEffect(() => {
    let isMounted = true;
    
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/settings');
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
        if (isMounted) {
          setConfig({ ...defaultConfig, ...data });
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    };

    fetchConfig();
    
    // Poll for updates every 5 seconds to keep it somewhat real-time
    const interval = setInterval(fetchConfig, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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
