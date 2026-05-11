create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade,
  buyer_id uuid references public.users(id) on delete cascade,
  seller_id uuid references public.users(id) on delete cascade,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  unique(listing_id, buyer_id)
);
