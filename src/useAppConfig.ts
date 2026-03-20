import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

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

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = 'settings/global';
    const docRef = doc(db, path);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setConfig({ ...defaultConfig, ...docSnap.data() } as AppConfig);
      } else {
        // Initialize if not exists
        setDoc(docRef, defaultConfig).catch((e) => handleFirestoreError(e, OperationType.WRITE, path));
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateConfig = (updates: Partial<AppConfig>) => {
    setConfig((prevConfig) => {
      const newConfig = { ...prevConfig, ...updates };
      
      // Save to Firestore
      const path = 'settings/global';
      const docRef = doc(db, path);
      setDoc(docRef, newConfig, { merge: true }).catch((e) => 
        handleFirestoreError(e, OperationType.WRITE, path)
      );
      
      return newConfig;
    });
  };

  return { config, updateConfig, loading };
}
