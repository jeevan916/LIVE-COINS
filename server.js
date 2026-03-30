// This file will be overwritten by the build process.
// It serves as the entry point for Hostinger.
console.log('Starting server.js...');
try {
  require('./dist/server.js');
} catch (e) {
  console.error('Failed to load bundle:', e);
}
