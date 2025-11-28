@echo off
echo Starting Next.js with increased memory...
set NODE_OPTIONS=--max-old-space-size=4096
npm run dev
