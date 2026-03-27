import dotenv from 'dotenv';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading environment variables from the specific Hostinger path first
const possibleEnvPaths = [
  path.resolve(process.cwd(), 'public_html/.builds/config/.env'),
  path.resolve(process.cwd(), '.builds/config/.env'),
  path.resolve(process.cwd(), '../.builds/config/.env'),
  path.resolve(__dirname, 'public_html/.builds/config/.env'),
  path.resolve(__dirname, '../.builds/config/.env')
];

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`Loaded environment variables from ${envPath}`);
    break;
  }
}

// Fallback to standard .env in the root if the above doesn't exist
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'u477692720_jeevan999coin',
  password: process.env.DB_PASSWORD || 'jeevan@916$',
  database: process.env.DB_NAME || 'u477692720_jeevan999coin',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT PRIMARY KEY,
        goldCommPerGram DECIMAL(10, 2) DEFAULT 0,
        silverCommPerGram DECIMAL(10, 2) DEFAULT 0,
        itemCommissions JSON,
        itemVisibility JSON,
        socketKeys JSON
      )
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
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

async function getSettingsFromDB() {
  const defaultConfig = {
    goldCommPerGram: 0,
    silverCommPerGram: 0,
    itemCommissions: {},
    itemVisibility: {},
    socketKeys: [],
  };

  try {
    const [rows] = await pool.query('SELECT * FROM settings WHERE id = 1');
    if (Array.isArray(rows) && rows.length > 0) {
      const row = rows[0] as any;
      return {
        goldCommPerGram: row.goldCommPerGram || 0,
        silverCommPerGram: row.silverCommPerGram || 0,
        itemCommissions: typeof row.itemCommissions === 'string' ? JSON.parse(row.itemCommissions) : (row.itemCommissions || {}),
        itemVisibility: typeof row.itemVisibility === 'string' ? JSON.parse(row.itemVisibility) : (row.itemVisibility || {}),
        socketKeys: typeof row.socketKeys === 'string' ? JSON.parse(row.socketKeys) : (row.socketKeys || []),
      };
    }
  } catch (error) {
    console.error('Error fetching settings from MySQL:', error);
  }
  return defaultConfig;
}

async function startServer() {
  await initDB();

  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  // API Routes
  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await getSettingsFromDB();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      const authHeader = req.headers['x-admin-password'];
      if (authHeader !== 'jeevan@916$') {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const newSettings = req.body;
      
      // Upsert into MySQL
      const query = `
        INSERT INTO settings (id, goldCommPerGram, silverCommPerGram, itemCommissions, itemVisibility, socketKeys)
        VALUES (1, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          goldCommPerGram = VALUES(goldCommPerGram),
          silverCommPerGram = VALUES(silverCommPerGram),
          itemCommissions = VALUES(itemCommissions),
          itemVisibility = VALUES(itemVisibility),
          socketKeys = VALUES(socketKeys)
      `;
      
      await pool.query(query, [
        newSettings.goldCommPerGram || 0,
        newSettings.silverCommPerGram || 0,
        JSON.stringify(newSettings.itemCommissions || {}),
        JSON.stringify(newSettings.itemVisibility || {}),
        JSON.stringify(newSettings.socketKeys || [])
      ]);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  app.get('/api/rates', async (req, res) => {
    try {
      // Authentication check
      const authHeader = req.headers.authorization;
      const token = authHeader ? authHeader.split(' ')[1] : req.query.key;
      
      const config = await getSettingsFromDB();
      const validKeys = config.socketKeys || [];
      const envSecretKey = process.env.SOCKET_SECRET_KEY;
      
      if (validKeys.length > 0 || envSecretKey) {
        if (!token || (!validKeys.includes(token as string) && token !== envSecretKey)) {
          return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
        }
      }

      const [goldRes, silverRes] = await Promise.all([
        fetch('https://bcast.elitegold.net:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/elite'),
        fetch('https://bcast.elitegold.net:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/elitesilvercoin')
      ]);

      if (!goldRes.ok || !silverRes.ok) throw new Error('Failed to fetch rates');

      const goldText = await goldRes.text();
      const silverText = await silverRes.text();

      const rawGoldRates = parseRates(goldText, 'gold');
      const rawSilverRates = parseRates(silverText, 'silver');

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

      res.json({
        goldRates: processRates(rawGoldRates, 'gold'),
        silverRates: processRates(rawSilverRates, 'silver'),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching rates:', error);
      res.status(500).json({ error: 'Failed to fetch rates' });
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    
    // Get current config from database
    const config = await getSettingsFromDB();
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
        const config = await getSettingsFromDB();

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
