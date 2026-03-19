import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize SQLite database
const db = new Database('settings.db');

// Create settings table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    config TEXT NOT NULL
  )
`);

// Insert default config if empty
const stmt = db.prepare('SELECT config FROM settings WHERE id = 1');
if (!stmt.get()) {
  const defaultConfig = {
    goldCommPerGram: 0,
    silverCommPerGram: 0,
    itemCommissions: {},
    itemVisibility: {},
  };
  db.prepare('INSERT INTO settings (id, config) VALUES (1, ?)').run(JSON.stringify(defaultConfig));
}

// API Routes
app.get('/api/settings', (req, res) => {
  try {
    const row = db.prepare('SELECT config FROM settings WHERE id = 1').get() as { config: string };
    res.json(JSON.parse(row.config));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const newConfig = req.body;
    db.prepare('UPDATE settings SET config = ? WHERE id = 1').run(JSON.stringify(newConfig));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

async function startServer() {
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
