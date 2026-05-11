create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  alias text unique not null,
  college text not null,
  phone text unique not null,
  student_id_url text,
  is_verified boolean default false,
  is_banned boolean default false,
  rating numeric(3,2) default 0,
  total_reviews int default 0,
  created_at timestamptz default now()
);