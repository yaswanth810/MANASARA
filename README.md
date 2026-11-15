# MANASARA — Developer Setup Guide

> **Handmade gifting brand e-commerce platform**  
> Built with React 18 · TypeScript · Vite · Supabase · Tailwind CSS

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui (custom MANASARA tokens) |
| State | TanStack Query v5 (server), Zustand (cart) |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Fonts | Fraunces (headings) · DM Sans (body/UI) |

---

## Prerequisites

- **Node.js** 18 or higher — [nodejs.org](https://nodejs.org)
- **npm** 9 or higher (bundled with Node)
- **Supabase CLI** — choose one:
  ```bash
  npm install -g supabase          # via npm
  brew install supabase/tap/supabase  # via Homebrew (macOS/Linux)
  ```
- **psql** (PostgreSQL client) — only needed for seeding data locally  
  Windows: install via [EDB installer](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads) and add to PATH

---

## Step 1 — Clone and Install

```bash
cd e:\MANASARA      # or wherever the project lives
npm install
```

---

## Step 2 — Environment Variables

The file `.env.local` already exists with the Supabase credentials.  
If it's missing, copy the example and fill in:

```bash
cp .env.example .env.local
# Then edit .env.local with the correct values
```

Required variables:

```env
VITE_SUPABASE_URL=https://mcnrarmkuyzyycpuvtec.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_TdRfKj2RaVWo8yEL-msbzQ_7AS38MgW
VITE_APP_NAME=MANASARA
VITE_APP_URL=http://localhost:5173
```

> **Security note:** `VITE_SUPABASE_ANON_KEY` is Supabase's _publishable_ key (formerly "anon key"). It is intentionally safe for the browser — Row Level Security (RLS) on all tables is what enforces data access rules, not key secrecy.

---

## Step 3 — Supabase Setup

### Option A — Hosted (recommended for production & team use)

```bash
# Authenticate with Supabase Cloud
supabase login

# Link this repo to the hosted project
supabase link --project-ref mcnrarmkuyzyycpuvtec

# Push all database migrations
supabase db push

# Load seed data (demo products, store settings, serviceable PIN codes)
psql "$(supabase db remote conn-string)" < supabase/seed.sql

# Deploy Edge Functions
supabase functions deploy place-order             --no-verify-jwt
supabase functions deploy submit-payment-reference --no-verify-jwt
supabase functions deploy verify-payment
supabase functions deploy track-order             --no-verify-jwt
supabase functions deploy update-order-status

# Set required secrets on Edge Functions
# Get your Service Role key from: Supabase Dashboard > Project Settings > API > service_role
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
supabase secrets set RATE_LIMIT_MAX_REQUESTS=10
supabase secrets set RATE_LIMIT_WINDOW_MS=60000
```

### Option B — Local Development (Docker required)

```bash
# Start local Supabase stack (Postgres + Auth + Storage + Studio)
supabase start

# Apply migrations to local DB
supabase db push

# Seed the local database
psql postgresql://postgres:postgres@localhost:54322/postgres < supabase/seed.sql

# Local Studio available at http://localhost:54323
# Local API available at http://localhost:54321
```

---

## Step 4 — Storage Buckets

In the **Supabase Dashboard → Storage**, create two **public** buckets:

| Bucket name | Purpose | Visibility |
|---|---|---|
| `product-images` | Product photos | Public |
| `store-assets` | UPI QR code, brand assets | Public |

**RLS policies for each bucket:**

```sql
-- Allow anyone to read (public storefront)
CREATE POLICY "Public read" ON storage.objects
  FOR SELECT USING (bucket_id IN ('product-images', 'store-assets'));

-- Allow authenticated admin to manage files
CREATE POLICY "Admin write" ON storage.objects
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

---

## Step 5 — Create First Admin User

Since customer sign-up is disabled (this is an admin-only auth system), you must create the admin manually:

1. Go to **Supabase Dashboard → Authentication → Users**
2. Click **"Add user"** → enter email and a strong password → **Create user**
3. Copy the new user's **UUID** (shown in the users table)
4. Go to **Dashboard → SQL Editor** and run:

```sql
INSERT INTO public.admin_profiles (user_id, display_name, role)
VALUES ('paste-user-uuid-here', 'Founder Name', 'OWNER');
```

5. Log in at `/admin/login` with those credentials

> You can create additional staff accounts the same way, using role `STAFF` instead of `OWNER`.

---

## Step 6 — Run the Dev Server

```bash
npm run dev
# → Local app: http://localhost:5173
# → Admin panel: http://localhost:5173/admin/login
```

---

## Step 7 — Update Store Settings

After logging in to the admin panel:

1. Go to **`/admin/settings`**
2. Update:
   - **UPI ID** — the UPI address customers will pay to
   - **UPI QR Code** — upload to `store-assets` bucket, paste path in settings
   - **Announcement text** — the banner shown on the storefront
   - **Contact email** and **Instagram URL**
3. Go to **`/admin/settings` → Serviceable PIN Codes** → add your delivery areas

---

## Available npm Scripts

```bash
npm run dev          # Start Vite dev server with HMR
npm run build        # Production build → dist/
npm run preview      # Serve the production build locally
npm run type-check   # tsc --noEmit (TypeScript check only)
npm run lint         # ESLint across src/
```

---

## Edge Functions Reference

All functions live at:  
`https://mcnrarmkuyzyycpuvtec.supabase.co/functions/v1/`

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/place-order` | POST | Public | Create a new order |
| `/submit-payment-reference` | POST | Public | Customer submits UTR after paying |
| `/verify-payment` | POST | Admin JWT | Mark payment as verified |
| `/track-order` | GET | Public (rate limited) | Customer order tracking |
| `/update-order-status` | POST | Admin JWT | Change order production status |

**Rate limiting:** `track-order` is rate-limited to `RATE_LIMIT_MAX_REQUESTS` calls per `RATE_LIMIT_WINDOW_MS` milliseconds per IP — set via Edge Function secrets.

---

## Deployment — Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

**Or connect via GitHub:**

1. Push this repo to GitHub
2. Import the repo in [vercel.com/new](https://vercel.com/new)
3. Set environment variables in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_NAME`
   - `VITE_APP_URL` (set to your production domain)

---

## Pre-Launch Checklist

- [ ] Product prices confirmed and status changed from `DRAFT` → `ACTIVE`
- [ ] Real product photos uploaded to `product-images` bucket
- [ ] UPI ID updated in **Admin → Settings**
- [ ] UPI QR code uploaded to `store-assets` bucket, path set in settings
- [ ] Serviceable PIN codes reviewed and confirmed
- [ ] Real admin user created (see Step 5) — delete any test users
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set as an Edge Function secret
- [ ] Custom domain configured in Vercel
- [ ] `VITE_APP_URL` updated to production domain in Vercel env vars

---

## Project Structure

```
e:\MANASARA\
├── src/
│   ├── components/        # Shared UI components
│   │   ├── ui/            # shadcn/ui base components (customised)
│   │   ├── layout/        # Header, Footer, AdminLayout
│   │   └── product/       # ProductCard, ProductGallery, etc.
│   ├── pages/             # Route-level components
│   │   ├── admin/         # Admin panel pages
│   │   └── store/         # Customer-facing pages
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Supabase client, utils, validators
│   ├── store/             # Zustand stores (cart, etc.)
│   └── types/             # Shared TypeScript types
├── supabase/
│   ├── config.toml        # Supabase CLI config
│   ├── migrations/        # Ordered SQL migration files
│   ├── functions/         # Deno Edge Functions
│   └── seed.sql           # Demo data
├── public/                # Static assets
├── .env.local             # Local env vars (not committed)
├── .env.example           # Env var template (committed)
└── vite.config.ts
```

---

## Monetary Values

All prices are stored as **INR paise** (`BIGINT`) in the database.  
Example: ₹299 is stored as `29900`.  
The frontend utility `formatPrice(paise: number)` handles display formatting.

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| No customer auth | Reduces friction; orders tracked by phone + order code |
| UPI-only payments | Fits the Indian handmade gifting market; no payment gateway fees |
| Manual payment verification | Prevents fraud without a payment gateway; founders verify each transaction |
| Paise integers for money | Avoids floating-point rounding errors |
| RLS on all tables | Security enforced at DB level regardless of frontend bugs |
