# Launch checklist — SM Global Solution Hub

> **Goal:** Real product launch — developers list designs/projects, clients buy / customize, platform takes commission.  
> **Status (Sep 2026):** College/demo core ✅ · **Commercial launch NOT ready** until P0 (and ideally P1) are done.  
> **Owner note:** Fix everything in **P0** and **P1** carefully before taking real money.

Related: [DEMO_WALKTHROUGH.md](./DEMO_WALKTHROUGH.md) (local demo) · [SMOKE_TEST_REPORT.md](./SMOKE_TEST_REPORT.md) · [STAGING.md](./STAGING.md) · [DISPUTE_PLAYBOOK.md](./DISPUTE_PLAYBOOK.md) · [TRACKER.md](../TRACKER.md)

---

## Verdict

| Use case | Ready? |
|----------|--------|
| College viva / local demo | ✅ Yes |
| Soft launch with real payments & sellers | ❌ Not until P0 + P1 |

---

## P0 — Must fix before launch (blockers)

Do these **before** any real customer or developer money.

| # | Item | Why | Done |
|---|------|-----|------|
| P0.1 | **Live Razorpay** keys + production mode | Test keys ≠ real money | ⬜ |
| P0.2 | **Razorpay webhooks** (payment captured / failed) | Missed confirms, reconciliation, reliability | ⬜ |
| P0.3 | **Gateway refunds** (Razorpay refund API) | Today refund is mostly DB/ledger — buyer money must return via gateway | ⬜ |
| P0.4 | **Disable Demo Pay** in production (`allowDemoPay: false`) | Otherwise anyone can “pay” without gateway | ⬜ |
| P0.5 | **Real SMTP** (SendGrid / SES / Gmail app password) | Contact, quotes, payouts must actually email | ⬜ |
| P0.6 | **Email verification** on register | Stop fake / spam accounts | ⬜ |
| P0.7 | **Forgot / reset password** | Required for any public product | ⬜ |
| P0.8 | **Auth hardening** (stricter login rate limits, strong JWT secret, fail if env missing) | Brute-force / weak secrets | ⬜ |
| P0.9 | **Legal pages** — Terms, Privacy, Refund policy, Seller agreement | Trust + compliance | ⬜ |
| P0.10 | **Production deploy** — HTTPS, own domain, hardened `.env`, reverse proxy | Public URL | ⬜ |
| P0.11 | **Rotate all secrets** — JWT, DB, Razorpay, Cloudinary; never ship `CREDENTIALS.md` passwords to prod | Security | ⬜ |
| P0.12 | **Error monitoring** (e.g. Sentry) + backups for MongoDB | Ops when things break | ⬜ |

---

## P1 — Must fix before scaling sellers (strongly recommended pre-launch)

| # | Item | Why | Done |
|---|------|-----|------|
| P1.1 | **Developer KYC** before first payout (PAN / ID / bank proof) | Fraud + payout compliance | ⬜ |
| P1.2 | **License / delivery model** — what buyer gets (source, docs, updates, support days) | Clear sellable product | ⬜ |
| P1.3 | Block **unverified** developers from submit / payout | Quality + trust | ⬜ |
| P1.4 | **Encrypt or vault** payment/Cloudinary secrets stored in Settings DB | Admin DB breach risk | ⬜ |
| P1.5 | Production **CORS** + `trust proxy` for rate limits behind nginx | Security behind reverse proxy | ⬜ |
| P1.6 | Dispute / chargeback process (admin playbook) | When buyers complain | ✅ [DISPUTE_PLAYBOOK.md](./DISPUTE_PLAYBOOK.md) |

---

## P2 — Beyond P0/P1 (product polish for a real marketplace)

Inke bina soft launch possible hai after P0+P1, lekin growth ke liye ye important hain.

### Product / marketplace
- [x] **Fixed price “Buy now”** path (not only quotation) for ready-made products
- [ ] **Download / delivery vault** after payment (zip / repo access / license key) — v1: optional `deliveryAccessUrl` on project
- [x] **Reviews & ratings** on projects (moderate in Admin)
- [x] **Search SEO** — sitemap (`/api/sitemap.xml`), meta tags / OG via Helmet on project detail
- [x] **Categories + featured** curation tools (Admin Curation)
- [ ] **Commission tiers** (category / volume based) if needed
- [ ] **Multi-currency** (later) or clear INR-only policy

### Trust & support
- [x] In-app **support tickets** (Client / Developer / Admin)
- [ ] SLA / response time for customizations
- [ ] Fraud flags (duplicate UPI, velocity limits on payouts)

### Ops & quality
- [x] Automated **API + frontend build** in CI (GitHub Actions) — API skips if no DB secret
- [x] Staging notes — [STAGING.md](./STAGING.md)
- [x] Admin audit log (Super Admin → Audit Log)
- [x] GST-friendly invoice fields + PDF breakup (Settings → Billing)

### Growth (later)
- [x] Thin **recommend** stub — `GET /projects/recommend` + Home “Suggested for you” (rule-based, no LLM)
- [ ] Email marketing / abandoned quote reminders
- [ ] Analytics (Plausible / GA4) — privacy-aware

---

## Suggested order of work

```text
1. Secrets rotate + SMTP + auth (verify + reset)
2. Live Razorpay + webhooks + gateway refunds + Demo Pay OFF
3. Legal pages + KYC gate on payouts
4. Deploy HTTPS + monitoring + backups
5. License/delivery model + Buy now / downloads
6. Reviews, SEO, CI, staging — then market
```

---

## Soft-launch definition (when you can say “launched”)

All **P0** ✅ and **P1.1–P1.3** ✅, plus:

- At least 1–2 real test purchases end-to-end on **live** Razorpay  
- 1 developer KYC → payout marked paid successfully  
- Terms/Privacy linked in footer + register  
- Demo Pay off, no demo passwords in production  

Until then: treat as **private beta / demo only**.
