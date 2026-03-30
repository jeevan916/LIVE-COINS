#!/bin/bash
# Hostinger Auto Deployment Script
# This runs on Hostinger's server when a push is received via hPanel Git integration.

# Exit on error and trace commands
set -ex

echo "Starting deployment at $(date)"
echo "Current user: $(whoami)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# 1. Install dependencies
echo "Installing dependencies..."
# Use --production=false to ensure devDependencies (like vite, esbuild) are installed for the build
npm install --production=false

# 2. Build the application
echo "Building application..."
npm run clean || true
mkdir -p dist
ls -la # Show files before build
npm run build
ls -la # Show files after build
ls -la dist || true # Show dist content

# 3. Restart the application (if using Phusion Passenger)
echo "Restarting application..."
mkdir -p tmp
touch tmp/restart.txt

echo "Deployment complete!"
