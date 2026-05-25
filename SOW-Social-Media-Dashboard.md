# Scope of Work (SOW)
## Social Media Analytics Dashboard, Automated Reporting & Regional Landing Pages

**Prepared for:** Client
**Prepared by:** [Your Name / Agency]
**Date:** 20 May 2026
**Document Version:** 1.0

---

## 1. Project Overview

The client requires an integrated system that:

1. **Pulls daily engagement metrics** from Facebook, Instagram, and YouTube and delivers them as an automated daily email + live dashboard.
2. **Hosts regional-language landing pages** with per-language conversion tracking.
3. **Auto-embeds new Instagram videos** on the landing pages whenever a new video is uploaded.
4. **Tracks landing page analytics**, including page views and individual video watch behavior (which video, how long watched).

The system will be built as **4 independent modules** that integrate into one admin dashboard.

---

## 2. Module Breakdown

### MODULE 1 — Social Media Metrics Dashboard + Daily Email Report

#### 2.1 Requirements
| # | Requirement |
|---|---|
| 1 | Pull metrics from Facebook Page, Instagram Business Account, YouTube Channel |
| 2 | Time windows: Last 1 day, Last 7 days, Last 30 days |
| 3 | Metrics: Views, Likes, Comments, Shares, Reach, Followers gained/lost, Top-performing post |
| 4 | Web dashboard with charts (line, bar, donut) |
| 5 | Daily automated email at a fixed time (e.g., 9:00 AM IST) |
| 6 | PDF/HTML report attached to the email |
| 7 | Multi-recipient email support (CC/BCC list configurable) |

#### 2.2 How It Works
```
[Meta Graph API]  ─┐
[YouTube Data API] ─┼──► [Backend - Node.js / FastAPI]
[Instagram Graph]  ─┘           │
                                ▼
                         [PostgreSQL DB]
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        [Dashboard UI]   [Email Service]   [Scheduled Cron Job]
         (React/Next)     (SendGrid)        (Daily 9 AM IST)
```

**Flow:**
1. A scheduled cron job runs every morning at 9 AM IST.
2. Backend fetches metrics from each platform's API for the previous day + last 7 days.
3. Data is stored in DB (so historical comparisons are possible).
4. A templated HTML email is generated with metric cards + charts.
5. Email is sent via SendGrid/Mailgun to the configured recipient list.
6. Same data is rendered live in the web dashboard with filters.

#### 2.3 Challenges
| Challenge | Mitigation |
|---|---|
| **Instagram API requires Business/Creator account** linked to Facebook Page | Confirm with client before kickoff |
| **Meta API rate limits** (200 calls/hour/user) | Cache data in DB; batch requests |
| **Access token expiry** (60-day Instagram tokens) | Build auto-refresh mechanism |
| **Metric naming differs across platforms** ("Reach" vs "Impressions") | Normalize into a unified schema |
| **YouTube Shorts vs long-form metrics** are reported differently | Separate breakdown in dashboard |

---

### MODULE 2 — Regional Language Landing Pages + Conversion Tracking

#### 2.4 Requirements
| # | Requirement |
|---|---|
| 1 | Separate landing page per regional language (e.g., Hindi, Tamil, Telugu, Bengali, Marathi, English) |
| 2 | Each page has its own URL slug (e.g., `/hi`, `/ta`, `/te`) |
| 3 | CMS or admin panel to update copy/images per language without dev help |
| 4 | Lead capture form (Name, Phone, Email, Language) |
| 5 | Conversion tracking — submissions counted per language |
| 6 | UTM parameter support for tracking ad campaigns |
| 7 | Mobile-first responsive design |

#### 2.5 How It Works
1. A shared landing page template is built once.
2. Each language has its own content stored in a CMS (Strapi / Sanity / Contentful) or JSON files.
3. URL routing (`/[lang]`) loads the correct content.
4. Form submissions hit the backend with the language code attached.
5. Conversions per language are stored and shown in the admin dashboard.

#### 2.6 Challenges
| Challenge | Mitigation |
|---|---|
| **Font rendering for Indic scripts** (Devanagari, Tamil etc.) | Use Google Noto fonts; test on low-end Android |
| **Translation quality** | Client provides translations OR we use a vendor (extra cost) |
| **SEO per language** | hreflang tags + language-specific meta tags |
| **CMS learning curve** for non-technical client | 1 training session included |

---

### MODULE 3 — Instagram Auto-Embed System

#### 2.7 Requirements
| # | Requirement |
|---|---|
| 1 | Auto-detect new Instagram videos/Reels uploaded on the client's account |
| 2 | Auto-embed them on relevant landing pages (or a "Latest Videos" section) |
| 3 | Maintain order — newest first |
| 4 | Limit to N latest videos (e.g., 6 at a time) |
| 5 | Admin override — manually feature/hide specific videos |

#### 2.8 How It Works
```
[Instagram Business Account]
            │
            ▼ (every 30 min poll OR webhook)
    [Instagram Graph API]
            │
            ▼
      [Backend Sync Job]
            │
            ▼
        [Database]
            │
            ▼
   [Landing Page renders top N videos via Instagram oEmbed]
```

