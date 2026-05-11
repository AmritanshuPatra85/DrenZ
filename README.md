Set-Content README.md @"
# drenZ

Student marketplace MVP — Next.js 14 · Supabase · Razorpay · Wati

## Stack
- **Frontend/Backend**: Next.js 14 (App Router, TypeScript)
- **Database**: Supabase (Postgres + RLS + Realtime)
- **Payments**: Razorpay
- **Notifications**: Wati (WhatsApp)
- **Deployment**: Vercel

## Branch Strategy
- ``main`` — production only, never push directly
- ``dev`` — integration branch, all features merge here first
- ``feature/TICKET-ID-short-description`` — one branch per ticket

## Getting Started
``````bash
npm install
cp .env.local.example .env.local
# Fill in env vars, then:
npm run dev
``````
"@