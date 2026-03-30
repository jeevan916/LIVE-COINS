import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// This file allows Hostinger to run the TypeScript server directly using tsx.
// It satisfies the requirement for a .js entry point while keeping the logic in .ts.

try {
  // Register tsx to handle TypeScript files on the fly
  register('tsx/esm', pathToFileURL('./'));
  console.log('[Loader] TSX loader registered successfully');
} catch (err) {
  console.error('[Loader] Failed to register TSX loader:', err);
}

// Import the actual server logic
console.log('[Loader] Booting server.ts...');
import('./server.ts').catch(err => {
  console.error('[Loader] Critical error during server startup:', err);
  process.exit(1);
});
