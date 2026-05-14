# drenZ Production Deployment Checklist — S6-12

## Vercel Configuration
- [ ] Connect GitHub repo to Vercel project
- [ ] Set all env vars in Vercel dashboard:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - RAZORPAY_KEY_ID (live mode)
  - RAZORPAY_KEY_SECRET (live mode)
  - NEXT_PUBLIC_RAZORPAY_KEY_ID (live mode)
  - WATI_API_URL
  - WATI_API_TOKEN
  - NEXT_PUBLIC_APP_URL=https://drenz-app.vercel.app
  - CRON_SECRET

## Razorpay
- [ ] Switch from test to live keys
- [ ] Update webhook URL to https://drenz-app.vercel.app/api/webhooks/razorpay
- [ ] Verify webhook signature validation works in prod
- [ ] Test one real payment end to end

## Supabase
- [ ] Run all migrations on prod DB
- [ ] Verify all RLS policies active
- [ ] Enable Realtime on transactions + messages tables
- [ ] Set up DB backups (daily)

## Google OAuth
- [ ] Add https://drenz-app.vercel.app to authorised origins
- [ ] Add https://drenz-app.vercel.app/auth/callback to redirect URIs
- [ ] Confirm production mode on OAuth consent screen

## Smoke Tests (run after deploy)
- [ ] Landing page loads
- [ ] Google OAuth login works
- [ ] Create a listing
- [ ] Search finds it
- [ ] Buy Now → Razorpay checkout
- [ ] Webhook fires → transaction created
- [ ] WhatsApp notification received
- [ ] Handoff code validates
- [ ] Rating submitted
- [ ] Logout works