#!/bin/bash
# Hostinger Auto Deployment Script
# This runs on Hostinger's server when a push is received via hPanel Git integration.

# Exit on error
set -e

echo "Starting deployment..."

# 1. Install dependencies
echo "Installing dependencies..."
# Use --production=false to ensure devDependencies (like vite, esbuild) are installed for the build
npm install --production=false

# 2. Build the application
echo "Building application..."
npm run build

# 3. Restart the application (if using Phusion Passenger)
echo "Restarting application..."
mkdir -p tmp
touch tmp/restart.txt

echo "Deployment complete!"
