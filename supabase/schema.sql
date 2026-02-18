-- ============================================
-- Smart Bookmark App - Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Create bookmarks table
create table if not exists public.bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  title text not null,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.bookmarks enable row level security;

-- Policy: Users can only view their own bookmarks
create policy "Users can view own bookmarks"
  on public.bookmarks
  for select
  using (auth.uid() = user_id);

-- Policy: Users can only insert their own bookmarks
create policy "Users can insert own bookmarks"
  on public.bookmarks
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can only delete their own bookmarks
create policy "Users can delete own bookmarks"
  on public.bookmarks
  for delete
  using (auth.uid() = user_id);

-- Enable Realtime for the bookmarks table
-- (Also enable it in the Supabase Dashboard: Database > Replication > bookmarks)
alter publication supabase_realtime add table public.bookmarks;
