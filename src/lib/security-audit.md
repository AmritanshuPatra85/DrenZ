# drenZ Security Audit Checklist — S6-10

## Rate Limiting
- [x] POST /api/listings — 5/day per user
- [x] POST /api/auth/verify-whatsapp — 3/hr per user
- [x] POST /api/checkout/create-order — no duplicate orders
- [ ] Add rate limiting to /api/reviews, /api/offers

## RLS Verification
- [x] listings — public read for active, owner write
- [x] messages — conversation parties only
- [x] transactions — buyer + seller only
- [x] users — public read alias/dept/rating, private write
- [x] disputes — buyer + admin only
- [ ] Verify boosts table RLS

## Zod Validation
- [x] POST /api/listings
- [x] POST /api/reviews
- [x] POST /api/offers
- [x] POST /api/transactions/[id]/dispute
- [x] POST /api/boosts/create
- [x] POST /api/listings/[id]/report
- [x] POST /api/users/[id]/report

## SQL Injection
- [x] All queries use Supabase client (parameterized)
- [x] No raw SQL strings with user input

## Auth
- [x] All API routes check supabase.auth.getUser()
- [x] Middleware protects all /main routes
- [x] Domain allowlist enforced in auth callback
- [x] CRON_SECRET protects cron endpoints

## Outstanding
- [ ] Add rate limiting to reviews + offers routes
- [ ] Verify boosts RLS policy
- [ ] Run Supabase RLS test suite before prod