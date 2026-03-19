import { useState, useEffect } from 'react';

export interface AppConfig {
  goldCommPerGram: number;
  silverCommPerGram: number;
  itemCommissions: Record<string, number>;
  itemVisibility: Record<string, boolean>;
}

export const defaultConfig: AppConfig = {
  goldCommPerGram: 0,
  silverCommPerGram: 0,
  itemCommissions: {},
  itemVisibility: {},
};

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);

  useEffect(() => {
    // Fetch from API
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setConfig({ ...defaultConfig, ...data });
        }
      })
      .catch((e) => {
        console.error('Failed to fetch config from API', e);
        // Fallback to localStorage if API fails
        const saved = localStorage.getItem('eliteGoldConfig');
        if (saved) {
          try {
            setConfig({ ...defaultConfig, ...JSON.parse(saved) });
          } catch (err) {
            console.error('Failed to parse local config', err);
          }
        }
      });
  }, []);

  const updateConfig = (updates: Partial<AppConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    
    // Save to API
    fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newConfig),
    }).catch((e) => console.error('Failed to save config to API', e));

    // Also save to localStorage as a backup
    localStorage.setItem('eliteGoldConfig', JSON.stringify(newConfig));
  };

  return { config, updateConfig };
}
