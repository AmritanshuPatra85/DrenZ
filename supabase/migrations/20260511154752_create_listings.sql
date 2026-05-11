create type listing_status as enum ('active', 'sold', 'removed');
create type listing_condition as enum ('new', 'like_new', 'good', 'fair');
create type listing_category as enum ('tops', 'bottoms', 'shoes', 'bags', 'accessories');

create table public.listings (
  id uuid default gen_random_uuid() primary key,
  seller_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  price numeric(10,2) not null,
  category listing_category not null,
  condition listing_condition not null,
  images text[] default '{}',
  college text not null,
  status listing_status default 'active',
  is_boosted boolean default false,
  boost_expires_at timestamptz,
  views int default 0,
  created_at timestamptz default now()
);