**Two implementation options:**
- **Option A — Polling (simpler, reliable):** Backend polls Instagram every 30 mins for new posts.
- **Option B — Webhook (real-time, complex):** Subscribe to Instagram Graph webhooks; new posts trigger instant updates.

Recommend **Option A** unless real-time is critical.

#### 2.9 Challenges
| Challenge | Mitigation |
|---|---|
| **Instagram does NOT allow embedding without their oEmbed API + app review** | App review process needed; can take 2–4 weeks of Meta approval |
| **Instagram changes API policies frequently** (e.g., removed Hashtag API in 2024) | Build with modular architecture so swaps are easy |
| **Reels embed has limited customization** (Instagram branding cannot be removed) | Set client expectations upfront |
| **Access token renewal** | Auto-refresh long-lived tokens every 50 days |
| **Personal accounts cannot be used** — must be Business/Creator | Verify before starting |

> ⚠️ **CRITICAL FLAG:** Instagram's Graph API for content publishing/embedding requires app review by Meta. This adds **2–4 weeks** to the timeline beyond development time. Plan accordingly.

---

### MODULE 4 — Landing Page Analytics (Page Views + Video Watch)

#### 2.10 Requirements
| # | Requirement |
|---|---|
| 1 | Track page views per landing page (per language) |
| 2 | Track unique visitors, bounce rate, avg. session duration |
| 3 | Track which videos were played |
| 4 | Track video watch duration (0–25%, 25–50%, 50–75%, 75–100%) |
| 5 | Track conversions (form submits) and tie them to source/language |
| 6 | Dashboard view with daily/weekly/monthly breakdowns |

#### 2.11 How It Works
- **Google Analytics 4 (GA4)** for general page traffic + conversions.
- **Custom event tracking** for video watch milestones using the YouTube/Instagram player APIs.
- A lightweight tracking script sends events to either GA4 or a custom analytics DB.
- All metrics surface in the same admin dashboard from Module 1.

#### 2.12 Challenges
| Challenge | Mitigation |
|---|---|
| **Instagram embedded videos don't expose play/watch events** | Show "video clicks" only; full watch tracking only works for YouTube embeds or self-hosted videos |
| **Cookie consent (DPDP Act 2023 / GDPR if EU traffic)** | Add cookie consent banner |
| **Ad-blockers strip GA4 events** | Add server-side tracking as fallback |

> ⚠️ **IMPORTANT:** Watch-duration tracking is **only fully possible for YouTube embeds or self-hosted (HTML5) videos**. Instagram embedded videos only expose "clicked to play" — not progress.

---

## 3. Combined System Architecture

```
                    ┌────────────────────────────────┐
                    │      ADMIN DASHBOARD (React)   │
                    └────────────────────────────────┘
                                  ▲
                                  │ REST API
                                  │
                    ┌────────────────────────────────┐
                    │   BACKEND  (Node.js / FastAPI) │
                    └────────────────────────────────┘
              ┌──────────┬───────────┬──────────┬───────────┐
              ▼          ▼           ▼          ▼           ▼
         [Meta API] [YT API] [Insta API] [SendGrid] [PostgreSQL]
                                  ▲
                                  │
                    ┌────────────────────────────────┐
                    │  REGIONAL LANDING PAGES (Next) │
                    │   + GA4 + Custom Tracking      │
                    └────────────────────────────────┘
```

---

## 4. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend (Dashboard) | React + Vite + TailwindCSS | Fast, modern, easy to maintain |
| Landing Pages | Next.js | SEO + per-language routing built-in |
| Backend | Node.js (Express) OR Python (FastAPI) | Either works; pick based on team |
| Database | PostgreSQL | Reliable, supports time-series queries |
| Email Service | SendGrid / Mailgun / AWS SES | Cheap, reliable, HTML email support |
| Scheduling | node-cron / Celery Beat | For daily metric pulls + emails |
| Hosting (App) | Render / Railway / AWS EC2 | ₹1,500–₹4,000/month |
| Hosting (DB) | Neon / Supabase / RDS | Free tier sufficient initially |
| CDN + Domain | Cloudflare | Free + fast |
| Analytics | Google Analytics 4 | Free + industry standard |
| CMS (optional) | Strapi / Sanity | If client wants to edit copy themselves |

---

## 5. Timeline

| Phase | Module | Duration | Cumulative |
|---|---|---|---|
| Phase 0 | Discovery, API access setup, design wireframes | 1 week | Week 1 |
| Phase 1 | Module 1 — Metrics pull + DB + daily email | 2.5 weeks | Week 3.5 |
| Phase 2 | Module 1 — Dashboard UI | 1.5 weeks | Week 5 |
| Phase 3 | Module 2 — Regional landing pages + CMS | 2.5 weeks | Week 7.5 |
| Phase 4 | Module 3 — Instagram auto-embed | 1.5 weeks | Week 9 |
| Phase 5 | Module 4 — Analytics + video tracking | 1 week | Week 10 |
| Phase 6 | Testing, QA, client feedback, fixes | 1 week | Week 11 |
| Phase 7 | Deployment + handover + training | 0.5 week | Week 11.5 |

