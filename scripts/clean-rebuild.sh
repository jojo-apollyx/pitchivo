#!/bin/bash

# Clean and rebuild script for Pitchivo monorepo
# This script removes all caches and build artifacts, then rebuilds

set -e  # Exit on error

echo "🧹 Starting clean rebuild process..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
info() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Project root: $PROJECT_ROOT"
echo ""

# Step 1: Remove .next build directories
info "Removing .next build directories..."
find . -name ".next" -type d -prune -exec rm -rf {} + 2>/dev/null || true
info "✓ Removed all .next directories"

# Step 2: Remove Turbo cache
info "Removing Turbo cache..."
find . -name ".turbo" -type d -prune -exec rm -rf {} + 2>/dev/null || true
info "✓ Removed Turbo cache"

# Step 3: Remove TypeScript build info files
info "Removing TypeScript build info files..."
find . -name "tsconfig.tsbuildinfo" -type f -delete 2>/dev/null || true
info "✓ Removed TypeScript build info files"

# Step 4: Remove dist directories
info "Removing dist directories..."
find . -name "dist" -type d -prune -exec rm -rf {} + 2>/dev/null || true
info "✓ Removed dist directories"

echo ""
info "Cleanup complete!"
echo ""

# Step 5: Rebuild the project
info "Building project..."
npm run build
info "✓ Build complete!"

echo ""
echo -e "${GREEN}✨ Clean rebuild completed successfully!${NC}"

