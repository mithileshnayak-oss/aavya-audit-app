# Aavya Brand Audit Engine

An AI-powered website auditor that checks any URL for compliance with the Aavya brand standards (https://registry-dev.aavya.com/).

Scores 7 categories: Color, Typography, Shape Language, Tone & Voice, Layout, Component Quality, and Overall Brand Fit — with specific findings and actionable recommendations.

## Quick Start

### 1. Clone
git clone https://github.com/YOUR_USERNAME/aavya-audit-app.git
cd aavya-audit-app

### 2. Install
npm install

### 3. Set your API key
cp .env.example .env
# Edit .env → add your key from https://console.anthropic.com

### 4. Run locally
npm run dev
# Opens at http://localhost:5173

---

## Deploy to Vercel (recommended)
npm install -g vercel
vercel
# Add VITE_ANTHROPIC_API_KEY as environment variable when prompted

## Deploy to Netlify
npm run build
# Drag dist/ to https://app.netlify.com/drop
# Add VITE_ANTHROPIC_API_KEY in Site Settings → Environment Variables

## Deploy to GitHub Pages
1. npm install --save-dev gh-pages
2. Add to vite.config.js: base: '/aavya-audit-app/'
3. Add to package.json scripts: "deploy": "gh-pages -d dist"
4. npm run build && npm run deploy

---

## Environment Variables
VITE_ANTHROPIC_API_KEY — Your Anthropic API key (required)

## Tech Stack
- React + Vite
- Anthropic Claude API (claude-sonnet-4)
- Zero external UI dependencies

## License
MIT
