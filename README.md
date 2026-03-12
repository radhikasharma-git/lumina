# ✦ Lumina — Your Personal Manifestation Coach

A private, beautifully designed journaling and coaching app built at the intersection of neuroscience, psychology, and conscious creation. Inspired by the teachings of Neville Goddard, Joe Dispenza, Stephen Murphy and coaches like Emily Mcdonald, Genevieve, and the real lived experience of manifestation communities.

---

## What it does

- **Daily check-ins** — log your mood and thoughts, get a personalised response from your AI coach
- **Full coaching memory** — Lumina reads your entire journal history before responding, so advice builds forward instead of starting from scratch every time
- **Mood timeline** — visualise your emotional arc over time as a chart
- **Techniques library** — SATS, Revision, Identity Scripting, Mental Diet, Somatic Anchoring, Parts Dialogue
- **Intentions tracker** — set and track your manifestation goals
- **Multi-user** — each person creates their own private profile, all data stored separately
- **Permanent storage** — everything saved to Supabase, nothing tied to a browser tab

---

## Tech stack

| Layer | Tool |
|---|---|
| Frontend | Vanilla HTML/CSS/JS (single file) |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel |
| AI Coach | Anthropic Claude (claude-opus-4-6) |

---

## Setup

### 1. Supabase

Create a free project at [supabase.com](https://supabase.com) and run this SQL:

```sql
create table profiles (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  pin_hash text not null,
  name text, age integer, gender text, exp text, focus text, block text, dob text,
  created_at timestamptz default now()
);

create table entries (
  id uuid default gen_random_uuid() primary key,
  username text not null references profiles(username) on delete cascade,
  date text, ts bigint, mood text, text text, coach_reply text, backfilled boolean default false,
  created_at timestamptz default now()
);

create table goals (
  id uuid default gen_random_uuid() primary key,
  username text not null references profiles(username) on delete cascade,
  goal_id bigint, text text, done boolean default false,
  created_at timestamptz default now()
);

create table settings (
  key text primary key,
  value text
);

alter table profiles enable row level security;
alter table entries enable row level security;
alter table goals enable row level security;
alter table settings enable row level security;

create policy "open" on profiles for all using (true) with check (true);
create policy "open" on entries for all using (true) with check (true);
create policy "open" on goals for all using (true) with check (true);
create policy "open" on settings for all using (true) with check (true);

alter table entries add constraint entries_username_ts_unique unique (username, ts);
```

### 2. Add your credentials

In `index.html`, find these two lines near the top of the `<script>` block and replace with your own values:

```js
const SUPA_URL = 'your-supabase-project-url';
const SUPA_KEY = 'your-supabase-anon-key';
```

### 3. Deploy to Vercel

Connect this repo to [vercel.com](https://vercel.com) and deploy. No build step needed — it's a single static HTML file.

### 4. Add your Anthropic API key

Once deployed, open the app, sign in, go to **Goals → App Settings** and paste your Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com)). This is saved to Supabase and shared across all users of your app — you only need to do this once.

---

## Usage

- Open the app URL and create a profile (New Profile)
- Complete the onboarding — name, experience level, focus area, biggest block
- Check in daily with your mood and thoughts
- Lumina responds with personalised coaching drawing on your full history
- View your mood arc in the Timeline tab
- Set manifestation intentions in the Goals tab
- Export your journal anytime as JSON from Goals → Journal Data

---

## Privacy

All user data is private to each profile. Passwords are hashed client-side before storage. No analytics, no ads, no tracking.

---

## License

Personal use. Built with ✦ and intention.
