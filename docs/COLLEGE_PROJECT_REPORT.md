# SM Global Solution Hub — College Project Report

**Project type:** Full-stack digital marketplace (college / academic demonstration)  
**Working application:** React frontend (`preview/`) + Node.js/Express API (`backend/`) + MongoDB  
**Local demo:** Frontend `http://localhost:5173` · API `http://localhost:5001`

---

## 1. Project overview

**SM Global Solution Hub** is a web platform where:

- Buyers discover ready-made digital projects / products  
- Developers list and sell projects on the marketplace  
- Clients can request custom work or buy existing products  
- Admins manage approvals, leads, quotations, payments, settlements, and reports  
- Support / ops staff handle live chat, contact messages, and follow-up reminders  

The system is built end-to-end as a **college project / demo product** (not a production commercial launch). Core marketplace, role-based dashboards, payments (test/demo), reports, and live chat are implemented and runnable locally.

---

## 2. Problem statement

Small agencies and freelancers often sell digital projects through scattered WhatsApp chats, static websites, and manual Excel tracking. There is no single place for:

- Project catalogue + live demos  
- Role-based staff and seller panels  
- Lead capture and CRM-style follow-ups  
- Quotations → payment → invoice → developer wallet / payout  

This project demonstrates a unified hub that covers discovery, sales ops, and support in one application.

---

## 3. Objectives

| Objective | Status |
|-----------|--------|
| Public marketplace (browse, detail, contact, customize) | Done |
| Multi-role authentication (JWT) | Done |
| Admin / Super Admin operations | Done |
| Developer listing + wallet / payouts | Done |
| Client buy / quotations / invoices | Done |
| Contact inbox + live chat support | Done |
| CRM follow-ups & reminders | Done |
| Reports, charts, Excel / PDF exports | Done |
| Seeded demo data for viva / presentation | Done |

---

## 4. Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS, React Router, TanStack Query, Zustand |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT with roles |
| Payments | Razorpay (test) + demo pay path for college demo |
| Media | Cloudinary (configurable in Super Admin settings) |
| Exports | ExcelJS, PDFKit |

---

## 5. User roles in the system

| Role | What they can do |
|------|------------------|
| **Super Admin** | Full platform control: users, settings (Razorpay/Cloudinary/GST), payment reports, audit log, all ops modules |
| **Admin** | Day-to-day ops: projects, approvals, leads, quotations, invoices, settlements, coupons, reports, live chat, follow-ups |
| **Support Agent** | Live chat inbox, leads/requirements, contact inbox, clients/developers directory, follow-ups |
| **Developer** | Submit projects, manage requests, wallet & payouts, coupons |
| **Client / Buyer** | Requirements, customizations, quotations & pay, invoices; help via **Live Chat** on the site |

---

## 6. Major modules / features (what is in this project)

### 6.1 Public website
- Home / branding pages  
- Projects gallery + project detail (including demo links where seeded)  
- Developer marketplace / storefront  
- Submit requirement & customize project flows  
- Contact form → **Contact Inbox** for staff  
- Floating **Live Chat** widget (guest must share name, email, phone before chat)

### 6.2 Authentication & users
- Login / register flows for demo  
- Role-protected dashboards  
- Staff can create users (as per role rules)  
- Users / Clients / Developers directories with detail profiles  

### 6.3 Marketplace & catalogue
- Categories & project CRUD (admin / developer submission)  
- Approval workflow for listings  
- Curation / reviews (admin modules)

### 6.4 Sales & money flow
- Quotations (create, send, PDF)  
- Client payment (Razorpay test / demo)  
- Invoices (PDF)  
- Settlements & developer **wallet** (hold → available → payout request)  
- Admin approve / mark payout paid  
- Coupons  
- Super Admin payment reports  

### 6.5 Leads & CRM-style ops
- **Leads / Requirements** list (from requirement & customization forms)  
- **Contact Inbox** — one-time contact form messages  
- **Follow-ups** — staff-logged call/email/chat notes + next reminder (from client/developer profile)  
- **Live Chat** — real-time visitor ↔ team conversation with limited auto-replies; staff can take over  

### 6.6 Reports & analytics
- Ops reports with filters, pagination, Excel export  
- Master / platform reports with charts and multi-sheet Excel  
- Dashboard KPIs for roles  

### 6.7 Demo / college presentation support
- Seed scripts (`npm run seed`, `npm run seed:money`)  
- Demo credentials (see `CREDENTIALS.md`)  
- Walkthrough docs under `docs/`  

---

## 7. System architecture (simple)

```text
Browser (React · preview/)
        │  REST / JWT
        ▼
Express API (backend/ · port 5001)
        │
        ▼
MongoDB Atlas
        +
Razorpay (test) · Cloudinary · Excel/PDF generation
```

---

## 8. Project structure

```text
Smm Digital/
├── backend/          # Express API, models, controllers, seeds
├── preview/          # Live React UI used for demo
├── docs/             # API, demo walkthrough, checklists, this report
├── CREDENTIALS.md    # Demo logins (college only)
├── PROJECT_PLAN.md   # Original plan
├── FRONTEND_PLAN.md  # Frontend planning notes
├── TRACKER.md        # Progress tracker
└── README.md
```

