#!/bin/bash

# Installation script for Per-User Billing feature dependencies
# Run this from the project root directory

set -e  # Exit on error

echo "================================================"
echo "Installing Billing Feature Dependencies"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "web" ]; then
    echo "❌ Error: Must run this script from project root directory"
    echo "   Current directory: $(pwd)"
    exit 1
fi

echo "${BLUE}Step 1: Installing Backend Dependencies${NC}"
echo "----------------------------------------"
cd backend

echo "Installing production dependencies..."
npm install --save \
    node-cron@3.0.3 \
    nodemailer@6.9.7 \
    handlebars@4.7.8 \
    date-fns@2.30.0 \
    papaparse@5.4.1 \
    jspdf@2.5.1

echo ""
echo "Installing dev dependencies..."
npm install --save-dev \
    @types/node-cron@3.0.11 \
    @types/nodemailer@6.4.14 \
    @types/papaparse@5.3.14

echo "${GREEN}✓ Backend dependencies installed${NC}"
echo ""

echo "${BLUE}Step 2: Installing Web Frontend Dependencies${NC}"
echo "---------------------------------------------"
cd ../web

npm install --save \
    recharts@2.10.3 \
    date-fns@2.30.0 \
    papaparse@5.4.1 \
    jspdf@2.5.1

echo "${GREEN}✓ Web frontend dependencies installed${NC}"
echo ""

echo "${BLUE}Step 3: Verifying Installation${NC}"
echo "--------------------------------"

echo "Backend packages:"
cd ../backend
npm list node-cron nodemailer handlebars 2>/dev/null | grep -E "node-cron|nodemailer|handlebars" || echo "Packages installed but not showing in tree"

echo ""
echo "Web packages:"
cd ../web
npm list recharts jspdf 2>/dev/null | grep -E "recharts|jspdf" || echo "Packages installed but not showing in tree"

cd ..

echo ""
echo "================================================"
echo "${GREEN}✓ All billing dependencies installed successfully!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Update .env file with SMTP configuration"
echo "2. Run database migrations for billing tables"
echo "3. Start implementing the billing feature!"
echo ""
echo "For more info, see:"
echo "  - TECHNOLOGY_STACK.md"
echo "  - TODO.md"
echo "  - FEATURE_ROADMAP.md"
