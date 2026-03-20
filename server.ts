import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Firebase
const firebaseConfigPath = path.resolve('./firebase-applet-config.json');
let db: any = null;

try {
  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
  } else {
    console.warn('firebase-applet-config.json not found. Firebase will not be initialized in server.');
  }
} catch (error) {
  console.error('Error initializing Firebase in server:', error);
}

// Helper functions for parsing rates
function extractWeight(name: string): number {
  const match = name.match(/(\d+(?:\.\d+)?)\s*(kg|gm|g|mg)/i);
  if (match) {
    const val = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === 'kg') return val * 1000;
    if (unit === 'mg') return val / 1000;
    return val;
  }
  return 1;
}

function parseRates(text: string, type: 'gold' | 'silver'): any[] {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  return lines.map(line => {
    const parts = line.split('\t');
    let name = parts[2] || '';
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

async function getSettingsFromFirebase() {
  const defaultConfig = {
    goldCommPerGram: 0,
    silverCommPerGram: 0,
    itemCommissions: {},
    itemVisibility: {},
    socketKeys: [],
  };

  if (!db) return defaultConfig;

  try {
    const docRef = doc(db, 'settings/global');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...defaultConfig, ...docSnap.data() };
    }
  } catch (error) {
    console.error('Error fetching settings from Firebase:', error);
  }
  return defaultConfig;
}

async function startServer() {
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    
    // Get current config from database
    const config = await getSettingsFromFirebase();
    const validKeys = config.socketKeys || [];
    
    // Fallback to environment variable if no keys are in the database
    const envSecretKey = process.env.SOCKET_SECRET_KEY;
    
    if (validKeys.length === 0 && !envSecretKey) {
      console.warn('WARNING: No socket keys configured. Socket connections are unsecured.');
      return next();
    }

    if (validKeys.includes(token) || (envSecretKey && token === envSecretKey)) {
      next();
    } else {
      console.log('Socket connection rejected: Invalid token');
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Broadcast live rates every 2 seconds
  setInterval(async () => {
    try {
      const [goldRes, silverRes] = await Promise.all([
        fetch('https://bcast.elitegold.net:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/elite'),
        fetch('https://bcast.elitegold.net:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/elitesilvercoin')
      ]);

      if (goldRes.ok && silverRes.ok) {
        const goldText = await goldRes.text();
        const silverText = await silverRes.text();

        const rawGoldRates = parseRates(goldText, 'gold');
        const rawSilverRates = parseRates(silverText, 'silver');

        // Apply config
        const config = await getSettingsFromFirebase();

        const processRates = (rates: any[], type: 'gold' | 'silver') => {
          return rates
            .filter(r => config.itemVisibility[r.id] !== false)
            .map(r => {
              const baseCommPerGram = type === 'gold' ? config.goldCommPerGram : config.silverCommPerGram;
              const itemCommPerGram = config.itemCommissions[r.id] !== undefined 
                ? config.itemCommissions[r.id] 
                : baseCommPerGram;
              
              const totalCommission = itemCommPerGram * r.weight;
              return {
                ...r,
                ask: r.ask + totalCommission,
                bid: r.bid + totalCommission,
                high: r.high + totalCommission,
                low: r.low + totalCommission,
              };
            });
        };

        const processedGold = processRates(rawGoldRates, 'gold');
        const processedSilver = processRates(rawSilverRates, 'silver');

        io.emit('rates', {
          goldRates: processedGold,
          silverRates: processedSilver,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching or broadcasting rates:', error);
    }
  }, 2000);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
