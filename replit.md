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

## Analytics
PostHog telemetry is fully integrated via `posthog-js`:

### Core Setup
- **Initialization**: `src/main.tsx` — token `phc_xQs2PnMkPq8MYcf3Rvs2Xt3JGiWn9h9uN3HC9A9F5hMs`, host `https://us.i.posthog.com`, `person_profiles: "identified_only"`
- **User identification**: `src/hooks/useAuth.tsx` — `posthog.identify()` with userId, email, name, role, phone, verified on login; `posthog.reset()` on sign-out
- **Event catalog**: `src/lib/analytics.ts` — typed wrapper functions for every event category

### Page & Navigation Tracking
- `src/hooks/usePageTracking.ts` — route-change hook using `useLocation`, deduplicates on same path
- `src/App.tsx` — `usePageTracking()` wired via `AppRoutes` component inside BrowserRouter
- `src/components/BottomTabs.tsx` — `tab_navigated` event with `tab` and `role` on every tab press

### Auth Events (src/pages/AuthPage.tsx)
- `sign_up` — method: email, has_phone
- `sign_in` — method: email | google
- `api_error` — on auth failure

### Load Management (src/components/ShipperCreateLoad.tsx)
- `load_form_started` — on mount, captures `has_draft`
- `ai_description_generated` — when AI Write is triggered
- `ai_price_applied` — when AI suggested price is accepted
- `load_posted` — on success: route, price, load_type, equipment_type, weight_kg, is_urgent, has_description, has_photos, ai_price_used, distance_km

### Live Dashboard (src/components/ShipperLiveView.tsx)
- `load_cancelled` — load_id, status
- `bid_accepted` — via BidList component with bid_id, load_id, bid_amount, load_price, driver_id

### Bidding (src/components/BidSystem.tsx)
- `bid_form_opened` — load_id, load_price, route
- `bid_submitted` — load_id, amount, has_note, route
- `bid_unverified_attempt` — load_id

### Driver Home (src/components/DriverHomeView.tsx)
- `load_detail_viewed` — load_id, route, price, equipment_type, is_urgent
- `driver_online_toggled` — is_online
- `load_searched` — debounced (800ms), query, role

### Chat (src/components/LoadChat.tsx)
- `chat_opened` — load_id, role (on mount)
- `message_sent` — load_id, role

### AI Chatbot (src/components/HauliqAIChatbot.tsx)
- `ai_chatbot_opened` — role
- `ai_chatbot_closed` — message_count, role
- `ai_chatbot_message_sent` — role, message_count, is_suggestion
- `ai_chatbot_suggestion_clicked` — suggestion_label, role

### Verification (src/components/VerificationCenter.tsx)
- `verification_center_opened` — on mount
- `verification_step_started` — step name (driver_license, driver_id, driver_selfie, truck_reg, truck_insurance, truck_photo)
- `document_uploaded` — doc_type, success
- `verification_submitted` — entity_type: driver | truck
- `manual_review_requested` — entity_type: driver | truck

### Subscription (src/components/driver/SubscriptionPaywall.tsx)
- `paywall_viewed` — role

## Dev Server
- Runs on port 5000 (`npm run dev`)
- Workflow: "Start application"

## Replit Migration Notes
- Removed `lovable-tagger` (dev dependency — Vite plugin for Lovable IDE)
- Removed `@lovable.dev/cloud-auth-js` (replaced with native Supabase OAuth in `src/integrations/lovable/index.ts`)
- Updated `vite.config.ts`: host `0.0.0.0`, port `5000`, `allowedHosts: true`
- Supabase env vars moved from `.env` to Replit environment variables
