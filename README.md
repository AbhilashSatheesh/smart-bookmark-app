# Smart Bookmark App

A private bookmark manager with real-time sync, built with Next.js 16, Supabase, and Tailwind CSS.

## Features

- 🔐 **Google OAuth** — sign in with Google, no passwords
- 🔒 **Private bookmarks** — each user only sees their own bookmarks (enforced via Supabase RLS)
- ⚡ **Real-time sync** — bookmarks update instantly across all open tabs via Supabase Realtime
- 🗑️ **Delete bookmarks** — remove any of your own bookmarks
- 📱 **Responsive design** — works on mobile and desktop

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth + Database + Realtime**: Supabase
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Local Development

### Prerequisites

- Node.js 20+
- A Supabase project
- Google OAuth credentials

### 1. Clone the repo

```bash
git clone https://github.com/AbhilashSatheesh/smart-bookmark-app
cd smart-bookmark-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Go to **Database → Replication** and enable the `bookmarks` table for Realtime
4. Go to **Authentication → Providers → Google** and enable Google OAuth
   - You'll need a Google Cloud OAuth 2.0 client (see [Google Cloud Console](https://console.cloud.google.com))
   - Set the authorized redirect URI to: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel)

1. Push to a public GitHub repo
2. Import the repo in [Vercel](https://vercel.com)
3. Add the environment variables in Vercel project settings
4. Add your Vercel domain to Supabase → Authentication → URL Configuration → Redirect URLs: `https://YOUR_APP.vercel.app/**`

---

## Problems Encountered & Solutions

### 1. Real-time updates required page refresh (server action conflict)

**Problem**: Using Next.js Server Actions with `revalidatePath('/dashboard')` for add/delete triggered a full server re-render, which reset the client component state and wiped out the Supabase Realtime subscription's local updates. This meant the list only updated after a full page refresh.

**Solution**: Moved all bookmark mutations (add and delete) to **client-side Supabase calls** directly from the browser. Removed `revalidatePath` entirely. The Realtime subscription now drives all UI updates, and optimistic updates handle immediate feedback in the same tab.

### 2. Added bookmark didn't appear in the same tab without refresh

**Problem**: After fixing server actions, adding a bookmark still required a refresh in the same tab. This is because Supabase Realtime does **not** echo `postgres_changes` INSERT events back to the client that made the change — it only broadcasts to *other* subscribers.

**Solution**: Implemented **optimistic insert** — after the Supabase `insert()` call returns successfully, the new bookmark is immediately added to the local React state. The Realtime subscription handles cross-tab sync for other open tabs.

### 3. Cross-tab INSERT sync not working (Realtime filter issue)

**Problem**: After fixing same-tab updates, INSERT events still weren't reaching the second tab. The Realtime subscription used a `filter: user_id=eq.${userId}` which requires `REPLICA IDENTITY FULL` to be set on the table — without it, Supabase silently drops filtered `postgres_changes` events.

**Solution**: 
- Removed the `filter` from the Realtime subscription
- Added `alter table public.bookmarks replica identity full;` to the SQL schema
- Filtered events client-side by comparing `payload.new.user_id` to the current user's ID

### 4. Cross-tab INSERT sync still not working (Realtime auth timing)

**Problem**: Even after removing the filter, INSERT events weren't reaching the second tab. DELETE events worked because `REPLICA IDENTITY FULL` includes the full row in the payload even for unauthenticated connections. But INSERT events from `postgres_changes` require the Realtime WebSocket to be **authenticated** — the second tab's connection was connecting anonymously before the session cookie was read.

**Solution**: Wrapped the channel subscription in an `async` function that first awaits `supabase.auth.getSession()` and calls `supabase.realtime.setAuth(session.access_token)` **before** creating the channel. This ensures the WebSocket is authenticated before subscribing, so INSERT events are delivered to all open tabs.