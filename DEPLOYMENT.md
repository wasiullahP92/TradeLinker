# TradeLinker — Deployment & Production Operations Guide
**Connecting People with Trusted Professionals**  
*Authored for Techminds Founders: Wasi Ullah & Hamad Ullah*

---

## 1. Architecture Overview

TradeLinker is architected as a **high-performance, zero-build-friction, responsive modular web application** backed by a BaaS (Backend-as-a-Service) architecture:
- **Frontend Layer:** Semantic HTML5, CSS3 with TradeLinker Design Tokens, Vanilla JavaScript (ES6+ modular).
- **Styling Architecture:** Curated HSL Design System, responsive grid/flexbox layouts, reduced-motion accessibility, and glassmorphism overlays.
- **Persistence Layer:** Dual-mode architecture:
  1. *Immediate Zero-Config Mode:* Built-in local persistence engine (`localStorage` / `sessionStorage`) allowing instant preview, offline testing, and automated test suite execution without database latency.
  2. *Production BaaS Mode:* PostgreSQL 15 schema with Row Level Security (RLS) policies configured for **Supabase**.
- **Hosting Target:** **Vercel** / **Netlify** / **GitHub Pages** with static routing rules and security headers.

---

## 2. Production Database Setup (Supabase)

### Step 2.1: Provision Supabase Project
1. Go to [Supabase](https://supabase.com/) and sign in.
2. Create a new organization and project (e.g., `tradelinker-prod`).
3. Select your preferred database region (e.g., `ap-southeast-1` Singapore or nearest region to Pakistan).
4. Save your database password securely.

### Step 2.2: Execute Schema & Row Level Security (RLS)
1. Open the Supabase Dashboard &rarr; **SQL Editor**.
2. Click **New query**.
3. Copy the entire contents of [`supabase-schema.sql`](./supabase-schema.sql).
4. Click **Run**.
5. Verify in **Table Editor** that the following tables and RLS policies are active:
   - `public.users`
   - `public.provider_profiles`
   - `public.categories` (pre-seeded with all 6 core categories)
   - `public.service_listings`
   - `public.bookings`
   - `public.reviews`
   - `public.messages`
   - `public.disputes`
   - `public.admin_audit_logs`

### Step 2.3: Storage Buckets Setup
1. In Supabase Dashboard, navigate to **Storage**.
2. Create two buckets:
   - `provider-verification-documents` (Private, restricted to uploaders and admins).
   - `user-avatars` (Public).

---

## 3. Deployment to Vercel

TradeLinker includes a pre-configured [`vercel.json`](./vercel.json) file with security headers, clean URLs, and HTTP caching.

### Method A: Deploy via GitHub (Recommended)
1. Push the `TradeLinker` repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: TradeLinker MVP complete with Reloader, Admin, and Booking systems"
   git branch -M main
   git remote add origin https://github.com/your-org/tradelinker.git
   git push -u origin main
   ```
2. Go to [Vercel](https://vercel.com/) and click **Add New &rarr; Project**.
3. Import your `tradelinker` repository.
4. **Build & Development Settings:**
   - Framework Preset: **Other**
   - Root Directory: `./`
   - Build Command: Leave blank (static web app)
   - Output Directory: `./`
5. **Environment Variables:** Add the values from `.env.example`.
6. Click **Deploy**.

### Method B: Deploy via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 4. Environment Variables Reference

| Variable Name | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `VITE_SUPABASE_URL` | Yes (Production) | Supabase project API URL | `https://xyzcompany.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Yes (Production) | Public anon key for client requests | `eyJhbGciOi...` |
| `VITE_APP_URL` | Yes (Production) | Canonical production domain | `https://tradelinker.vercel.app` |
| `VITE_SUPPORT_EMAIL` | Optional | Platform support contact | `support@tradelinker.com` |

---

## 5. Post-Deployment Verification Checklist

- [ ] **Home Navigation:** Homepage loads branding, hero search, category grid, and featured pros.
- [ ] **Authentication:** Customer, Provider, and Admin accounts can sign in and sign out.
- [ ] **Role Protection:** Unauthenticated users are redirected to `auth.html`; unauthorized roles cannot open `admin-dashboard.html`.
- [ ] **Search Engine:** Filter by category, location, and rating updates results in real-time.
- [ ] **Booking Request Flow:** Customer can submit booking; provider sees request in real-time.
- [ ] **Booking Transitions:** Provider accepts & completes service; customer submits verified 5-star review.
- [ ] **Admin Operations:** Admin can suspend account with documented justification; toggle categories; review verifications.
- [ ] **Reloader System:** Orbital spinner, refresh control, and fallback cards operate cleanly with zero layout shift.
