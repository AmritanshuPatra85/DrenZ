create type transaction_status as enum ('pending', 'paid', 'completed', 'disputed', 'refunded');

create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete set null,
  buyer_id uuid references public.users(id) on delete set null,
  seller_id uuid references public.users(id) on delete set null,
  amount numeric(10,2) not null,
  platform_fee numeric(10,2) not null,
  seller_payout numeric(10,2) not null,
  status transaction_status default 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  handoff_code text unique,
  handoff_confirmed_at timestamptz,
  created_at timestamptz default now()
);
