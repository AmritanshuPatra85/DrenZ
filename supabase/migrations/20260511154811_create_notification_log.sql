create type notification_type as enum (
  'listing_interest', 'payment_received', 'handoff_reminder',
  'review_request', 'dispute_update', 'boost_expired'
);

create table public.notification_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  type notification_type not null,
  payload jsonb default '{}',
  sent_at timestamptz default now(),
  is_delivered boolean default false
);
