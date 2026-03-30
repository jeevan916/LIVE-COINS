import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Robust path handling for both ESM and CJS environments
let _filename: string;
let _dirname: string;

try {
  // @ts-ignore - __filename is available in CJS
  _filename = __filename;
  // @ts-ignore - __dirname is available in CJS
  _dirname = __dirname;
} catch (e) {
  // Fallback for ESM environments (like tsx)
  try {
    _filename = fileURLToPath(import.meta.url);
    _dirname = path.dirname(_filename);
  } catch (err) {
    // Last resort fallback
    _filename = process.argv[1] || '';
    _dirname = process.cwd();
  }
}

// Try loading environment variables from the specific Hostinger path first
try {
  const possibleEnvPaths = [
    path.resolve(process.cwd(), 'public_html/.builds/config/.env'),
    path.resolve(process.cwd(), '.builds/config/.env'),
    path.resolve(process.cwd(), '../.builds/config/.env'),
    path.resolve(_dirname, 'public_html/.builds/config/.env'),
    path.resolve(_dirname, '../.builds/config/.env'),
    path.resolve(_dirname, '.env')
  ];

  for (const envPath of possibleEnvPaths) {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      console.log(`Loaded environment variables from ${envPath}`);
      break;
    }
  }
} catch (e) {
  console.warn('Error checking env paths:', e);
}

// Fallback to standard .env in the root if the above doesn't exist
dotenv.config();

try {
  console.log('--- SERVER STARTING ---');
  console.log('Time:', new Date().toISOString());
  console.log('CWD:', process.cwd());
  console.log('Dirname:', _dirname);
  console.log('Filename:', _filename);
  console.log('Env Port:', process.env.PORT);
  console.log('Available Env Keys:', Object.keys(process.env).filter(k => !k.includes('PASS') && !k.includes('SECRET')).join(', '));
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('DB Host:', process.env.DB_HOST);
  console.log('DB User:', process.env.DB_USER);
  console.log('DB Name:', process.env.DB_NAME);
  console.log('Files in CWD:', fs.readdirSync(process.cwd()).join(', '));
  if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
    console.log('Files in dist:', fs.readdirSync(path.join(process.cwd(), 'dist')).join(', '));
  }
} catch (e) {
  console.warn('Error during startup diagnostic logging:', e);
}

const app = express();
const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
  transports: ['websocket', 'polling']
});

// SUPER DEBUG ROUTE - MUST BE AT THE VERY TOP
app.get('/super-debug', (req, res) => {
  try {
    const files = fs.readdirSync(process.cwd());
    res.send(`
      <h1>NODE.JS IS REACHABLE!</h1>
      <p>Time: ${new Date().toISOString()}</p>
      <p>Port: ${PORT}</p>
      <p>CWD: ${process.cwd()}</p>
      <p>Files in CWD: ${files.join(', ')}</p>
    `);
  } catch (err: any) {
    res.send(`<h1>NODE.JS IS REACHABLE!</h1><p>Error reading files: ${err.message}</p>`);
  }
});

// Heartbeat to keep logs active and verify life
setInterval(() => {
  console.log(`[Heartbeat] Server is alive on port ${PORT} - ${new Date().toISOString()}`);
}, 30000);

// API Router definition - Define it early
const apiRouter = express.Router();

// Global request logger - MUST be first
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(express.json());

let resolvedDistPath = '';

// Diagnostic route at the root level
app.get('/health-check', (req, res) => {
  res.json({
    status: 'online',
    port: PORT,
    env: process.env.NODE_ENV,
    cwd: process.cwd(),
    dirname: _dirname,
    distPath: resolvedDistPath,
    timestamp: new Date().toISOString()
  });
});

app.get('/debug-files', (req, res) => {
  const safeReaddir = (dir: string) => {
    try {
      return fs.readdirSync(dir);
    } catch (e: any) {
      return `Error: ${e.message}`;
    }
  };

  res.json({
    cwdFiles: safeReaddir(process.cwd()),
    distFiles: safeReaddir(path.join(process.cwd(), 'dist')),
    distPublicFiles: safeReaddir(path.join(process.cwd(), 'dist', 'public')),
    distPublicAssets: safeReaddir(path.join(process.cwd(), 'dist', 'public', 'assets')),
    parentPublicHtml: safeReaddir(path.join(process.cwd(), '..', 'public_html')),
    parentPublicHtmlAssets: safeReaddir(path.join(process.cwd(), '..', 'public_html', 'assets')),
  });
});

