# SM Global Solution Hub

Digital marketplace for SM Global Tech Solutions: project discovery, developer listings, customization, quotations, payments, wallet & payouts.

> **Launch status:** Demo/core ✅ · Commercial launch only after **[docs/LAUNCH_CHECKLIST.md](./docs/LAUNCH_CHECKLIST.md)** P0 + P1.

## Team

| Name | Role |
|------|------|
| Sagar | Lead + Backend Developer |
| Aadrika | Frontend Developer |

## Tech Stack

- **Frontend (live):** React + Vite, Tailwind, React Router, TanStack Query, Zustand — folder `preview/`
- **Backend:** Node.js, Express.js — folder `backend/`
- **Database:** MongoDB Atlas + Mongoose
- **Auth:** JWT (roles: super_admin, admin, developer, client)
- **Payments:** Razorpay test + Demo Pay *(disable Demo Pay before production)*
- **Media:** Cloudinary (keys editable in Super Admin → Settings)
- **Exports:** ExcelJS, PDFKit

## Status (Sep 2026)

| Area | Status |
|------|--------|
| Phases 1–3 (marketplace, roles, pay, invoices, wallet) | ✅ Done |
| Coupons, Cloudinary settings, contact inbox, reports/graphs | ✅ Done |
| Pre-launch P0/P1 (live pay, auth, legal, KYC, deploy) | ⬜ See [LAUNCH_CHECKLIST](./docs/LAUNCH_CHECKLIST.md) |
| Phase 4 AI | ⚪ Later |

See [TRACKER.md](./TRACKER.md), [docs/LAUNCH_CHECKLIST.md](./docs/LAUNCH_CHECKLIST.md), [docs/DEMO_WALKTHROUGH.md](./docs/DEMO_WALKTHROUGH.md).

## Documentation

| Document | Description |
|----------|-------------|
| [docs/LAUNCH_CHECKLIST.md](./docs/LAUNCH_CHECKLIST.md) | **P0/P1/P2 before real product launch** |
| [docs/DEMO_WALKTHROUGH.md](./docs/DEMO_WALKTHROUGH.md) | 2-minute local demo money-story |
| [CREDENTIALS.md](./CREDENTIALS.md) | Demo logins *(do not use in production)* |
| [docs/TEST_AND_FIX_REPORT.md](./docs/TEST_AND_FIX_REPORT.md) | Test & fix report |
| [docs/API.md](./docs/API.md) | API documentation |
| [PROJECT_PLAN.md](./PROJECT_PLAN.md) | Original plan |
| [FRONTEND_PLAN.md](./FRONTEND_PLAN.md) | Frontend plan notes |

## Project Structure

```
Smm Digital/
├── backend/          # Express API (:5001)
├── preview/          # Working React UI (:5173)
├── docs/             # API, walkthrough, reports
├── TRACKER.md
└── README.md
```

> Note: empty `frontend/` (Aadrika scaffold) is unused — **use `preview/`**.

## Getting Started

### Backend
```bash
cd backend
npm install
npm run seed          # categories, projects, roles + money story
# or: npm run seed:money
npm run dev
```

### Frontend
```bash
cd preview
npm install
npm run dev
```

Open http://localhost:5173 · API http://localhost:5001/api

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@smglobal.com | Super@2026 |
| Admin | ops@smglobal.com | Admin@2026 |
| Developer | rahul.dev@smglobalhub.com | Dev@2026 |
| Client | client@demo.com | Client@2026 |
