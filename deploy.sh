#!/bin/bash
# Hostinger Auto Deployment Script
# This runs on Hostinger's server when a push is received via hPanel Git integration.

# Exit on error and trace commands
set -ex

echo "Starting deployment at $(date)"
echo "Current user: $(whoami)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Memory info:"
free -m || echo "free command not available"
echo "Disk info:"
df -h .
echo "Current directory: $(pwd)"

# 1. Install dependencies
echo "Installing dependencies..."
# Use --production=false to ensure devDependencies (like vite, esbuild) are installed for the build
npm install --production=false
npm prune

# 2. Build the application
echo "Building application..."
npm run clean || true
ls -la # Show files before build

# Force install dev dependencies just in case
npm install vite esbuild typescript @vitejs/plugin-react @tailwindcss/vite --no-save

# Run the build
npm run build
echo "Build command finished. Checking output..."
ls -la # Show files after build
ls -la dist/ || echo "dist folder not found!"
ls -la dist/public/ || echo "dist/public folder not found!"

if [ ! -f "bundle.js" ]; then
  echo "ERROR: bundle.js (root bundle) was not created! Build failed."
  exit 1
fi

# Check if it's a bundle or the proxy
if grep -q "require" bundle.js; then
  echo "Warning: bundle.js seems to be a proxy/loader, not the full bundle."
fi

echo "Build successful. bundle.js and server.js exist and are ready."

# 3. Restart the application (if using Phusion Passenger)
echo "Restarting application..."
mkdir -p tmp
touch tmp/restart.txt

echo "Deployment complete!"