// Mount API Router EARLY at the top level
app.use('/api', apiRouter);

app.get('/test-node', (req, res) => {
  res.send('<h1>Node.js is successfully handling requests!</h1>');
});

// Initialize MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'u477692720_jeevan999coin',
  password: process.env.DB_PASSWORD || 'jeevan@916$',
  database: process.env.DB_NAME || 'u477692720_jeevan999coin',
  connectTimeout: 30000, // Increase to 30 seconds
};

console.log('Database Configuration:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  hasPassword: !!dbConfig.password,
  port: PORT
});

if (dbConfig.host === 'localhost') {
  console.warn('WARNING: DB_HOST is set to localhost. On Hostinger, if you get ETIMEDOUT, try using 127.0.0.1 or the specific MySQL host from hPanel.');
}

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

async function initDB() {
  try {
    // 1. Create the table if it doesn't exist
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
    
    // 2. Ensure at least one default row exists so SELECT doesn't return empty
    await pool.query(`
      INSERT IGNORE INTO settings (id, goldCommPerGram, silverCommPerGram, itemCommissions, itemVisibility, socketKeys)
      VALUES (1, 0, 0, '{}', '{}', '[]')
    `);
    
    // 3. Create historical_rates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historical_rates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(20),
        symbol VARCHAR(100),
        bid DECIMAL(15, 4),
        ask DECIMAL(15, 4),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database initialized and seeded successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // We don't throw here so the server can still start with hardcoded defaults
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
  console.log(`Starting server in ${process.env.NODE_ENV || 'production'} mode...`);
  
  // Start listening IMMEDIATELY so Hostinger Passenger doesn't timeout
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Initialize DB asynchronously without crashing the server if it fails
  try {
    await initDB();
  } catch (dbError) {
    console.error('CRITICAL: Database initialization failed on startup:', dbError);
    // We don't exit here, so the API can still return 500s or health check failures
    // instead of the whole Node process crashing and causing a 503.
  }
  
  apiRouter.use((req, res, next) => {
    console.log(`[API Request] ${req.method} ${req.url}`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  apiRouter.get('/', (req, res) => {
    res.json({ 
      message: 'API is alive and reachable',
      timestamp: new Date().toISOString()
    });
  });

  apiRouter.get('/health', async (req, res) => {
    try {
      // Perform a real query to test the connection
      await pool.query('SELECT 1');
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        dbConnected: true,
        dbStatus: 'connected',
        environment: process.env.NODE_ENV || 'production'
      });
    } catch (error: any) {
      console.error('Database health check failed:', error);
      res.status(500).json({ 
        status: 'error', 
        timestamp: new Date().toISOString(),
        dbConnected: false,
        dbStatus: 'error',
        error: error.message,
        code: error.code
      });
    }
  });

  apiRouter.get('/env-debug', (req, res) => {
    const safeEnv = { ...process.env };
    // Remove sensitive data
    delete safeEnv.DB_PASSWORD;
    delete safeEnv.DB_USER;
    delete safeEnv.SOCKET_SECRET_KEY;
    delete safeEnv.GEMINI_API_KEY;
    
    res.json({
      message: 'Environment Debug Info',
      port: PORT,
      nodeVersion: process.version,
      env: safeEnv,
      cwd: process.cwd(),
      dirname: __dirname
    });
  });

  apiRouter.get(['/settings', '/settings/'], async (req, res) => {
    try {
      console.log('Fetching settings from DB...');
      const settings = await getSettingsFromDB();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings API:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  apiRouter.post('/settings', async (req, res) => {
    try {
      const authHeader = req.headers['x-admin-password'];
      if (authHeader !== 'jeevan@916$') {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const newSettings = req.body;
      
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
      
      // Broadcast to all clients that config has changed
      io.emit('config_updated');
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  apiRouter.get('/historical-rates', async (req, res) => {
    try {
      // Get rates from the last 7 days
      const [rows] = await pool.query(`
        SELECT type, symbol, bid, ask, timestamp 
        FROM historical_rates 
        WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY timestamp ASC
      `);
      res.json(rows);
    } catch (error) {
      console.error('Error fetching historical rates:', error);
      res.status(500).json({ error: 'Failed to fetch historical rates' });
    }
  });

  apiRouter.get('/rates', async (req, res) => {
    try {
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

  // Catch-all for /api/* to prevent fall-through to static serving
  apiRouter.use((req, res) => {
    console.warn(`[API 404] ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Initialize DB in background
  initDB().then(() => {
    console.log('Database initialization complete');
  }).catch(err => {
    console.error('Database initialization failed:', err);
  });

  // Socket middleware to separate admins and public users
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    const adminPass = process.env.DB_PASSWORD || 'jeevan@916$';
    
    if (token === adminPass) {
      socket.join('admin_room');
    } else {
      socket.join('public_room');
    }
    next();
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
        const config = await getSettingsFromDB();

        const processRates = (rates: any[], type: 'gold' | 'silver', isAdmin: boolean) => {
          return rates
            .filter(r => isAdmin || config.itemVisibility[r.id] !== false)
            .map(r => {
              const baseCommPerGram = type === 'gold' ? config.goldCommPerGram : config.silverCommPerGram;
              const itemCommPerGram = config.itemCommissions[r.id] !== undefined 
                ? config.itemCommissions[r.id] 
                : baseCommPerGram;
              
              const totalCommission = itemCommPerGram * r.weight;
              return {
                ...r,
                rawAsk: r.ask,
                rawBid: r.bid,
                ask: r.ask + totalCommission,
                bid: r.bid + totalCommission,
                high: r.high + totalCommission,
                low: r.low + totalCommission,
              };
            });
        };

        // Broadcast to public users (filtered)
        io.to('public_room').emit('rates', {
          goldRates: processRates(rawGoldRates, 'gold', false),
          silverRates: processRates(rawSilverRates, 'silver', false),
          timestamp: new Date().toISOString()
        });

        // Broadcast to admin users (unfiltered)
        io.to('admin_room').emit('rates', {
          goldRates: processRates(rawGoldRates, 'gold', true),
          silverRates: processRates(rawSilverRates, 'silver', true),
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching or broadcasting rates:', error);
    }
  }, 2000);

  // Static file serving logic
  // On Hostinger, we want to default to production unless explicitly told otherwise
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    console.log('Vite middleware integrated for development mode');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const possibleDistPaths = [
      path.join(process.cwd(), 'dist', 'public'), // Vite default
      path.join(_dirname, 'dist', 'public'),
      path.join(process.cwd(), '..', 'public_html'), // Hostinger public_html
      path.join(process.cwd(), 'public_html'),
    ];

    let distPath = '';
    for (const p of possibleDistPaths) {
      if (fs.existsSync(path.join(p, 'index.html'))) {
        distPath = p;
        console.log(`Found static assets at: ${distPath}`);
        break;
      }
    }
    
    resolvedDistPath = distPath;

    if (distPath) {
      app.use(express.static(distPath));
      app.use((req, res, next) => {
        if (req.method !== 'GET') return next();
        if (req.url.startsWith('/api')) return next();
        
        // CRITICAL FIX: Do not serve index.html for missing static assets (.js, .css, etc.)
        // This prevents the "white screen" error where the browser tries to parse HTML as JavaScript
        if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
          return res.status(404).send('Asset not found');
        }
        
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn('Production mode but dist folder not found. Serving API only.');
      app.use((req, res, next) => {
        if (req.method !== 'GET') return next();
        if (req.url.startsWith('/api')) {
          res.status(404).json({ error: 'API route not found' });
        } else {
          res.status(404).send('Application not built. Please run npm run build.');
        }
      });
    }
  }

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Error:', err);
    if (req.url.startsWith('/api')) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    } else {
      next(err);
    }
  });
}

startServer().catch(err => {
  console.error('CRITICAL STARTUP ERROR:', err);
  fs.writeFileSync('startup-error.log', `${new Date().toISOString()}\n${err.stack || err.message}\n`);
  process.exit(1);
});
