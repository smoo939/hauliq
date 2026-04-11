# HaulIQ — SADC Logistics Marketplace

## Overview
HaulIQ is a freight marketplace built for the SADC region (Southern Africa: Zimbabwe, South Africa, Mozambique, Zambia, Botswana, etc.). It connects shippers and drivers, supporting load posting, bidding, real-time tracking, AI-powered assistance, and driver verification.

## Architecture
- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui
- **Backend/DB**: Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- **AI**: Supabase Edge Functions calling an AI gateway (chatbot, load matching, document verification)
- **Payments**: ContiPay integration for driver subscriptions (via Supabase Edge Function)
- **Maps**: Leaflet / react-leaflet for route visualization
- **Animations**: Framer Motion

## Key Files
- `src/App.tsx` — Root app with routing
- `src/hooks/useAuth.tsx` — Auth context (Supabase auth)
- `src/integrations/supabase/client.ts` — Supabase client
- `src/integrations/supabase/types.ts` — Full DB type definitions
- `src/integrations/lovable/index.ts` — OAuth helper (Google sign-in via Supabase OAuth)
- `src/pages/` — Route pages (AuthPage, ShipperDashboard, DriverDashboard, AdminDashboard, etc.)
- `src/components/` — UI components
- `supabase/functions/` — Edge Functions (ai-chatbot, ai-load-matching, verify-document, contipay-subscribe, contipay-webhook)
- `supabase/migrations/` — DB migration SQL files

## User Roles
- **shipper** — posts loads, reviews bids, tracks deliveries
- **driver** — finds loads, bids, manages verification
- **admin** — platform management dashboard

## Environment Variables
Set in Replit environment (shared):
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key (public)
- `VITE_SUPABASE_PROJECT_ID` — Supabase project ID

Supabase Edge Function secrets (set in Supabase dashboard):
- `LOVABLE_API_KEY` — AI gateway key for chatbot/matching/verification
- `CONTIPAY_TEST_KEY` / `CONTIPAY_API_KEY` — ContiPay payment keys
- `CONTIPAY_API_SECRET` — ContiPay secret

## Dev Server
- Runs on port 5000 (`npm run dev`)
- Workflow: "Start application"

## Replit Migration Notes
- Removed `lovable-tagger` (dev dependency — Vite plugin for Lovable IDE)
- Removed `@lovable.dev/cloud-auth-js` (replaced with native Supabase OAuth in `src/integrations/lovable/index.ts`)
- Updated `vite.config.ts`: host `0.0.0.0`, port `5000`, `allowedHosts: true`
- Supabase env vars moved from `.env` to Replit environment variables
