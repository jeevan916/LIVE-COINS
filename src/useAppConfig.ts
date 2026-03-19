import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';

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
    const docRef = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setConfig({ ...defaultConfig, ...docSnap.data() } as AppConfig);
      } else {
        // Initialize if not exists
        setDoc(docRef, defaultConfig);
      }
    }, (error) => {
      console.error('Failed to fetch config from Firestore', error);
    });

    return () => unsubscribe();
  }, []);

  const updateConfig = (updates: Partial<AppConfig>) => {
    setConfig((prevConfig) => {
      const newConfig = { ...prevConfig, ...updates };
      
      // Save to Firestore
      const docRef = doc(db, 'settings', 'global');
      setDoc(docRef, newConfig, { merge: true }).catch((e) => 
        console.error('Failed to save config to Firestore', e)
      );
      
      return newConfig;
    });
  };

  return { config, updateConfig };
}
