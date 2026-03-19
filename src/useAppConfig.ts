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

  const fetchConfig = () => {
    fetch('/api/settings', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setConfig({ ...defaultConfig, ...data });
        }
      })
      .catch((e) => {
        console.error('Failed to fetch config from API', e);
      });
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const updateConfig = (updates: Partial<AppConfig>) => {
    setConfig((prevConfig) => {
      const newConfig = { ...prevConfig, ...updates };
      
      // Save to API
      fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
        cache: 'no-store',
      }).catch((e) => console.error('Failed to save config to API', e));
      
      return newConfig;
    });
  };

  return { config, updateConfig };
}
