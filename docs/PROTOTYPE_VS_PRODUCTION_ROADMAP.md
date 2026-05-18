# EMPEÑALO — Prototype vs. Production Roadmap

> **Purpose**: Define what the "pitch prototype" (demo/beta) should look like versus the final production system. Use this to avoid over-engineering the MVP while keeping the long-term vision clear.
> **Last updated**: 2026-05-17

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The Pitch Prototype / Beta](#2-the-pitch-prototype--beta)
   - 2.1 Goal
   - 2.2 Target Audience
   - 2.3 Scope: What to Build
   - 2.4 Scope: What to Fake / Mock
   - 2.5 Scope: What to Deliberately Omit
   - 2.6 Demo Script (Suggested Flow)
   - 2.7 Success Metrics for the Prototype
3. [The Production Ideal](#3-the-production-ideal)
   - 3.1 Full Architecture Vision
   - 3.2 Full Feature Vision
   - 3.3 Non-Functional Requirements
4. [Side-by-Side Comparison](#4-side-by-side-comparison)
5. [Transition Path: From Pitch to Production](#5-transition-path-from-pitch-to-production)
6. [Risk Mitigation](#6-risk-mitigation)
7. [Recommended MVP Scope for Pitch](#7-recommended-mvp-scope-for-pitch)

---

## 1. Executive Summary

This document separates **two distinct products**:

1. **The Pitch Prototype (Beta)** — A polished, functional demo designed to impress investors, validate the business model with real users, and gather feedback. It should look and feel like a real product, but can rely on manual processes, mocked integrations, and simplified logic behind the scenes.

2. **The Production Ideal** — The fully automated, scalable, compliant system that operates 24/7 with minimal human intervention. This is what you build *after* you have funding, traction, and a clear product-market fit.

**The danger to avoid**: Building production-grade infrastructure before you know if anyone wants the product. The prototype should be "real enough" to trust, but "lean enough" to ship in weeks, not months.

---

## 2. The Pitch Prototype / Beta

### 2.1 Goal

Create a **convincing, end-to-end demonstration** of the core marketplace loop:

> *A client posts an item → businesses see it and make offers → the client compares and accepts → both parties meet to complete the transaction.*

The prototype must be **visually polished**, **mobile-first**, and **stable enough for a live demo** without the presenter needing to apologize for bugs.

### 2.2 Target Audience

| Audience | What they care about | What to show |
|---|---|---|
| **Investors** | Market size, traction, team execution speed | Clean UI, real transactions (even if seeded), growth metrics dashboard |
| **Beta testers (clients)** | Ease of use, trust, speed of offers | Simple posting flow, clear proposal comparison, feeling of safety |
| **Beta testers (businesses)** | Lead quality, ease of bidding, ROI | Rich solicitud details, quick bid flow, subscription value |
| **Mentors / Accelerators** | Product thinking, tech quality, scalability awareness | Architecture docs, clean code, clear roadmap |

### 2.3 Scope: What to Build (Real)

These must be **fully functional and persistent** (no mock data):

| Feature | Why it matters for pitch |
|---|---|
| **Dual auth (client + business)** | Core to the two-sided marketplace. Must work flawlessly. |
| **Create solicitud (with photos)** | The "Aha!" moment for clients. Photo upload proves technical competence. |
| **Browse active solicitudes (business)** | The "Aha!" moment for businesses. Shows there is supply. |
| **Create propuesta (business)** | Closes the core loop. Must enforce subscription quota (even if billing is fake). |
| **Compare propuestas (client)** | The value proposition. Beautiful comparison UI is essential. |
| **Accept propuesta + generate redemption code** | The "transaction" moment. Proves the marketplace facilitates real deals. |
| **Basic dashboards** | Both portals need a home screen with real counts and recent activity. |
| **History / status tracking** | Users need to see their past activity. Builds trust. |

### 2.4 Scope: What to Fake / Mock

These should *appear* real to the user, but can be manually operated or simplified behind the scenes:

| Feature | How to fake it | User sees |
|---|---|---|
| **Culqi payments / billing** | Fake "upgrade" button sets subscription to `active` manually via admin script. | A working plan selection and "success" message. |
| **Subscription quota enforcement** | Hard-code the 5/30/unlimited limits in the `createPropuesta` server function. | "You have 3 of 5 proposals remaining this month." |
| **SMS / Email notifications** | Log to console or show a toast: "Notification sent." | Immediate in-app feedback. |
| **Redemption code validation** | Code is generated and stored, but "scanning" at the business is just the business owner typing it into a form. | A unique code is created and accepted. |
| **Admin / moderation** | Direct SQL queries or a simple admin page protected by hardcoded password. | You can moderate content during the demo. |
| **Analytics** | Seed the dashboard with realistic but fake numbers (e.g., "48 solicitudes disponibles"). | A lively, active marketplace. |

### 2.5 Scope: What to Deliberately Omit

These are production concerns that add weeks of work with zero pitch value:

| Omitted Feature | Why it's omitted now |
|---|---|
| **Real payment processing** | Requires Culqi production approval, legal entity, compliance. Fake it. |
| **Automated subscription renewals** | Manual renewal via admin script is fine for <100 beta businesses. |
| **Dispute resolution / escrow** | Legal complexity. Handle manually via WhatsApp/email during beta. |
| **Multi-user business accounts** | Each business has one owner. Teams add RBAC complexity. |
| **Advanced search / filters** | Basic category + district filtering is enough. Elasticsearch later. |
| **Push notifications (native)** | In-app toasts + email (faked) suffice for beta. |
| **KYC / identity verification** | Trust-building feature, but not required for MVP. Manual document review if needed. |
| **Review / rating system** | Nice to have, but not core to the initial pitch. |
| **iOS / Android native apps** | The web app is mobile-responsive and wrapped in a PhoneFrame aesthetic. Pitch with that. |
| **Real-time chat** | Businesses and clients can share phone numbers after acceptance. Chat is a Phase 2 feature. |

### 2.6 Demo Script (Suggested Flow)

Use this flow for investor pitches or user testing sessions. It takes ~4 minutes.

**Act 1 — The Client (1 min)**
1. Open `/app/login` on a mobile view.
2. Log in as a pre-seeded client (or register live if confident).
3. Dashboard shows existing activity. Tap "Empeñar un artículo."
4. Fill out the form: iPhone 14 Pro, upload 2 photos, set expected amount.
5. Submit. Toast: "Publicado. Recibirás ofertas en minutos."

**Act 2 — The Business (1.5 min)**
1. Switch to desktop view. Open `/negocio/login`.
2. Log in as a pre-seeded business.
3. Dashboard shows "Solicitudes nuevas" — the iPhone post is at the top.
4. Click "Detalle." Review photos, specs, expected amount.
5. Click "Enviar propuesta." Enter: S/ 2,400, 4.5%, 30 days. Submit.
6. Dashboard updates: "Propuestas enviadas: 1/5."

**Act 3 — The Acceptance (1 min)**
1. Back to mobile client view. Pull-to-refresh dashboard.
2. Notification dot: "1 nueva propuesta." Tap.
3. See the proposal from "Joyería Miraflores." Compare with (fake) competitors.
4. Tap "Aceptar." Screen shows redemption code: `EMP-7P3R8`. "Presenta este código en la tienda."

**Act 4 — The Payoff (30 sec)**
1. Show the business dashboard: "Aceptadas este mes: 1."
2. Show the admin view (if needed) with metrics: total users, conversion rate, GMV.
3. Close with: "This is live today. We have X beta users. Here's what we need to scale."

### 2.7 Success Metrics for the Prototype

| Metric | Target | How to measure |
|---|---|---|
| **Demo stability** | 0 crashes during a 10-min pitch | Playwright E2E + manual dry runs |
| **Time to first propuesta** | <5 minutes from signup | Analytics on `propuestas.created_at` |
| **Client activation** | 70% of signups post a solicitud | `profiles` with role=client vs `solicitudes` count |
| **Business activation** | 50% of signups send a propuesta | `profiles` with role=business vs `propuestas` count |
| **NPS (beta survey)** | >30 | Simple 0-10 survey after first transaction |
| **Fake-it quality** | No user asks "Is this real?" | User testing sessions |

---

## 3. The Production Ideal

### 3.1 Full Architecture Vision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Web App    │  │  iOS App    │  │ Android App │  │  Admin Dashboard    │ │
│  │  (React)    │  │  (SwiftUI)  │  │  (Kotlin)   │  │  (React/Internal)   │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          └────────────────┴────────────────┘                    │
                           │                                     │
                    ┌──────▼──────┐                      ┌──────▼──────┐
                    │   API Gateway │                    │  Admin API  │
                    │  (Rate Limit, │                    │  (Internal) │
                    │   Auth, Cache)│                    └─────────────┘
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
   │  Core API   │ │  Webhook    │ │  Worker     │
   │  (FastAPI /  │ │  Handlers   │ │  Queue      │
   │   NestJS)    │ │  (Culqi)    │ │  (Celery /  │
   │              │ │             │ │  BullMQ)    │
   └──────┬──────┘ └─────────────┘ └──────┬──────┘
          │                               │
          └────────────────┬──────────────┘
                           │
                    ┌──────▼──────┐
                    │   Postgres   │
                    │  (Primary +  │
                    │   Replicas)  │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
   │    Redis    │ │   Elastic   │ │   Object    │
   │   (Cache +  │ │   Search    │ │   Storage   │
   │    Queue)   │ │             │ │   (S3/R2)   │
   └─────────────┘ └─────────────┘ └─────────────┘
```

**Key differences from prototype**:
- **Dedicated API layer**: FastAPI or NestJS replaces direct Supabase client calls. This enables native apps, third-party integrations, and strict audit trails.
- **Message queue**: Redis/RabbitMQ/SQS for background jobs (webhooks, notifications, expiration jobs).
- **Search engine**: Elasticsearch/Meilisearch for fast, filtered marketplace browsing.
- **Read replicas**: Separate read-only DBs for analytics and heavy listing queries.
- **Object storage with CDN**: R2/S3 + CloudFront/Cloudflare Images for optimized image delivery.
- **Observability**: Structured logging, distributed tracing, error tracking (Sentry), metrics (Prometheus/Grafana).

### 3.2 Full Feature Vision

| Domain | Prototype | Production Ideal |
|---|---|---|
| **Auth** | Email/password (Supabase) | Social login (Google/Apple), passkeys, MFA, Clerk or Auth0 |
| **Onboarding** | Simple form | Progressive profiling, identity verification (KYC), document upload |
| **Solicitudes** | Basic form + photos | AI-powered item valuation suggestions, photo quality checker, auto-categorization |
| **Marketplace** | Basic list, category filter | Full-text search, geo-radius filter, sort by price/rate/distance, saved searches, alerts |
| **Propuestas** | Simple offer form | Auto-suggest rates based on item category + market data, bulk proposal templates |
| **Acceptance** | Redemption code | In-app QR code, GPS verification of pickup, digital contract signing |
| **Payments** | Faked (manual) | Real Culqi integration, automatic recurring billing, dunning management, invoicing |
| **Subscriptions** | Hardcoded quotas | Dynamic plan builder, usage-based billing, trial management, downgrade retention flows |
| **Notifications** | In-app toasts | Push (Firebase/APNs), SMS (Twilio), WhatsApp Business API, email (SendGrid/Mailgun) |
| **Chat** | None | In-app messaging between client and business, file sharing, dispute threads |
| **Reviews** | None | Two-sided ratings, moderated reviews, reputation scores |
| **Admin** | SQL / hardcoded password | Full admin panel: user management, content moderation, fraud detection, analytics |
| **Analytics** | Fake numbers | Real-time event streaming (Segment/PostHog), cohort analysis, GMV tracking, business intelligence |
| **Compliance** | None | Data retention policies, GDPR/LGPD compliance, audit logs, PCI-DSS for payments |
| **Mobile** | Responsive web | Native iOS + Android apps with offline support, push notifications, camera integration |

### 3.3 Non-Functional Requirements (Production)

| Requirement | Target |
|---|---|
| **Availability** | 99.9% uptime (8.77h downtime/year max) |
| **Latency (p95)** | <200ms for API responses; <1s for page loads |
| **Throughput** | 1,000 concurrent users without degradation |
| **Data durability** | Daily backups + point-in-time recovery (PITR) |
| **Security** | OWASP Top 10 mitigation, penetration tested annually |
| **Scalability** | Horizontal scaling of API workers; read replicas for DB |

---

## 4. Side-by-Side Comparison

| Aspect | Pitch Prototype | Production Ideal |
|---|---|---|
| **Time to build** | 2–4 weeks | 6–12 months (team of 3–5 engineers) |
| **Hosting cost** | ~$0/month (free tiers) | ~$500–2,000/month (depending on load) |
| **Code quality** | "Ship it" — some shortcuts allowed | Production-grade: tests, monitoring, CI/CD |
| **Data integrity** | Best effort | ACID transactions, audit trails, immutable logs |
| **Automation** | Manual processes acceptable | Fully automated billing, notifications, jobs |
| **Mobile** | Responsive web | Native iOS + Android |
| **Search** | Basic SQL `LIKE` or filtered lists | Elasticsearch / Meilisearch |
| **Payments** | Faked / manual | Real Culqi production, automated invoicing |
| **Auth** | Supabase email/password | Clerk/Auth0 with social, MFA, passkeys |
| **Image handling** | Direct upload, original files | Resized on upload, CDN delivery, WebP format |
| **Monitoring** | Console logs | Sentry, structured logging, Grafana dashboards |
| **Team size** | 1–2 developers | 3–5 engineers + 1 DevOps + 1 QA |

---

## 5. Transition Path: From Pitch to Production

The goal is to **evolve** the prototype, not rewrite it from scratch.

```
    Prototype          Beta v2           Growth            Production
    (Now)              (Month 2-3)       (Month 4-6)       (Month 7+)
       │                  │                 │                 │
       ▼                  ▼                 ▼                 ▼
  ┌─────────┐      ┌─────────┐       ┌─────────┐       ┌─────────┐
  │ Mock    │      │ Real    │       │ Cached  │       │ Custom  │
  │ data    │─────▶│ data    │──────▶│ reads   │──────▶│ API     │
  │ + fake  │      │ + fake  │       │ + jobs  │       │ + native│
  │ billing │      │ billing │       │ + real  │       │ apps    │
  └─────────┘      └─────────┘       │ billing │       └─────────┘
                                     └─────────┘
```

### Phase 1: Prototype Hardening (Weeks 1–2)
- Replace all mock arrays with real Supabase queries.
- Add `services/` abstraction layer.
- Implement fake billing UI (plan selection, "success" toast, manual activation).
- Enforce proposal quotas in code.
- Polish mobile UI to "App Store screenshot" quality.

### Phase 2: Beta Launch (Weeks 3–6)
- Onboard 20–50 real users (friends, family, early adopters).
- Collect feedback via in-app surveys.
- Fix critical bugs. Do not add features.
- Track activation metrics (post rate, proposal rate, acceptance rate).

### Phase 3: Growth Prep (Months 2–3)
- Add caching layer (Redis/Upstash).
- Implement background jobs (proposal expiration, email notifications).
- Optimize images and add CDN.
- Real Culqi sandbox integration (test with real cards, not charged).
- Improve search with Supabase full-text search (pre-Elasticsearch).

### Phase 4: Scale Foundation (Months 4–6)
- Migrate to custom API (FastAPI/NestJS) if justified by traction.
- Introduce read replicas.
- Add Elasticsearch for marketplace search.
- Launch native mobile apps (or progressive web app with push notifications).
- Full observability stack.

### Phase 5: Production (Months 7+)
- PCI-DSS compliance audit.
- Penetration testing.
- Multi-region deployment if needed.
- Advanced features: ML pricing, dispute resolution, escrow.

---

## 6. Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Prototype feels "fake" to investors** | Medium | High | Use real data, real photos, real transactions between beta users. Seed the marketplace with 10–20 posts before any demo. |
| **Users expect production features** | Medium | Medium | Set clear expectations: "This is a beta. Some features are coming soon." Add a "Feedback" button everywhere. |
| **Database performance degrades during demo** | Low | High | Seed with modest data (<500 rows). Pre-warm caches. Have a fallback "static demo mode" (screenshot slideshow) if live demo fails. |
| **Payment integration blocks launch** | Medium | High | Fake payments for prototype. Real payments are a growth-phase feature, not an MVP feature. |
| **TanStack Start has breaking changes** | Medium | Medium | Pin dependency versions. Lock `package.json` with exact versions for the prototype period. |
| **Supabase free tier limits hit** | Low | Medium | Monitor usage dashboard. Upgrade to Pro ($25/mo) immediately if approaching limits. |
| **Single developer bottleneck** | High | High | Document everything (this doc, architecture doc, backlog). Any engineer should be able to pick up the codebase in a day. |

---

## 7. Recommended MVP Scope for Pitch

This is the **minimum viable set of features** to build before showing the prototype to anyone outside the team.

### Must-Have (Non-Negotiable)
- [ ] Client signup + login
- [ ] Business signup + login
- [ ] Post a solicitud (form + photo upload)
- [ ] Browse active solicitudes (business)
- [ ] Send a propuesta (business)
- [ ] View propuestas on a solicitud (client)
- [ ] Accept a propuesta + redemption code generated
- [ ] Basic dashboard for both roles (real counts)
- [ ] History page for both roles
- [ ] Responsive mobile-first design

### Should-Have (Strongly Recommended)
- [ ] Subscription plan selection page (fake billing)
- [ ] Proposal quota enforcement (hardcoded)
- [ ] Photo gallery / carousel on solicitud detail
- [ ] Simple profile editing
- [ ] "How it works" landing page for SEO/conversion

### Nice-to-Have (If Time Permits)
- [ ] Filter solicitudes by category/district
- [ ] Sort propuestas by amount/rate
- [ ] Push notification toast on new propuesta
- [ ] "Share solicitud" link
- [ ] Dark mode toggle

### Explicitly Out of Scope for Pitch
- [ ] Real payment processing
- [ ] Automated subscription renewal
- [ ] Dispute resolution
- [ ] Multi-user business accounts
- [ ] Advanced search (Elasticsearch)
- [ ] Native mobile apps
- [ ] Real-time chat
- [ ] Review/rating system
- [ ] KYC/identity verification
- [ ] Admin dashboard (use SQL/direct DB access)

---

## Pitch Day Checklist

- [ ] Seed 10–20 realistic solicitudes with real photos (use your own items, friends' items, or stock photos with permission).
- [ ] Seed 3–5 business accounts with realistic names and districts.
- [ ] Send 5–10 propuestas between seeded accounts so dashboards look alive.
- [ ] Test the full demo script 3 times end-to-end.
- [ ] Have a "clean slate" script to reset demo data in 30 seconds.
- [ ] Prepare a slide deck with 3 slides: Problem, Solution (demo), Traction/Ask.
- [ ] Have the app open in 2 browser windows (mobile + desktop) before the pitch starts.
- [ ] Prepare answers for: "How do you prevent fraud?" "How do you make money?" "Who are your competitors?" "What if a business doesn't pay?"

---

*End of document. Update after each pivot, funding round, or major scope change.*
