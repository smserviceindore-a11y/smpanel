# SM Global Solution Hub — Progress Tracker

> **Last Updated:** 8 September 2026  
> **Working UI:** `preview/` (React + Vite)  
> **API:** `backend/` on `:5001`  
> **Commercial launch:** See [docs/LAUNCH_CHECKLIST.md](./docs/LAUNCH_CHECKLIST.md) — **P0 + P1 must be done before real money**  
> **Latest local smoke:** [docs/SMOKE_TEST_REPORT.md](./docs/SMOKE_TEST_REPORT.md) (Buy Now + Support Agent + Users/Ops)

---

## Overall Progress

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1 — Public site + core APIs | ✅ Done | 100% |
| Phase 2 — Developer marketplace + approvals | ✅ Done | 100% |
| Phase 3 — Quotation / Pay / Invoice / Wallet | ✅ Done | 100% |
| Demo polish (seed money story, contact inbox, docs) | ✅ Done | 100% |
| **Pre-launch P0/P1** (payments, auth, legal, KYC, deploy) | ⬜ Not started | 0% — [LAUNCH_CHECKLIST](./docs/LAUNCH_CHECKLIST.md) |
| Phase 4 — AI Features | ⚪ Deferred | 0% |
| Production deploy (own server) | ⬜ In checklist P0 | 0% |

**Legend:** ✅ Done · 🔄 In Progress · ⬜ Not Started · ⚪ Deferred

---

## What ships today

- Public marketplace (home, projects, contact, customize, developer gallery)
- Auth + roles: Super Admin, Admin, **Support Agent**, Developer, Client
- Admin ops: projects, approvals, leads, quotations, settlements/payouts, coupons, reports, **Users/Clients directory**, follow-ups
- Super Admin: users (all roles), create user, payment reports, **Settings** (Razorpay + Cloudinary + GST), Audit Log
- Support Agent: tickets, requirements, follow-ups, clients/developers only
- Developer: submit projects, requests, **Wallet & Payouts**, coupons (no support tickets)
- Client: requirements, customizations, **Buy Now** + pay, invoices, support tickets
- Wallet hold → payout reserve → approve/mark paid
- Contact inbox (Admin + Super Admin)
- Seed: `npm run seed` / `npm run seed:money` — see [docs/DEMO_WALKTHROUGH.md](./docs/DEMO_WALKTHROUGH.md)
- Smoke results + improve backlog: [docs/SMOKE_TEST_REPORT.md](./docs/SMOKE_TEST_REPORT.md)

---

## Before real product launch

**Do not take real customer/developer money until P0 + P1 are checked off.**

Full list (P0 blockers, P1 KYC/license, P2 marketplace polish):  
→ **[docs/LAUNCH_CHECKLIST.md](./docs/LAUNCH_CHECKLIST.md)**

Short reminder:

| Priority | Examples |
|----------|----------|
| **P0** | Live Razorpay + webhooks + gateway refunds, Demo Pay off, SMTP, email verify + password reset, Terms/Privacy, HTTPS deploy, rotate secrets |
| **P1** | Developer KYC before payout, license/delivery model, unverified sellers blocked |
| **P2** | Buy now + downloads, reviews, SEO, CI/staging, support tickets |

---

## Phase 4 / nice-to-have (after launch base)

| Item | Notes |
|------|--------|
| Phase 4 AI | Recommend / assist — not a launch blocker |
| Marketing emails / analytics | After soft launch |

---

## Quick sync log

| Date | Note |
|------|------|
| Sep 2026 | Phases 1–3 + wallet/coupons/Cloudinary settings verified |
| 7 Sep 2026 | Money-story seed, contact inbox UI, wallet nav, TRACKER/README sync |