> The production UI for presentation is **`preview/`**. Early teammate HTML / incomplete frontend drafts were **not** used as the final product.

---

## 9. How to run (for viva / lab)

```bash
# Terminal 1 — API
cd backend
npm install
npm run seed          # optional demo data
npm run dev           # http://localhost:5001

# Terminal 2 — UI
cd preview
npm install
npm run dev           # http://localhost:5173
```

Demo accounts: see `CREDENTIALS.md`.

Suggested 2-minute money demo: `docs/DEMO_WALKTHROUGH.md`.

---

## 10. Team contribution & work division

This section is included for college evaluation honesty: **who contributed what**, and what was actually shipped in the final project.

### 10.1 Team members

| Name | Claimed / intended role | Actual contribution to final project |
|------|-------------------------|--------------------------------------|
| **Sagar Tiwari** | Lead + full-stack | **~99–100% of the working project** (see below) |
| **Ambikeshwar** | Frontend (early) | Very basic HTML-only page(s); not usable as product UI |
| **Aadrika** | Frontend | Partial frontend draft; improvement requested but not delivered |

---

### 10.2 Sagar Tiwari — primary author (≈ 99–100%)

Almost the **entire final system** was designed, implemented, integrated, tested, and documented by Sagar, including:

- Backend architecture (Express, MongoDB models, APIs, auth, roles, middleware)  
- Complete working frontend in `preview/` (React + Vite + Tailwind + dashboards)  
- Marketplace, admin / super-admin / support / developer / client panels  
- Payments, invoices, wallet, payouts, coupons, settings  
- Contact inbox, live chat (guest capture + staff inbox + auto-reply rules)  
- Follow-ups / reminders CRM notes  
- Reports, charts, Excel & PDF exports  
- Seed data, credentials, walkthrough docs, and demo readiness for college  

Without this work, the project would not run as a coherent full-stack product.

---

### 10.3 Ambikeshwar — early HTML attempt (not used)

- Shared a **very basic HTML-based frontend**  
- Quality was **below even a basic usable UI** (static / incomplete; not aligned with the real product)  
- That code was **not suitable** for the marketplace, role dashboards, or API integration  
- **Not part of the final delivered application** (`preview/` was built instead)

**College note:** Contribution was limited to an early, inadequate HTML sample; it did not become the project frontend.

---

### 10.4 Aadrika — frontend draft (incomplete / not improved)

- Provided a frontend that was **somewhat better** than the basic HTML attempt  
- Was clearly asked to **improve and complete** the frontend to product / demo standard  
- **Did not deliver the requested improvements**  
- Final UI used in the project is the independently completed React app under **`preview/`**, not that unfinished draft  

**College note:** Partial early frontend help was acknowledged, but ownership of the finished UI and integration remains with Sagar.

---

### 10.5 Summary table (for evaluators)

| Area | Who delivered the final working version |
|------|-----------------------------------------|
| Project idea / planning docs | Sagar (primary) |
| Backend API + database | Sagar |
| Final React UI (`preview/`) | Sagar |
| Role dashboards & ops features | Sagar |
| Payments / invoices / wallet | Sagar |
| Live chat + contact + follow-ups | Sagar |
| Reports / Excel / PDF | Sagar |
| Demo seed + documentation | Sagar |
| Early basic HTML pages | Ambikeshwar (discarded) |
| Early incomplete frontend draft | Aadrika (not improved; not final) |

**Overall estimate:** Sagar ≈ **99–100%** of the **working college project**. Teammate inputs were early / incomplete frontend attempts that were **not** the basis of the submitted demo.

---

## 11. What was intentionally kept simple (college scope)

- Treated as **college / demo project** (not full commercial launch)  
- Live Razorpay production, full KYC, legal pages, and production deploy are **out of scope** for this submission (see `docs/LAUNCH_CHECKLIST.md` if asked)  
- Ticket-style “Support” module was dropped in favour of **Live Chat** for a clearer demo  

---

## 12. Learning outcomes

- Full-stack product thinking (roles, marketplace, money flow)  
- REST API design with JWT and role middleware  
- React SPA structure with protected routes and dashboard UX  
- MongoDB modelling for catalogue, CRM, chat, and finance  
- Reporting / export (Excel, PDF) and operational UI (inbox, follow-ups, live chat)  
- Honest team contribution documentation for academic evaluation  

---

## 13. Conclusion

**SM Global Solution Hub** is a working full-stack marketplace demo suitable for college presentation: public catalogue, multi-role panels, sales ops, live chat, and reports.

The **final runnable product** was built almost entirely by **Sagar Tiwari**. Teammates **Ambikeshwar** and **Aadrika** provided early frontend material that was either too basic or left unfinished after improvement was requested; that material is **not** the submitted UI.

---

*Document prepared for college viva / project file · SM Global Solution Hub · 2026*
