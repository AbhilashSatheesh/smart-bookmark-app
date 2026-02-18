# Smart Bookmark App

A private bookmark manager with real-time sync, built with Next.js 15, Supabase, and Tailwind CSS.

## Features

- 🔐 **Google OAuth** — sign in with Google, no passwords
- 🔒 **Private bookmarks** — each user only sees their own bookmarks (enforced via Supabase RLS)
- ⚡ **Real-time sync** — bookmarks update instantly across all open tabs via Supabase Realtime
- 🗑️ **Delete bookmarks** — remove any of your own bookmarks
- 📱 **Responsive design** — works on mobile and desktop

## Tech Stack

- **Framework**: Next.js 15 (App Router)
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
git clone https://github.com/YOUR_USERNAME/smart-bookmark-app
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

### 1. Directory name with spaces broke `create-next-app`

**Problem**: The workspace directory was named `smart bookmark app` (with spaces), and `create-next-app` uses the directory name as the npm package name. npm package names cannot contain spaces, so the scaffolding command failed.

**Solution**: Manually created all project files (`package.json`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, etc.) instead of using the CLI scaffolding tool.

### 2. Node.js version too old

**Problem**: `create-next-app@16` requires Node.js >=20, but the system had Node.js v18.

**Solution**: Used `nvm` to install and switch to Node.js v20 before running npm commands.

### 3. Supabase Realtime filter for user-specific events

**Problem**: Supabase Realtime by default broadcasts all table changes. Without filtering, User A could theoretically receive User B's bookmark events (though RLS prevents actual data access).

**Solution**: Used Supabase's `filter` option in the Realtime subscription (`filter: \`user_id=eq.${userId}\``) to only receive events for the current user's bookmarks. This requires enabling Row-Level Security on the table and using the `postgres_changes` event type.

### 4. Session management with Next.js App Router

**Problem**: Next.js App Router has a strict boundary between Server Components and Client Components. Supabase sessions need to be refreshed on every request, but the cookie store is read-only in Server Components.

**Solution**: Used `@supabase/ssr` package with Next.js middleware (`src/middleware.ts`) to refresh the session on every request. The middleware intercepts all requests, refreshes the Supabase session token if needed, and sets updated cookies before the request reaches the page.

### 5. Real-time updates causing duplicate entries

**Problem**: When a bookmark is added via a Server Action, Next.js `revalidatePath` re-fetches the server data AND the Realtime subscription fires an INSERT event — potentially causing the new bookmark to appear twice.

**Solution**: Added a deduplication check in the Realtime INSERT handler: `if (prev.some((b) => b.id === newBookmark.id)) return prev`. This ensures that if the bookmark already exists in state (from the server revalidation), the Realtime event is ignored.
