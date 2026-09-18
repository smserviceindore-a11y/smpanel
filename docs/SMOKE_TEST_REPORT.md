# Local demo smoke test report — Buy Now + Support + Users pack

> **Date:** 8 Sep 2026 (API run against `localhost:5001` + `localhost:5173`)  
> **Scope:** Marketplace Buy Now, coupons, reviews, support agent CRM, users directory, project ops, GST/audit/curation, role locks  
> **Method:** Automated API smoke (full matrix). UI-only items noted separately.  
> **Verdict:** **LOCAL DEMO ready — Yes** (48 PASS / 1 FAIL / 1 SKIP on first pass; follow-up clarified coupon cases)

Related: [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) · [STAGING.md](./STAGING.md) · [DISPUTE_PLAYBOOK.md](./DISPUTE_PLAYBOOK.md) · [DEMO_WALKTHROUGH.md](./DEMO_WALKTHROUGH.md)

---

## Summary

| Metric | Count |
|--------|------:|
| PASS | 48+ (after coupon retest) |
| FAIL (first pass) | 1 (`B5` with developer coupon `DEVFIX` on company project) |
| SKIP (first pass) | 1 (`B7/C2` until customization quote retested) |
| Overall local demo | **Yes** |

### Accounts used

| Role | Email | Password | Home |
|------|-------|----------|------|
| Super Admin | `superadmin@smglobal.com` | `Super@2026` | `/super-admin` |
| Admin | `ops@smglobal.com` | `Admin@2026` | `/admin` |
| Support Agent | `support@smglobal.com` | `Support@2026` | `/support` |
| Developer | `rahul.dev@smglobalhub.com` | `Dev@2026` | `/developer` |
| Client | `client@demo.com` | `Client@2026` | `/client` |

### Sample project used

- Slug: `mighty-school-pro-school-erp-saas`
- After test: Buy Now **ON**, amount **₹4999**, delivery `https://example.com/access`

---

## Full results table

| ID | Area | Result | Notes |
|----|------|--------|-------|
| A1 | Home Featured + Suggest APIs | **PASS*** | Featured=3. Bare `GET /projects/recommend` → **0** items; with `industry`/`budget` → **5**. Home “Suggested for you” may be empty without defaults. |
| A2 | Health | **PASS** | `GET /api/health` → 200 |
| A3 | Sitemap | **PASS** | XML includes `/projects/` URLs |
| A4 | Public project detail | **PASS** | SEO meta present; Buy Now gated until B1 |
| L1 | Login Super Admin | **PASS** | → `/super-admin` |
| L2 | Login Admin | **PASS** | → `/admin` |
| L3 | Login Support Agent | **PASS** | role=`support_agent` → `/support` |
| L4 | Login Developer | **PASS** | → `/developer` |
| L5 | Login Client | **PASS** | → `/client` |
| B1 | Enable Buy Now on project | **PASS** | amount=4999, `buyNowEnabled=true`, delivery URL set |
| B3 | Client Buy Now creates quote | **PASS** | `leadType=buy_now`, quotation created |
| B4 | Demo Pay without coupon | **PASS** | Paid + invoice; confirm OK |
| B5 | Buy Now + coupon | **PASS*** | `DEVFIX` (developer coupon) on **company** listing → 400 *expected*. Platform coupon `BN812787` → discount ₹590 **PASS** |
| B6 | Delivery URL after pay | **PASS** | Paid quote shows `deliveryAccessUrl` |
| B7 / C2 | Coupon blocked on customization | **PASS*** | Preview: *“Coupons only apply to ready Buy Now purchases, not customized quotes”* |
| C0 | Active / create coupon | **PASS** | Found `DEVFIX`; later created platform `BN*` |
| C3 | Coupon allowed on buy_now | **PASS** | Platform % coupon works |
| D1 | Client submit review | **PASS** | Pending moderation |
| D2 | Admin approve review | **PASS** | |
| D3 | Hide review from public | **PASS** | Hidden → not in public list |
| E1a | Client create support ticket | **PASS** | |
| E1b | Client reply on ticket | **PASS** | |
| E2 | Developer support removed | **PASS** | `GET /developer/support` → **404** |
| E3 | Admin support reply + status | **PASS** | → `in_progress` → `resolved` |
| F1 | Support dashboard | **PASS** | Tickets / reminders / new reqs counts |
| F2 | Support tickets list | **PASS** | |
| F3 | Support requirements list | **PASS** | |
| F4 | Support create follow-up | **PASS** | Call + next reminder |
| F5 | Follow-ups list + report | **PASS** | |
| F5b | Mark follow-up done | **PASS** | |
| F6/F7 | Support directory roles | **PASS** | Only `developer` + `client` (no admin/master) |
| F8 | Support cannot create user | **PASS** | POST → 404 / no route |
| G1a | Super Users directory | **PASS** | byRole includes masters, admins, support, devs, clients |
| G1b | Super create temp client | **PASS** | |
| G1c | Temp user detail API | **PASS** | `kind=client` |
| G1d | Super creatable roles | **PASS** | All five roles |
| G2a | Admin hides master admins | **PASS** | No `super_admin` / `admin` in byRole |
| G2b | Admin creatable roles limited | **PASS** | support / developer / client only |
| G2c | Admin cannot create admin | **PASS** | 403 |
| G3 | Developer detail + sales | **PASS** | `kind=developer` (0 orders on sampled unpaid-dev projects OK) |
| G4 | Client detail (support view) | **PASS** | Spend / purchases stats |
| H1/H2 | Project Ops detail | **PASS** | orders, gross, platform cut, buyers; company listing → `devShare=0` OK |
| I1 | GST billing save | **PASS** | Super Admin settings |
| I2 | Invoice PDF | **PASS** | PDF bytes + CGST/SGST on invoice record |
| I3 | Audit log | **PASS** | Entries present after actions |
| I4 | Curation feature | **PASS** | Featured/tier update |
| J1 | Developer blocked from staff APIs | **PASS** | admin/super/support → 403 |
| J2 | Support blocked from settings / create admin | **PASS** | 403 |
| J3 | Client blocked from directory | **PASS** | 403 |

