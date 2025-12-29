#!/bin/bash

# TimeFlow Setup Script

echo "🌊 Setting up TimeFlow..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null
then
    echo "📦 pnpm not found. Installing..."
    npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Create PWA icons directory if it doesn't exist
mkdir -p public/icons

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Generate PWA icons and place them in public/icons/"
echo "     Visit: https://www.pwabuilder.com/imageGenerator"
echo ""
echo "  2. Run the development server:"
echo "     pnpm dev"
echo ""
echo "  3. Open http://localhost:3000 in your browser"
echo ""
echo "Happy time flowing! 🌊"

