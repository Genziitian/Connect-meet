# Developer Scope of Work — Detailed
## Social Media Dashboard + Regional Landing Pages + Auto-Embed + Analytics

**Audience:** Dev team / Tech leads
**Version:** 1.0
**Date:** 20 May 2026

---

## Table of Contents

1. [Module 1 — Social Media Metrics + Daily Email](#module-1)
2. [Module 2 — Regional Landing Pages + Conversion Tracking](#module-2)
3. [Module 3 — Instagram Auto-Embed System](#module-3)
4. [Module 4 — Landing Page Analytics + Video Watch Tracking](#module-4)
5. [Shared Infrastructure](#shared-infra)
6. [Cross-Module Dependencies](#dependencies)

---

<a name="module-1"></a>
# MODULE 1 — Social Media Metrics Dashboard + Daily Email Report

## 1.1 Objective
Pull daily engagement metrics from Facebook, Instagram, and YouTube. Display them in a web dashboard and send a templated email report every morning.

## 1.2 User Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| M1-US1 | Marketing Manager | See yesterday's total reach across FB, IG, YT in one place | I don't have to log into 3 platforms |
| M1-US2 | Marketing Manager | Receive a daily email at 9 AM with key metrics | I'm informed without opening the dashboard |
| M1-US3 | Marketing Manager | Compare last 7 days vs previous 7 days | I can spot trends |
| M1-US4 | Marketing Manager | See top 3 performing posts of the week | I know what content works |
| M1-US5 | Admin | Configure which email addresses get the report | The right people are looped in |
| M1-US6 | Admin | Refresh metrics on-demand from the dashboard | I can pull fresh data without waiting for cron |

## 1.3 Functional Requirements

### Metrics to Pull

| Platform | Metric | Source API |
|---|---|---|
| Facebook | Page Impressions, Reach, Page Likes, Post Engagement, Top 5 posts | Graph API `/insights` |
| Facebook | New followers, Page views | Graph API `/insights` |
| Instagram | Profile Views, Reach, Impressions, Followers Gained, Top 5 posts | Instagram Graph API `/insights` |
| Instagram | Reel plays, saves, shares per post | Instagram Graph API |
| YouTube | Video views, watch time, subscribers gained, top 5 videos | YouTube Data API v3 + Analytics API |
| YouTube | Average view duration, click-through rate | YouTube Analytics API |

### Time Windows
- Last 1 day (yesterday 00:00 – 23:59 IST)
- Last 7 days (rolling)
- Last 30 days (rolling)
- Custom range (dashboard only)

### Dashboard Features
- Login (email + password, JWT-based)
- Main dashboard with metric cards (top KPIs)
- Charts: line graph (trend over time), bar chart (per-platform), donut (engagement breakdown)
- "Top Posts" table with thumbnail, caption, link, metrics
- Date range selector
- Manual refresh button
- Export to CSV / PDF
- Settings page (email recipients, schedule time, time zone)

### Email Report
- Sent daily at configurable time (default: 9:00 AM IST)
- HTML email (mobile-responsive)
- PDF attachment with full breakdown
- Subject: `Daily Social Media Report — {{date}}`
- Sections: Headline numbers → Per-platform breakdown → Top posts → Week-over-week comparison

## 1.4 Acceptance Criteria

- [ ] Metrics pull job runs every day at 6 AM IST (3 hrs before email)
- [ ] Email delivered to all configured recipients by 9:05 AM IST
- [ ] Dashboard loads in under 2 seconds with cached data
- [ ] Manual refresh re-fetches all platforms in under 30 seconds
- [ ] If any platform API fails, others still complete + admin gets an error alert
- [ ] All metric numbers in the email match the dashboard exactly
- [ ] PDF attachment is under 2 MB
- [ ] No data loss if cron fails — retry mechanism with exponential backoff
- [ ] Historical data retained for at least 2 years

## 1.5 Database Schema

```sql
-- Connected social accounts
CREATE TABLE social_accounts (
  id              SERIAL PRIMARY KEY,
  platform        VARCHAR(20) NOT NULL,  -- 'facebook' | 'instagram' | 'youtube'
  account_id      VARCHAR(255) NOT NULL,
  account_name    VARCHAR(255),
  access_token    TEXT NOT NULL,         -- encrypted
  refresh_token   TEXT,
  token_expires_at TIMESTAMP,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Daily metric snapshots
CREATE TABLE metric_snapshots (
  id              SERIAL PRIMARY KEY,
  account_id      INT REFERENCES social_accounts(id),
  metric_date     DATE NOT NULL,
  metric_name     VARCHAR(50) NOT NULL,  -- 'reach' | 'impressions' | 'followers' etc.
  metric_value    BIGINT NOT NULL,
  raw_payload     JSONB,                  -- full API response for debugging
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(account_id, metric_date, metric_name)
);

-- Top posts cache
CREATE TABLE top_posts (
  id              SERIAL PRIMARY KEY,
  account_id      INT REFERENCES social_accounts(id),
  post_id         VARCHAR(255) NOT NULL,
  post_url        TEXT,
  thumbnail_url   TEXT,
  caption         TEXT,
  posted_at       TIMESTAMP,
  views           BIGINT,
  likes           BIGINT,
  comments        BIGINT,
  shares          BIGINT,
  engagement_rate DECIMAL(5,2),
  fetched_at      TIMESTAMP DEFAULT NOW()
);

-- Email config
CREATE TABLE email_recipients (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  name            VARCHAR(255),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Job run log
CREATE TABLE job_runs (
  id              SERIAL PRIMARY KEY,
  job_name        VARCHAR(50) NOT NULL,
  status          VARCHAR(20) NOT NULL,   -- 'success' | 'failed' | 'partial'
  started_at      TIMESTAMP,
  ended_at        TIMESTAMP,
  error_message   TEXT,
  details         JSONB
);
```

## 1.6 API Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Login |
| GET | `/api/metrics/summary?range=7d` | Get aggregated metrics |
| GET | `/api/metrics/platform/:platform?range=7d` | Per-platform metrics |
| GET | `/api/posts/top?platform=instagram&limit=5` | Top posts |
| POST | `/api/metrics/refresh` | Trigger manual refresh |
| GET | `/api/email/recipients` | List recipients |
| POST | `/api/email/recipients` | Add recipient |
| DELETE | `/api/email/recipients/:id` | Remove recipient |
| POST | `/api/email/test` | Send test email |
| GET | `/api/export/pdf?range=7d` | Download PDF |

## 1.7 Task Breakdown (Dev Hours)

| # | Task | Hours |
|---|---|---|
| 1 | Project setup (repo, CI/CD, env config) | 8 |
| 2 | Auth system (login, JWT, roles) | 12 |
| 3 | Facebook API integration + token refresh | 16 |
| 4 | Instagram API integration + token refresh | 20 |
| 5 | YouTube API integration | 14 |
| 6 | Daily cron job + retry logic | 10 |
| 7 | Metric normalization layer | 8 |
| 8 | Dashboard UI — main + charts | 24 |
| 9 | Top posts UI + filtering | 8 |
| 10 | Settings page (recipients, schedule) | 6 |
| 11 | HTML email template + responsive design | 12 |
| 12 | PDF generation (Puppeteer / wkhtmltopdf) | 8 |
| 13 | SendGrid integration + delivery tracking | 6 |
| 14 | Manual refresh endpoint + UI | 4 |
| 15 | Error handling + admin alerts | 6 |
| 16 | Unit + integration tests | 16 |
| 17 | QA + bug fixes | 12 |
| **Total** | | **190 hours (~4 weeks for 1 dev)** |

## 1.8 Challenges

| Challenge | Impact | Mitigation |
|---|---|---|
| Meta access tokens expire every 60 days | High | Auto-refresh via long-lived token endpoint |
| API rate limits (200/hr/user on Meta) | Medium | Cache aggressively in DB; only refresh delta |
| Instagram requires Business account | Critical | Validate in onboarding step |
| YouTube Analytics API needs OAuth (not API key) | Medium | Build OAuth flow with refresh tokens |
| Time zone confusion (UTC vs IST) | Medium | Store everything in UTC; convert in UI |
| Email deliverability to Gmail/Outlook | Medium | Set up SPF, DKIM, DMARC on sending domain |
| PDF generation can be slow | Low | Generate async, attach to email when ready |

---

<a name="module-2"></a>
# MODULE 2 — Regional Language Landing Pages + Conversion Tracking

## 2.1 Objective
Build a templated landing page system that supports multiple regional languages, each tracked separately for conversions, with a non-technical admin able to edit copy.

## 2.2 User Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| M2-US1 | Visitor | See the landing page in my regional language | I understand the offer |
| M2-US2 | Visitor | Submit my contact details easily | I can get more info |
| M2-US3 | Marketing Manager | Update the page copy without calling a developer | I can A/B test quickly |
| M2-US4 | Marketing Manager | See conversion rate per language | I know which markets are working |
| M2-US5 | Marketing Manager | Track which ad campaign drove a conversion | I can attribute ROI |
| M2-US6 | Admin | Add a new language without code changes | Expand easily |

## 2.3 Functional Requirements

### Languages (Phase 1)
- English (`/en`)
- Hindi (`/hi`)
- Tamil (`/ta`)
- Telugu (`/te`)
- Bengali (`/bn`)
- Marathi (`/mr`)

> Add more on demand. Each new language = ~4 hrs work (CMS entry + QA).

### Page Sections (per language)
1. Hero banner (heading + subheading + CTA)
2. Video showcase (top 6 videos — populated from Module 3)
3. Features / Benefits (3–6 cards)
4. Testimonials (carousel)
5. Lead capture form
6. FAQ
7. Footer

### Form Fields
- Full name (required)
- Phone (required, 10 digits, Indian format validation)
- Email (optional)
- City (optional)
- Language preference (auto-filled from page)
- UTM parameters (hidden, auto-captured)

### Conversion Tracking
- Each form submission stored in DB with language + UTM source
- Conversion dashboard shows: submissions per language, per source, per day
- CSV export of leads
- Optional: send each lead to client's CRM via webhook

## 2.4 Acceptance Criteria

- [ ] Each language page loads in under 1.5 seconds on 4G
- [ ] Lighthouse score: Performance > 85, Accessibility > 90
- [ ] All form fields validate client-side AND server-side
- [ ] Indic font rendering works on Android 8+ and iOS 13+
- [ ] hreflang tags correctly set in HTML head
- [ ] Conversion data captured 100% (zero loss on form submit)
- [ ] Admin can add/edit page content from CMS without dev help
- [ ] UTM parameters from URL captured in lead record
- [ ] Spam protection (reCAPTCHA v3 or honeypot)
- [ ] GDPR/DPDP cookie consent banner present

## 2.5 Database Schema

```sql
-- Landing page content (CMS)
CREATE TABLE landing_pages (
  id              SERIAL PRIMARY KEY,
  language_code   VARCHAR(5) UNIQUE NOT NULL,  -- 'en', 'hi', 'ta'
  language_name   VARCHAR(50) NOT NULL,
  slug            VARCHAR(100) UNIQUE NOT NULL,
  is_active       BOOLEAN DEFAULT true,
  meta_title      VARCHAR(255),
  meta_description TEXT,
  content_json    JSONB NOT NULL,             -- all page sections
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Leads / conversions
CREATE TABLE leads (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  phone           VARCHAR(20) NOT NULL,
  email           VARCHAR(255),
  city            VARCHAR(100),
  language_code   VARCHAR(5) NOT NULL,
  utm_source      VARCHAR(100),
  utm_medium      VARCHAR(100),
  utm_campaign    VARCHAR(100),
  utm_content     VARCHAR(100),
  ip_address      INET,
  user_agent      TEXT,
  referrer        TEXT,
  submitted_at    TIMESTAMP DEFAULT NOW(),
  pushed_to_crm   BOOLEAN DEFAULT false
);

-- Page view tracking (lightweight, for fast conversion-rate math)
CREATE TABLE page_views (
  id              BIGSERIAL PRIMARY KEY,
  language_code   VARCHAR(5) NOT NULL,
  session_id      VARCHAR(64) NOT NULL,
  utm_source      VARCHAR(100),
  viewed_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leads_lang_date ON leads(language_code, submitted_at);
CREATE INDEX idx_views_lang_date ON page_views(language_code, viewed_at);
```

## 2.6 API Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/page/:lang` | Fetch page content (public) |
| POST | `/api/lead` | Submit form (public) |
| GET | `/api/admin/leads?lang=hi&from=...&to=...` | List leads (admin) |
| GET | `/api/admin/conversions/stats` | Conversion stats per lang |
| GET | `/api/admin/leads/export.csv` | Export leads |
| PUT | `/api/admin/page/:lang` | Update page content (admin) |
| POST | `/api/admin/page` | Add new language |

## 2.7 Task Breakdown (Dev Hours)

| # | Task | Hours |
|---|---|---|
| 1 | Next.js setup with i18n routing | 6 |
| 2 | Page template — responsive design | 20 |
| 3 | Indic font setup + cross-browser testing | 8 |
| 4 | CMS setup (Strapi or custom admin) | 16 |
| 5 | Content seeding for 6 languages (assumes client provides text) | 12 |
| 6 | Lead form with validation | 8 |
| 7 | UTM capture + storage | 4 |
| 8 | reCAPTCHA v3 integration | 4 |
| 9 | hreflang + SEO meta tags | 4 |
| 10 | Cookie consent banner (DPDP-compliant) | 6 |
| 11 | Admin dashboard for leads + filtering | 12 |
| 12 | CSV export | 4 |
| 13 | CRM webhook integration (optional) | 6 |
| 14 | Conversion stats dashboard | 8 |
| 15 | Performance optimization (image lazy load, code split) | 8 |
| 16 | QA — cross-browser, cross-device | 12 |
| **Total** | | **138 hours (~3 weeks for 1 dev)** |

## 2.8 Challenges

| Challenge | Mitigation |
|---|---|
| Indic font file sizes (Devanagari fonts can be 200KB+) | Subset fonts, use font-display: swap |
| Translation quality | Client-provided or budget for professional translator |
| RTL languages (if Urdu added later) | Build CSS with logical properties from start |
| Form spam from bots | reCAPTCHA + rate limiting + IP block list |
| SEO duplication penalty | hreflang + canonical tags done correctly |
| Mobile keyboard for Indic input | Test on real devices |

---

<a name="module-3"></a>
# MODULE 3 — Instagram Auto-Embed System

## 3.1 Objective
Automatically detect new videos/Reels posted on the client's Instagram account and embed them on the landing pages within 30 minutes of upload.

## 3.2 User Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| M3-US1 | Marketing Manager | New IG videos to auto-show on landing pages | I don't manually update the site |
| M3-US2 | Marketing Manager | Pin / unpin specific videos | I can feature campaign content |
| M3-US3 | Marketing Manager | Hide a video without deleting from Instagram | I have control |
| M3-US4 | Visitor | See the latest 6 videos on the landing page | I see fresh content |
| M3-US5 | Developer | Sync to fail gracefully if Instagram is down | The page still loads |

## 3.3 Functional Requirements

- Poll Instagram Graph API every 30 minutes for new posts
- Filter for `VIDEO` and `REEL` media types only
- Store metadata (id, permalink, thumbnail, caption, timestamp)
- Render top 6 latest videos in a grid on landing pages
- Admin can:
  - Pin up to 2 videos (always show first)
  - Hide any video
  - Override the auto-feed manually
- Embed using Instagram oEmbed for proper rendering
- Lazy load videos (only load when scrolled into view)

## 3.4 Acceptance Criteria

- [ ] New IG video appears on landing page within 35 mins of upload
- [ ] If IG API is down, last-known videos still render (cached)
- [ ] Admin pin/hide changes reflect on live page within 1 min
- [ ] No layout shift when videos load (proper aspect ratio reserved)
- [ ] Works on Safari, Chrome, Firefox, Edge (last 2 versions)
- [ ] Token auto-refreshes 7 days before expiry — no manual intervention
- [ ] Failures logged + admin notified via email

## 3.5 Database Schema

```sql
CREATE TABLE instagram_media (
  id              VARCHAR(255) PRIMARY KEY,   -- IG media id
  media_type      VARCHAR(20) NOT NULL,       -- 'VIDEO' | 'REEL' | 'IMAGE' | 'CAROUSEL'
  permalink       TEXT NOT NULL,
  thumbnail_url   TEXT,
  media_url       TEXT,
  caption         TEXT,
  posted_at       TIMESTAMP NOT NULL,
  is_pinned       BOOLEAN DEFAULT false,
  is_hidden       BOOLEAN DEFAULT false,
  display_order   INT,                        -- for manual reordering
  embed_html      TEXT,                       -- cached oEmbed HTML
  last_synced_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ig_visible ON instagram_media(is_hidden, posted_at DESC) WHERE is_hidden = false;
```

## 3.6 API Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/videos/latest?limit=6` | Public — fetch videos for landing page |
| POST | `/api/admin/videos/sync` | Manual trigger sync |
| PUT | `/api/admin/videos/:id/pin` | Pin a video |
| PUT | `/api/admin/videos/:id/hide` | Hide a video |
| PUT | `/api/admin/videos/reorder` | Manual reorder |
| GET | `/api/admin/videos/sync-logs` | View sync history |

## 3.7 Sync Job Flow

```
[Cron every 30 min]
       │
       ▼
[Call IG Graph API: GET /me/media?fields=id,media_type,permalink,thumbnail_url,timestamp,caption]
       │
       ▼
[Filter: only VIDEO + REEL, last 30 days]
       │
       ▼
[Diff against DB — find new ones]
       │
       ▼
[For each new: call oEmbed endpoint → cache HTML]
       │
       ▼
[Insert/update DB]
       │
       ▼
[Invalidate CDN cache for /api/videos/latest]
```

## 3.8 Task Breakdown (Dev Hours)

| # | Task | Hours |
|---|---|---|
| 1 | Meta App registration + review submission | 6 |
| 2 | OAuth flow for Instagram Business account | 8 |
| 3 | Long-lived token + auto-refresh logic | 6 |
| 4 | Polling cron job | 6 |
| 5 | oEmbed integration + HTML caching | 8 |
| 6 | DB schema + migrations | 3 |
| 7 | Frontend video grid component | 10 |
| 8 | Admin UI — pin/hide/reorder | 12 |
| 9 | CDN cache invalidation | 4 |
| 10 | Error handling + fallback to cache | 6 |
| 11 | Token expiry email alerts | 3 |
| 12 | QA across browsers | 8 |
| **Total** | | **80 hours (~2 weeks for 1 dev)** |

> + **2–4 weeks blocking time** for Meta App Review (runs parallel to dev)

## 3.9 Challenges

| Challenge | Severity | Mitigation |
|---|---|---|
| Meta App Review can reject | HIGH | Submit clear use-case demo video; have alternate plan B (manual embed) |
| Instagram changes API frequently | HIGH | Abstract API behind adapter pattern |
| Token expiry mid-cycle | MEDIUM | Auto-refresh 7 days early; admin alert if fails |
| oEmbed HTML has Instagram branding | LOW | Set client expectation upfront |
| Rate limits during high polling | MEDIUM | Cache responses; only fetch if new content likely |
| Some videos not embedable (private accounts) | LOW | Skip + log |

---

<a name="module-4"></a>
# MODULE 4 — Landing Page Analytics + Video Watch Tracking

## 4.1 Objective
Track every page view, scroll depth, video interaction, and conversion. Surface insights in the admin dashboard.

## 4.2 User Stories

| ID | As a... | I want to... | So that... |
|---|---|---|---|
| M4-US1 | Marketing Manager | See page views per language per day | I know which markets are getting traffic |
| M4-US2 | Marketing Manager | See which videos visitors actually watched | I know what content engages |
| M4-US3 | Marketing Manager | See watch percentage (25/50/75/100%) per video | I know where viewers drop off |
| M4-US4 | Marketing Manager | See conversion funnel: View → Engage → Submit | I can optimize each step |
| M4-US5 | Marketing Manager | Track which UTM source converts best | I can reallocate ad budget |

## 4.3 Functional Requirements

### Page-Level Tracking
- Page views (per language, per day, per hour)
- Unique visitors (via session + cookie)
- Bounce rate
- Average time on page
- Scroll depth (25/50/75/100%)
- Referrer + UTM tracking

### Video-Level Tracking
- Video impression (loaded into viewport)
- Video click-to-play
- Watch milestones (25%, 50%, 75%, 100%) — for YouTube embeds & self-hosted
- For Instagram embeds: only "clicked-to-play" event is possible (API limit)

### Conversion Tracking
- Form view (user scrolled to form)
- Form start (user focused first field)
- Form submit attempt
- Form submit success
- Funnel: Page View → Form View → Form Start → Form Submit

### Dashboards
- Realtime visitor count
- Daily/weekly/monthly view trends
- Per-language breakdown
- Per-video performance table
- Conversion funnel visualization
- UTM source performance

## 4.4 Acceptance Criteria

- [ ] Events captured even if user closes tab (use `navigator.sendBeacon`)
- [ ] Less than 1% event loss
- [ ] Dashboard queries return in under 2 sec for last 30 days
- [ ] Works without GA4 (custom tracking is primary)
- [ ] Cookie consent honored — no tracking if user opts out
- [ ] Bot traffic filtered (user-agent check + behavior heuristics)
- [ ] PII not stored in analytics tables (only session IDs)

## 4.5 Database Schema

```sql
-- Raw events (high volume — partition by date)
CREATE TABLE analytics_events (
  id              BIGSERIAL PRIMARY KEY,
  session_id      VARCHAR(64) NOT NULL,
  event_type      VARCHAR(50) NOT NULL,    -- 'page_view' | 'video_play' | 'video_progress' | 'form_submit' etc.
  event_data      JSONB,                    -- flexible payload
  language_code   VARCHAR(5),
  page_path       VARCHAR(255),
  video_id        VARCHAR(255),            -- if event is video-related
  utm_source      VARCHAR(100),
  utm_medium      VARCHAR(100),
  utm_campaign    VARCHAR(100),
  device_type     VARCHAR(20),             -- 'mobile' | 'tablet' | 'desktop'
  country         VARCHAR(50),
  occurred_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_session ON analytics_events(session_id);
CREATE INDEX idx_events_type_date ON analytics_events(event_type, occurred_at);
CREATE INDEX idx_events_lang_date ON analytics_events(language_code, occurred_at);

-- Pre-aggregated daily stats (for fast dashboard queries)
CREATE TABLE daily_stats (
  stat_date       DATE NOT NULL,
  language_code   VARCHAR(5) NOT NULL,
  page_views      INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  bounce_count    INT DEFAULT 0,
  avg_duration_s  INT DEFAULT 0,
  conversions     INT DEFAULT 0,
  PRIMARY KEY (stat_date, language_code)
);

-- Video performance rollup
CREATE TABLE video_stats (
  stat_date       DATE NOT NULL,
  video_id        VARCHAR(255) NOT NULL,
  impressions     INT DEFAULT 0,
  plays           INT DEFAULT 0,
  watched_25      INT DEFAULT 0,
  watched_50      INT DEFAULT 0,
  watched_75      INT DEFAULT 0,
  watched_100     INT DEFAULT 0,
  PRIMARY KEY (stat_date, video_id)
);
```

## 4.6 API Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/track` | Public — receive event (via sendBeacon) |
| GET | `/api/admin/analytics/overview?range=30d` | Dashboard top numbers |
| GET | `/api/admin/analytics/by-language?range=30d` | Per-language breakdown |
| GET | `/api/admin/analytics/videos?range=30d` | Per-video performance |
| GET | `/api/admin/analytics/funnel?lang=hi&range=30d` | Conversion funnel |
| GET | `/api/admin/analytics/realtime` | Last 30 min activity |

## 4.7 Client-Side Tracker

```js
// Minimal tracking script (loaded on landing pages)
window.track = (eventType, data) => {
  navigator.sendBeacon('/api/track', JSON.stringify({
    session_id: getSessionId(),
    event_type: eventType,
    event_data: data,
    language_code: document.documentElement.lang,
    page_path: window.location.pathname,
    utm: getUTM(),
    device_type: getDeviceType(),
    occurred_at: Date.now()
  }));
};

// Auto-fired events:
// - page_view (on load)
// - scroll_depth (at 25/50/75/100%)
// - video_play, video_progress (via player API)
// - form_focus, form_submit
// - exit_intent (mouse leaves window)
```

## 4.8 Task Breakdown (Dev Hours)

| # | Task | Hours |
|---|---|---|
| 1 | Event tracking script (client-side) | 10 |
| 2 | Backend `/api/track` endpoint + validation | 6 |
| 3 | DB schema + partitioning strategy | 6 |
| 4 | Hourly rollup cron job (raw → daily_stats) | 8 |
| 5 | Video tracking — YouTube IFrame API integration | 8 |
| 6 | Video tracking — IG embed (clicks only) | 4 |
| 7 | Analytics overview dashboard UI | 12 |
| 8 | Per-language breakdown UI | 6 |
| 9 | Per-video performance table | 8 |
| 10 | Conversion funnel visualization | 10 |
| 11 | Realtime visitor counter (WebSocket or polling) | 8 |
| 12 | Bot filtering logic | 4 |
| 13 | GA4 setup (parallel, optional) | 4 |
| 14 | Cookie consent integration | 4 |
| 15 | Testing + QA | 12 |
| **Total** | | **110 hours (~2.5 weeks for 1 dev)** |

## 4.9 Challenges

| Challenge | Mitigation |
|---|---|
| Instagram embeds don't expose watch progress | Document limitation; only track clicks |
| sendBeacon not supported on old browsers | Fallback to fetch with keepalive |
| Ad-blockers strip GA4 | Server-side custom tracking as primary |
| Event volume can balloon | Partition tables by date; aggregate hourly |
| Privacy compliance (DPDP, GDPR) | Cookie consent + no PII in events |
| Distinguishing bots from real users | User-agent + heuristics (mouse movement, time on page) |

---

<a name="shared-infra"></a>
# Shared Infrastructure

## Tech Stack (consolidated)

| Layer | Tech |
|---|---|
| Frontend Dashboard | React 18 + Vite + TailwindCSS + Recharts |
| Landing Pages | Next.js 15 + i18next |
| Backend | Node.js 20 + Express + TypeScript |
| Database | PostgreSQL 16 |
| Cache | Redis (sessions + API response cache) |
| Queue | BullMQ (for jobs + retries) |
| Email | SendGrid |
| Hosting | Render OR Railway OR AWS (EC2 + RDS) |
| CDN | Cloudflare |
| Monitoring | Sentry (errors) + Uptime Robot |

## Environments
- **Local** (developer machines)
- **Staging** (auto-deploy from `develop` branch)
- **Production** (auto-deploy from `main` branch, with manual approval)

## CI/CD
- GitHub Actions: lint → test → build → deploy
- Database migrations via Prisma / Knex
- Secrets in environment variables (not committed)

---

<a name="dependencies"></a>
# Cross-Module Dependencies

```
Module 1 (Metrics)
      │
      └─► provides → social account credentials → Module 3 (uses IG token)

Module 3 (IG Auto-Embed)
      │
      └─► provides → video list → Module 2 (landing pages render videos)
                                  Module 4 (tracks watch on those videos)

Module 2 (Landing Pages)
      │
      └─► provides → page structure → Module 4 (analytics inject tracker)

Module 4 (Analytics)
      │
      └─► provides → conversion data → Module 1 dashboard (cross-channel view)
```

**Build order recommendation:**
1. Module 1 (foundation: auth + DB + API patterns)
2. Module 2 (landing pages — independent)
3. Module 3 (depends on IG token from Module 1)
4. Module 4 (depends on Module 2 + 3 being live)

---

# Totals

| Module | Dev Hours | Calendar Time (1 dev) |
|---|---|---|
| Module 1 | 190 | 4 weeks |
| Module 2 | 138 | 3 weeks |
| Module 3 | 80 | 2 weeks |
| Module 4 | 110 | 2.5 weeks |
| **Total** | **518 hrs** | **~11.5 weeks (1 dev)** |
| With 2 devs in parallel | — | **~6–7 weeks** |
| With 3 devs in parallel | — | **~4–5 weeks** |

---

*End of Document — v1.0*