> **Total: ~11–12 weeks (~3 months)**
> Meta App Review (for Instagram) runs in parallel — start in Week 1.

---

## 6. Cost Breakdown (INR)

### One-Time Development Cost

| Module | Cost (Low) | Cost (High) |
|---|---|---|
| Module 1 — Metrics + Daily Email | ₹45,000 | ₹65,000 |
| Module 2 — Regional Landing Pages | ₹55,000 | ₹85,000 |
| Module 3 — Instagram Auto-Embed | ₹30,000 | ₹50,000 |
| Module 4 — Analytics & Video Tracking | ₹20,000 | ₹35,000 |
| UI/UX Design (all screens) | ₹15,000 | ₹25,000 |
| Testing + QA + Deployment | ₹15,000 | ₹25,000 |
| **TOTAL (One-time)** | **₹1,80,000** | **₹2,85,000** |

### Monthly Recurring Costs

| Service | Cost/Month |
|---|---|
| App hosting (Render/Railway) | ₹1,500 – ₹3,500 |
| Database hosting | ₹0 – ₹2,000 (free tier OK initially) |
| Email service (SendGrid 40k emails) | ₹0 – ₹1,500 |
| Domain + Cloudflare | ₹100 – ₹500 |
| Maintenance & monitoring (optional retainer) | ₹8,000 – ₹15,000 |
| **TOTAL (Monthly)** | **₹9,600 – ₹22,500** |

> Costs assume a small Indian dev team. Agency rates: +40–60%.

---

## 7. Prerequisites from Client (Required Before Start)

| # | Item | Why |
|---|---|---|
| 1 | Facebook Business Manager access (Admin role) | To pull FB Page metrics |
| 2 | Instagram Business/Creator account linked to FB Page | API requirement |
| 3 | YouTube Channel access (Owner or Manager) | To pull YT metrics via Data API |
| 4 | Meta Developer account + App created | For API tokens |
| 5 | List of email recipients for daily report | Configuration |
| 6 | List of regional languages required | Sizing |
| 7 | Translated copy per language (or budget for translation) | Content |
| 8 | Brand assets (logo, colors, fonts) | Design |
| 9 | Domain name (or we register one) | Deployment |

---

## 8. Key Challenges & Risks (Summary)

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | **Meta App Review delay** for Instagram auto-embed | HIGH | Start review process in Week 1 |
| 2 | **Instagram embed limitations** — can't track watch %, can't remove IG branding | MEDIUM | Set expectations; offer YouTube as alternative for full tracking |
| 3 | **API policy changes** by Meta/YouTube | MEDIUM | Build modular adapters that can be swapped |
| 4 | **Token expiry** for long-running access | LOW | Automated refresh built into backend |
| 5 | **Client doesn't have Business account** | HIGH | Verify in Week 1; convert if needed (free, takes 1 day) |
| 6 | **Translation quality** for regional languages | MEDIUM | Client to provide vetted translations OR budget for translator |
| 7 | **Ad-blockers blocking GA4** | LOW | Add server-side event tracking |
| 8 | **Scope creep** ("can we add TikTok / LinkedIn too?") | MEDIUM | Lock scope in writing before kickoff |

---

## 9. Deliverables

| # | Deliverable |
|---|---|
| 1 | Working admin dashboard (web app) |
| 2 | Daily automated email report (HTML + PDF attachment) |
| 3 | 4–6 regional landing pages (deployed live) |
| 4 | Instagram auto-embed running on landing pages |
| 5 | Analytics dashboard with page views + video tracking |
| 6 | Admin login system (multi-user, role-based) |
| 7 | Documentation — Setup guide, API reference, admin manual |
| 8 | 1-hour training session for client team |
| 9 | 30 days post-launch bug fix support (free) |

---

## 10. Out of Scope (Phase 2 / Future)

- TikTok, LinkedIn, X (Twitter), Snapchat integration
- Paid ad campaign management (Meta Ads Manager integration)
- AI-generated content suggestions
- Influencer collaboration tracking
- WhatsApp Business integration for leads
- Mobile app (native iOS / Android)

---

## 11. Payment Terms (Suggested)

| Milestone | % |
|---|---|
| Signing / Kickoff | 30% |
| Module 1 + 2 delivery | 30% |
| Module 3 + 4 delivery | 25% |
| Final deployment + sign-off | 15% |

---

## 12. Assumptions

- Client has stable internet & willing to attend weekly review calls.
- Translations are provided by client OR translation budget is added separately.
- Meta/YouTube API policies remain stable during build.
- Hosting accounts (Render, SendGrid etc.) will be created under client's email and billed to them directly.
- Client has decision-making authority — no committee-based approvals that slow down feedback.

---

## 13. Sign-Off

| Role | Name | Signature | Date |
|---|---|---|---|
| Client | | | |
| Project Lead | | | |

---

*End of Document — v1.0*