\* = see [Improve / known quirks](#improve--known-quirks)

---

## PASS — keep as regression checklist

Use this list when re-testing after changes:

1. Health + sitemap + featured projects  
2. All five role logins + dashboard paths  
3. Buy Now enable → client quote → Demo Pay → paid + delivery URL  
4. Platform coupon on `buy_now` applies discount  
5. Coupon preview rejects non-`buy_now` lead types  
6. Reviews: create → approve → hide  
7. Client tickets; developer support route gone; admin can resolve  
8. Support agent: dashboard, tickets, requirements, follow-ups, directory filter, no user create  
9. Super vs Admin directory visibility + create rules  
10. User detail (client/developer kinds) + Project Ops  
11. Billing save, invoice PDF, audit log, curation  
12. Role API locks (dev / support / client)

---

## FAIL / near-fail (first pass)

| ID | What happened | Verdict after retest | Action |
|----|---------------|----------------------|--------|
| **B5** | Pay with `DEVFIX` → `400 This developer coupon is not valid for this quotation` | **Not a product bug** for company Buy Now — developer coupons are scoped to that developer’s projects. Platform coupon works. | Improve UX message + filter coupons by project ownership in UI |
| **B7/C2** | First skip: no unpaid customization quote in client list | **PASS** via coupon **preview** on sent customization quote | Harden admin quotation create/send so totals aren’t `0` and client pay path is clean |

---

## Improve / known quirks

Priority for next improvement pass (not P0 launch blockers for *local demo*, but polish / reliability):

### P1 — Product polish

| # | Issue | Status | Notes |
|---|--------|--------|-------|
| I-1 | Home “Suggested for you” empty without filters | ✅ **Fixed** (2026-09-08) | Recommend engine baseline scores + featured fallback; bare `GET /projects/recommend` returns items |
| I-2 | Admin quotation create `total: 0` with `items[].amount` | ✅ **Fixed** (2026-09-08) | `calcTotals` accepts `unitAmount` / `unitPrice` / `amount`; rejects empty totals; Admin form has `leadType` |
| I-3 | Coupon UX unclear for seller vs platform | ✅ **Fixed** (2026-09-08) | Clearer API errors; Coupons page + Client pay UI hints |
| I-4 | Customization request ≠ payable quote | ⬜ Open | Still optional — admin can create + send customization quote manually |

### P2 — UI / manual verification still open

| # | Item | Why open |
|---|------|----------|
| U-1 | Coupons page subtitle “Buy Now only” | ✅ Copy updated with seller vs platform note |
| U-2 | Helmet title/OG in browser tab | API returns `seo.metaTitle`; visual not automated |
| U-3 | Chart pixels on User / Project Ops pages | API returns chart series; Recharts render not screenshot-tested |
| U-4 | G5 password change → re-login | Not run (would mutate demo accounts) |
| U-5 | Developer sidebar has no Support link | Backend 404 confirmed; visual nav spot-check once |

### P3 — Data / demo seed improvements

| # | Item | Status |
|---|------|--------|
| S-1 | Seed platform coupon `BUYNOW10` | ✅ **Fixed** — `seedDemoBuyNow.js` |
| S-2 | Seed Buy Now + delivery URL on a company project | ✅ **Fixed** — same seed (`sm-hr-pro` etc.) |
| S-3 | Seed sent customization quotation | ⬜ Open (optional) |

---

## Out of scope this run (still LAUNCH P0)

Do **not** treat these as smoke failures — tracked in [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md):

- Live Razorpay + webhooks + gateway refunds  
- Demo Pay OFF in production  
- SMTP, email verify, forgot password  
- Legal pages, production deploy, secret rotation, monitoring  

---

## How to re-run

1. Start backend (`backend` → `npm run dev`) and preview (`preview` → `npm run dev`).  
2. Confirm `GET http://localhost:5001/api/health` → 200.  
3. Optional: `cd backend && node -e "require('dotenv').config(); require('./src/config/db')().then(()=>require('./src/seeds/seedDemoBuyNow')()).then(()=>process.exit(0))"`  
4. Re-run smoke matrix; update this file when more items close.

### Suggested remaining order

```text
1. I-4 / S-3 optional customization seed quote (if demos need it)
2. U-2…U-5 quick UI spot checks
3. LAUNCH P0 (Razorpay live, auth email, deploy)
```

---

## Changelog of this report

| Date | Note |
|------|------|
| 2026-09-08 | Initial API smoke after Buy Now + Support Agent + Users/Ops pack |
| 2026-09-08 | Fixed I-1, I-2, I-3, S-1, S-2 from improve backlog |
