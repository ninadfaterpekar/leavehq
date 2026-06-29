# LeaveHQ — Setup Guide

## Stack
- **Next.js 14** — framework + API routes
- **Supabase** — database, auth, row-level security
- **Resend** — transactional email
- **Vercel** — hosting
- **Reliability Design System** — UI components

---

## Step 1 — Clone and install

```bash
git clone <your-repo-url>
cd leavehq
npm install
```

---

## Step 2 — Environment variables

Copy the template:
```bash
cp .env.local.example .env.local
```

Fill in your values:
```
NEXT_PUBLIC_SUPABASE_URL=         # Supabase → Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase → Settings → API → anon public
SUPABASE_SERVICE_ROLE_KEY=        # Supabase → Settings → API → service_role (keep secret)
RESEND_API_KEY=                   # Resend → API Keys
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 3 — Set up Supabase

1. Go to **supabase.com** → your project → **SQL Editor**
2. Click **New query**
3. Paste the entire contents of `supabase-schema.sql`
4. Click **Run**

This creates your tables, RLS policies, and triggers.

---

## Step 4 — Create users

In Supabase → **Authentication → Users → Add user**, create:

| Email | Password | Name |
|---|---|---|
| admin@leavehq.com | password123 | Sarah Admin |
| manager@leavehq.com | password123 | Mark Manager |
| supervisor@leavehq.com | password123 | Sam Supervisor |
| employee1@leavehq.com | password123 | Jamie Employee |
| employee2@leavehq.com | password123 | Alex Employee |

Then go back to **SQL Editor** and run the update statements at the bottom of `supabase-schema.sql` to set names, roles, allowances, and manager relationships.

---

## Step 5 — Set up Resend

1. Go to **resend.com** → **Domains** → add your domain (or use the sandbox for testing)
2. Update `lib/email.ts` — change `noreply@yourdomain.com` to your verified sender

For local testing without a domain, Resend lets you send to your own email from the sandbox.

---

## Step 6 — Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with any user you created.

---

## Step 7 — Deploy to Vercel

1. Push your code to GitHub
2. Go to **vercel.com** → **Add New Project** → import your repo
3. In **Environment Variables**, add all four values from your `.env.local`
4. Change `NEXT_PUBLIC_APP_URL` to your Vercel URL (e.g. `https://leavehq.vercel.app`)
5. Click **Deploy**

Vercel auto-deploys on every push to main.

---

## User roles

| Role | Can do |
|---|---|
| Employee | Request leave, view own history and balance |
| Supervisor | Same as employee + approve their team's requests |
| Manager | Same as supervisor + receives email for their team |
| Admin | Everything + manage users, roles, allowances in admin panel |

---

## Adding new features

Write a Design MD for the next feature, then create the page file and API route. The pattern is:

- Pages live in `app/[feature]/page.tsx`
- API routes live in `app/api/[feature]/route.ts`  
- Shared logic lives in `lib/`
- Types live in `types/index.ts`
