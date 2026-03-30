const fs = require('fs');
const path = require('path');

// 1. Catch all uncaught exceptions
process.on('uncaughtException', (err) => {
  const logMsg = `[${new Date().toISOString()}] UNCAUGHT EXCEPTION:\n${err.stack || err.message}\n\n`;
  fs.appendFileSync(path.join(process.cwd(), 'hostinger-error.log'), logMsg);
  console.error(logMsg);
});

// 2. Catch all unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const logMsg = `[${new Date().toISOString()}] UNHANDLED REJECTION:\n${reason && reason.stack ? reason.stack : reason}\n\n`;
  fs.appendFileSync(path.join(process.cwd(), 'hostinger-error.log'), logMsg);
  console.error(logMsg);
});

// 3. Log startup sequence
try {
  const startMsg = `[${new Date().toISOString()}] Starting hostinger-entry.js...\nNode Version: ${process.version}\nCWD: ${process.cwd()}\nPORT: ${process.env.PORT}\n`;
  fs.appendFileSync(path.join(process.cwd(), 'hostinger-debug.log'), startMsg);
  
  // 4. Require the actual server bundle
  require('./server.js');
  
  const successMsg = `[${new Date().toISOString()}] Successfully required server.js\n`;
  fs.appendFileSync(path.join(process.cwd(), 'hostinger-debug.log'), successMsg);
  
} catch (err) {
  const fatalMsg = `[${new Date().toISOString()}] FATAL CRASH DURING STARTUP:\n${err.stack || err.message}\n\n`;
  fs.appendFileSync(path.join(process.cwd(), 'hostinger-error.log'), fatalMsg);
  console.error(fatalMsg);
  
  // 5. START FALLBACK SERVER TO PREVENT 503 ERROR
  // If the main server fails to load, we start a simple HTTP server that 
  // returns the error message directly to the browser.
  const http = require('http');
  const PORT = process.env.PORT || 3000;
  
  const fallbackServer = http.createServer((req, res) => {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`CRITICAL STARTUP ERROR\n\nThe Node.js application failed to start.\nThis fallback server is running to prevent a 503 error and show you the logs.\n\nERROR DETAILS:\n${err.stack || err.message}\n\nPlease check hostinger-error.log and hostinger-debug.log for more info.`);
  });
  
  fallbackServer.listen(PORT, () => {
    const fallbackMsg = `[${new Date().toISOString()}] Fallback server listening on ${PORT}\n`;
    fs.appendFileSync(path.join(process.cwd(), 'hostinger-debug.log'), fallbackMsg);
    console.log(fallbackMsg);
  });
}
