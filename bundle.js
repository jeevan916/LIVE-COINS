var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_dotenv = __toESM(require("dotenv"));
var import_express = __toESM(require("express"));
var import_path = __toESM(require("path"));
var import_http = __toESM(require("http"));
var import_socket = require("socket.io");
var import_fs = __toESM(require("fs"));
var import_promise = __toESM(require("mysql2/promise"));
var import_url = require("url");
var import_node_fetch = __toESM(require("node-fetch"));
var import_meta = {};
var _filename;
var _dirname;
try {
  _filename = __filename;
  _dirname = __dirname;
} catch (e) {
  try {
    _filename = (0, import_url.fileURLToPath)(import_meta.url);
    _dirname = import_path.default.dirname(_filename);
  } catch (err) {
    _filename = process.argv[1] || "";
    _dirname = process.cwd();
  }
}
try {
  const possibleEnvPaths = [
    import_path.default.resolve(process.cwd(), "public_html/.builds/config/.env"),
    import_path.default.resolve(process.cwd(), ".builds/config/.env"),
    import_path.default.resolve(process.cwd(), "../.builds/config/.env"),
    import_path.default.resolve(_dirname, "public_html/.builds/config/.env"),
    import_path.default.resolve(_dirname, "../.builds/config/.env"),
    import_path.default.resolve(_dirname, ".env")
  ];
  for (const envPath of possibleEnvPaths) {
    if (import_fs.default.existsSync(envPath)) {
      import_dotenv.default.config({ path: envPath });
      console.log(`Loaded environment variables from ${envPath}`);
      break;
    }
  }
} catch (e) {
  console.warn("Error checking env paths:", e);
}
import_dotenv.default.config();
try {
  console.log("--- SERVER STARTING ---");
  console.log("Time:", (/* @__PURE__ */ new Date()).toISOString());
  console.log("CWD:", process.cwd());
  console.log("Dirname:", _dirname);
  console.log("Filename:", _filename);
  console.log("Env Port:", process.env.PORT);
  console.log("Available Env Keys:", Object.keys(process.env).filter((k) => !k.includes("PASS") && !k.includes("SECRET")).join(", "));
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("DB Host:", process.env.DB_HOST);
  console.log("DB User:", process.env.DB_USER);
  console.log("DB Name:", process.env.DB_NAME);
  console.log("Files in CWD:", import_fs.default.readdirSync(process.cwd()).join(", "));
  if (import_fs.default.existsSync(import_path.default.join(process.cwd(), "dist"))) {
    console.log("Files in dist:", import_fs.default.readdirSync(import_path.default.join(process.cwd(), "dist")).join(", "));
  }
} catch (e) {
  console.warn("Error during startup diagnostic logging:", e);
}
var app = (0, import_express.default)();
var PORT = process.env.PORT || 3e3;
var httpServer = import_http.default.createServer(app);
var io = new import_socket.Server(httpServer, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"]
});
app.get("/super-debug", (req, res) => {
  try {
    const files = import_fs.default.readdirSync(process.cwd());
    res.send(`
      <h1>NODE.JS IS REACHABLE!</h1>
      <p>Time: ${(/* @__PURE__ */ new Date()).toISOString()}</p>
      <p>Port: ${PORT}</p>
      <p>CWD: ${process.cwd()}</p>
      <p>Files in CWD: ${files.join(", ")}</p>
    `);
  } catch (err) {
    res.send(`<h1>NODE.JS IS REACHABLE!</h1><p>Error reading files: ${err.message}</p>`);
  }
});
setInterval(() => {
  console.log(`[Heartbeat] Server is alive on port ${PORT} - ${(/* @__PURE__ */ new Date()).toISOString()}`);
}, 3e4);
var apiRouter = import_express.default.Router();
app.use((req, res, next) => {
  console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.use(import_express.default.json());
app.use("/api", apiRouter);
app.get("/health-check", (req, res) => {
  res.json({
    status: "online",
    port: PORT,
    env: process.env.NODE_ENV,
    cwd: process.cwd(),
    dirname: _dirname,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/test-node", (req, res) => {
  res.send("<h1>Node.js is successfully handling requests!</h1>");
});
var dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "u477692720_jeevan999coin",
  password: process.env.DB_PASSWORD || "jeevan@916$",
  database: process.env.DB_NAME || "u477692720_jeevan999coin",
  connectTimeout: 3e4
  // Increase to 30 seconds
};
console.log("Database Configuration:", {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  hasPassword: !!dbConfig.password,
  port: PORT
});
if (dbConfig.host === "localhost") {
  console.warn("WARNING: DB_HOST is set to localhost. On Hostinger, if you get ETIMEDOUT, try using 127.0.0.1 or the specific MySQL host from hPanel.");
}
var pool = import_promise.default.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 1e4
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
    await pool.query(`
      INSERT IGNORE INTO settings (id, goldCommPerGram, silverCommPerGram, itemCommissions, itemVisibility, socketKeys)
      VALUES (1, 0, 0, '{}', '{}', '[]')
    `);
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
    console.log("Database initialized and seeded successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}
function extractWeight(name) {
  const match = name.match(/(\d+(?:\.\d+)?)\s*(kg|gm|g|mg)/i);
  if (match) {
    const val = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === "kg") return val * 1e3;
    if (unit === "mg") return val / 1e3;
    return val;
  }
  return 1;
}
function parseRates(text, type) {
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  return lines.map((line) => {
    const parts = line.split("	");
    let name = parts[2] || "";
    name = name.replace("(Min.2 Pc.)", "").trim();
    return {
      id: parts[1],
      name,
      bid: parseFloat(parts[3]) || 0,
      ask: parseFloat(parts[4]) || 0,
      high: parseFloat(parts[5]) || 0,
      low: parseFloat(parts[6]) || 0,
      weight: extractWeight(name),
      type
    };
  }).filter((item) => item.id && item.name);
}
async function getSettingsFromDB() {
  const defaultConfig = {
    goldCommPerGram: 0,
    silverCommPerGram: 0,
    itemCommissions: {},
    itemVisibility: {},
    socketKeys: []
  };
  try {
    const [rows] = await pool.query("SELECT * FROM settings WHERE id = 1");
    if (Array.isArray(rows) && rows.length > 0) {
      const row = rows[0];
      return {
        goldCommPerGram: row.goldCommPerGram || 0,
        silverCommPerGram: row.silverCommPerGram || 0,
        itemCommissions: typeof row.itemCommissions === "string" ? JSON.parse(row.itemCommissions) : row.itemCommissions || {},
        itemVisibility: typeof row.itemVisibility === "string" ? JSON.parse(row.itemVisibility) : row.itemVisibility || {},
        socketKeys: typeof row.socketKeys === "string" ? JSON.parse(row.socketKeys) : row.socketKeys || []
      };
    }
  } catch (error) {
    console.error("Error fetching settings from MySQL:", error);
  }
  return defaultConfig;
}
async function saveHistoricalRates() {
  try {
    console.log("Saving historical rates...");
    const [goldRes, silverRes] = await Promise.all([
      (0, import_node_fetch.default)("https://bcast.elitegold.net:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/elite"),
      (0, import_node_fetch.default)("https://bcast.elitegold.net:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/elitesilvercoin")
    ]);
    if (!goldRes.ok || !silverRes.ok) throw new Error("Failed to fetch rates for history");
    const goldText = await goldRes.text();
    const silverText = await silverRes.text();
    const rawGoldRates = parseRates(goldText, "gold");
    const rawSilverRates = parseRates(silverText, "silver");
    const goldToSave = rawGoldRates[0];
    const silverToSave = rawSilverRates[0];
    if (goldToSave) {
      await pool.query(
        "INSERT INTO historical_rates (type, symbol, bid, ask) VALUES (?, ?, ?, ?)",
        ["gold", goldToSave.name, goldToSave.bid, goldToSave.ask]
      );
    }
    if (silverToSave) {
      await pool.query(
        "INSERT INTO historical_rates (type, symbol, bid, ask) VALUES (?, ?, ?, ?)",
        ["silver", silverToSave.name, silverToSave.bid, silverToSave.ask]
      );
    }
    console.log("Historical rates saved successfully");
  } catch (error) {
    console.error("Error saving historical rates:", error);
  }
}
setInterval(saveHistoricalRates, 60 * 60 * 1e3);
async function startServer() {
  console.log(`Starting server in ${process.env.NODE_ENV || "production"} mode...`);
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  try {
    await initDB();
    const [countRows] = await pool.query("SELECT COUNT(*) as count FROM historical_rates");
    if (countRows[0].count === 0) {
      await saveHistoricalRates();
    }
  } catch (dbError) {
    console.error("CRITICAL: Database initialization failed on startup:", dbError);
  }
  apiRouter.use((req, res, next) => {
    console.log(`[API Request] ${req.method} ${req.url}`);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });
  apiRouter.get("/", (req, res) => {
    res.json({
      message: "API is alive and reachable",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  apiRouter.get("/health", async (req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({
        status: "ok",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        dbConnected: true,
        dbStatus: "connected",
        environment: process.env.NODE_ENV || "production"
      });
    } catch (error) {
      console.error("Database health check failed:", error);
      res.status(500).json({
        status: "error",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        dbConnected: false,
        dbStatus: "error",
        error: error.message,
        code: error.code
      });
    }
  });
  apiRouter.get("/env-debug", (req, res) => {
    const safeEnv = { ...process.env };
    delete safeEnv.DB_PASSWORD;
    delete safeEnv.DB_USER;
    delete safeEnv.SOCKET_SECRET_KEY;
    delete safeEnv.GEMINI_API_KEY;
    res.json({
      message: "Environment Debug Info",
      port: PORT,
      nodeVersion: process.version,
      env: safeEnv,
      cwd: process.cwd(),
      dirname: __dirname
    });
  });
  apiRouter.get(["/settings", "/settings/"], async (req, res) => {
    try {
      console.log("Fetching settings from DB...");
      const settings = await getSettingsFromDB();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings API:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });
  apiRouter.post("/settings", async (req, res) => {
    try {
      const authHeader = req.headers["x-admin-password"];
      if (authHeader !== "jeevan@916$") {
        return res.status(401).json({ error: "Unauthorized" });
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
      io.emit("config_updated");
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });
  apiRouter.get("/historical-rates", async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT type, symbol, bid, ask, timestamp 
        FROM historical_rates 
        WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY timestamp ASC
      `);
      res.json(rows);
    } catch (error) {
      console.error("Error fetching historical rates:", error);
      res.status(500).json({ error: "Failed to fetch historical rates" });
    }
  });
  apiRouter.get("/rates", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader ? authHeader.split(" ")[1] : req.query.key;
      const config = await getSettingsFromDB();
      const validKeys = config.socketKeys || [];
      const envSecretKey = process.env.SOCKET_SECRET_KEY;
      if (validKeys.length > 0 || envSecretKey) {
        if (!token || !validKeys.includes(token) && token !== envSecretKey) {
          return res.status(401).json({ error: "Unauthorized: Invalid or missing API key" });
        }
      }
      const [goldRes, silverRes] = await Promise.all([
        (0, import_node_fetch.default)("https://bcast.elitegold.net:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/elite"),
        (0, import_node_fetch.default)("https://bcast.elitegold.net:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/elitesilvercoin")
      ]);
      if (!goldRes.ok || !silverRes.ok) throw new Error("Failed to fetch rates");
      const goldText = await goldRes.text();
      const silverText = await silverRes.text();
      const rawGoldRates = parseRates(goldText, "gold");
      const rawSilverRates = parseRates(silverText, "silver");
      const processRates = (rates, type) => {
        return rates.filter((r) => config.itemVisibility[r.id] !== false).map((r) => {
          const baseCommPerGram = type === "gold" ? config.goldCommPerGram : config.silverCommPerGram;
          const itemCommPerGram = config.itemCommissions[r.id] !== void 0 ? config.itemCommissions[r.id] : baseCommPerGram;
          const totalCommission = itemCommPerGram * r.weight;
          return {
            ...r,
            ask: r.ask + totalCommission,
            bid: r.bid + totalCommission,
            high: r.high + totalCommission,
            low: r.low + totalCommission
          };
        });
      };
      res.json({
        goldRates: processRates(rawGoldRates, "gold"),
        silverRates: processRates(rawSilverRates, "silver"),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Error fetching rates:", error);
      res.status(500).json({ error: "Failed to fetch rates" });
    }
  });
  apiRouter.use((req, res) => {
    console.warn(`[API 404] ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });
  initDB().then(() => {
    console.log("Database initialization complete");
  }).catch((err) => {
    console.error("Database initialization failed:", err);
  });
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    const config = await getSettingsFromDB();
    const validKeys = config.socketKeys || [];
    const envSecretKey = process.env.SOCKET_SECRET_KEY;
    if (validKeys.length === 0 && !envSecretKey) {
      return next();
    }
    if (validKeys.includes(token) || envSecretKey && token === envSecretKey) {
      next();
    } else {
      next(new Error("Authentication error: Invalid token"));
    }
  });
  setInterval(async () => {
    try {
      const [goldRes, silverRes] = await Promise.all([
        (0, import_node_fetch.default)("https://bcast.elitegold.net:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/elite"),
        (0, import_node_fetch.default)("https://bcast.elitegold.net:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/elitesilvercoin")
      ]);
      if (goldRes.ok && silverRes.ok) {
        const goldText = await goldRes.text();
        const silverText = await silverRes.text();
        const rawGoldRates = parseRates(goldText, "gold");
        const rawSilverRates = parseRates(silverText, "silver");
        const config = await getSettingsFromDB();
        const processRates = (rates, type) => {
          return rates.filter((r) => config.itemVisibility[r.id] !== false).map((r) => {
            const baseCommPerGram = type === "gold" ? config.goldCommPerGram : config.silverCommPerGram;
            const itemCommPerGram = config.itemCommissions[r.id] !== void 0 ? config.itemCommissions[r.id] : baseCommPerGram;
            const totalCommission = itemCommPerGram * r.weight;
            return {
              ...r,
              rawAsk: r.ask,
              rawBid: r.bid,
              ask: r.ask + totalCommission,
              bid: r.bid + totalCommission,
              high: r.high + totalCommission,
              low: r.low + totalCommission
            };
          });
        };
        io.emit("rates", {
          goldRates: processRates(rawGoldRates, "gold"),
          silverRates: processRates(rawSilverRates, "silver"),
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    } catch (error) {
      console.error("Error fetching or broadcasting rates:", error);
    }
  }, 2e3);
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    console.log("Vite middleware integrated for development mode");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const possibleDistPaths = [
      import_path.default.join(process.cwd(), "public"),
      import_path.default.join(process.cwd(), "dist", "public"),
      import_path.default.join(_dirname, "public"),
      import_path.default.join(_dirname, "dist", "public"),
      import_path.default.join(process.cwd(), "public_html", "public"),
      import_path.default.join(process.cwd(), "..", "public_html", "public"),
      process.cwd()
    ];
    let distPath = "";
    for (const p of possibleDistPaths) {
      if (import_fs.default.existsSync(import_path.default.join(p, "index.html"))) {
        distPath = p;
        console.log(`Found static assets at: ${distPath}`);
        break;
      }
    }
    if (distPath) {
      app.use(import_express.default.static(distPath));
      app.use((req, res, next) => {
        if (req.method !== "GET") return next();
        if (req.url.startsWith("/api")) return next();
        res.sendFile(import_path.default.join(distPath, "index.html"));
      });
    } else {
      console.warn("Production mode but dist folder not found. Serving API only.");
      app.use((req, res, next) => {
        if (req.method !== "GET") return next();
        if (req.url.startsWith("/api")) {
          res.status(404).json({ error: "API route not found" });
        } else {
          res.status(404).send("Application not built. Please run npm run build.");
        }
      });
    }
  }
  app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err);
    if (req.url.startsWith("/api")) {
      res.status(500).json({ error: "Internal Server Error", message: err.message });
    } else {
      next(err);
    }
  });
}
startServer().catch((err) => {
  console.error("CRITICAL STARTUP ERROR:", err);
  import_fs.default.writeFileSync("startup-error.log", `${(/* @__PURE__ */ new Date()).toISOString()}
${err.stack || err.message}
`);
  process.exit(1);
});
