#!/bin/bash

# Clear debug ports 9229 and 9230
# This script kills any processes using these ports

echo "Clearing debug ports 9229 and 9230..."

# Kill process on port 9229
lsof -ti:9229 | xargs kill -9 2>/dev/null || echo "No process found on port 9229"

# Kill process on port 9230
lsof -ti:9230 | xargs kill -9 2>/dev/null || echo "No process found on port 9230"

echo "Debug ports cleared!"

