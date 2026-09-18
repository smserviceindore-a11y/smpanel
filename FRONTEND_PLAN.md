# SM Global Solution Hub — Frontend Plan & Tracker

> **Purpose:** Temporary preview + final frontend roadmap  
> **Owner:** Sagar (preview / lead) · Aadrika (main frontend)  
> **Backend API:** `http://localhost:5001/api` · Docs: [`docs/API.md`](./docs/API.md)  
> **Last Updated:** September 2026

---

## Table of Contents

1. [Strategy & Roles](#1-strategy--roles)
2. [Design Direction](#2-design-direction)
3. [Architecture](#3-architecture)
4. [Features (Phase-wise)](#4-features-phase-wise)
5. [How It Works (User Flows)](#5-how-it-works-user-flows)
6. [Performance & Scale Optimization](#6-performance--scale-optimization)
7. [Folder Structure](#7-folder-structure)
8. [Page Specs](#8-page-specs)
9. [Build Plan (Days)](#9-build-plan-days)
10. [Frontend Tracker](#10-frontend-tracker)
11. [Handoff to Aadrika](#11-handoff-to-aadrika)

---

## 1. Strategy & Roles

### Two frontend tracks (no conflict)

| Folder | Who | Purpose |
|--------|-----|---------|
| `preview/` | Sagar | Fast test UI + college demo while Aadrika builds |
| `frontend/` | Aadrika | Final production UI (same API, polished design) |

**Rule:** Preview pehle API prove karega. Aadrika later same endpoints use karegi. Shared patterns (api service, card layout ideas) copy kar sakti hai — folders alag rahenge.

### Why preview first?

- Backend already ready — waiting wastes time  
- College demo jaldi dikh sakta hai  
- Forms, filters, detail HTML rendering early test  
- Aadrika free hai design polish pe focus karne ke liye  

---

## 2. Design Direction

### ThemeForest inspiration — kya lein / kya na lein

| ThemeForest se lo | ThemeForest se mat lo |
|-------------------|------------------------|
| Product marketplace card grid | Cluttered sidebars + too many badges |
| Strong “Live Preview” CTA | Generic purple gradient templates |
| Filters + search | Fake review stars / sales counters |
| Clean item detail layout | Heavy multi-column newspaper look |

### Visual language (SM Global)

```
Brand:        SM Global Solution Hub (hero-level, not just nav)
Tone:         Professional SaaS marketplace / sales engine
Background:   Soft off-white + subtle mesh/gradient atmosphere
Accent:       Deep teal / navy (NOT purple-on-white AI default)
Typography:   Distinct display + clean body (not Inter/Roboto default)
Cards:        Used for project browsing (interaction containers)
Hero:         Full-bleed atmosphere + brand + 1 headline + 1 line + CTAs
Motion:       2–3 intentional (fade-in cards, filter transition, detail enter)
```

### Composition rules

1. First viewport = one composition (not a dashboard)  
2. Brand must survive even if nav removed  
3. One job per section  
4. Company projects visually above developer projects when mixed  

---

## 3. Architecture

```
Browser (preview / frontend)
    │
    │  Axios + React Query
    │  VITE_API_URL=http://localhost:5001/api
    ▼
Backend Express API (:5001)
    │
    ├── MongoDB Atlas (projects, leads, users)
    └── Cloudinary (luysen3q) — images/docs
```

### Core libraries

| Lib | Why |
|-----|-----|
| React + Vite | Fast DX, same as project stack |
| Tailwind CSS | Utility styling, consistent design tokens |
| React Router | Public + admin routes |
| TanStack Query | Cache, pagination, stale-while-revalidate |
| Axios | API client + JWT interceptor |
| Zustand | Auth token / admin session only |

### Data flow (optimized)

```
List page
  → useQuery(['projects', filters, page])
  → GET /projects?page=&limit=&...
  → Cache key includes filters → back-navigation instant

Detail page
  → useQuery(['project', slug])
  → GET /projects/:slug
  → Prefetch on card hover (optional later)

Forms
  → useMutation → POST /requirements | /customization-requests
  → Invalidate admin lead queries if admin open
```

---

## 4. Features (Phase-wise)

### Preview Phase A — Public marketplace (must)

| Feature | Description |
|---------|-------------|
| Home | Hero + Featured projects |
| Project Gallery | Grid + search + filters + pagination |
| Project Detail | HTML description, features, screenshots, demo CTA |
| Owner badges | Company vs Developer |
| Live Demo button | Opens `demoUrl` |
| Customize CTA | Goes to customize flow |
| Submit Requirement | Multi-step form → API + recommendations UI |
| Customize Project | Modules + budget + timeline → API |
| Responsive layout | Mobile + desktop |

### Preview Phase B — Admin light (should)

| Feature | Description |
|---------|-------------|
| Admin login | JWT store |
| Dashboard stats | Counts from `/admin/dashboard` |
| Projects list | Draft/published management |
| Lead lists | Requirements + customization requests |
| Status update | Patch lead status |
| Image upload | Cloudinary via `/upload/image` |

### Final Frontend Phase C — Aadrika polish (later)

| Feature | Description |
|---------|-------------|
| Full design system | Brand fonts, motion, marketing pages |
| About / Contact | Content pages |
| Industries page | Industry-based browsing |
| Better admin UX | Tables, filters, rich project editor |
| SEO meta | Per project title/description |
| Accessibility | Keyboard, focus, alt texts |

### Out of preview scope (Phase 2+)

- Developer self-registration UI  
- Payments / Razorpay  
- AI chat assistant  
- Quotation PDF builder  

---

## 5. How It Works (User Flows)

### Visitor → Lead

```
Home / Gallery
  → Open project detail
  → Launch Live Demo (external)
  → Like it → Customize This Project
       OR
  → Submit Requirement (no project selected)
  → See recommended matches (%)
  → Thank you + leadId (SGH-xxxxx)
  → Admin sees lead in panel
```

### Admin

```
/admin/login
  → Dashboard
  → Manage projects (CRUD / feature / publish)
  → View requirement leads → update status
  → View customization requests → update status
  → Upload screenshots to Cloudinary
```

### Frontend ↔ Backend contract

| UI Action | API |
|-----------|-----|
| Featured section | `GET /projects/featured` |
| Gallery | `GET /projects?page&limit&filters` |
| Detail | `GET /projects/:slug` |
| View count | `POST /projects/:id/view` |
| Requirement form | `POST /requirements` |
| Customize form | `POST /customization-requests` |
| Admin login | `POST /auth/login` |
| Admin stats | `GET /admin/dashboard` |

Detail `description` is **HTML** → render with `dangerouslySetInnerHTML` inside a sanitized/prose container.

---

## 6. Performance & Scale Optimization

Goal: **100 projects today, 1000+ later — still smooth.**

### A. Network & data fetching

| Technique | How |
|-----------|-----|
| **Server pagination** | Always `page` + `limit` (default 12). Never fetch all projects on gallery. |
| **Query key caching** | TanStack Query keys: `['projects', {filters, page}]` |
| **Stale time** | Gallery `staleTime: 60_000` (1 min) — reduce refetch spam |
| **Prefetch** | On card hover, prefetch detail query for that slug |
| **Debounced search** | Search input debounce 300–400ms before API call |
| **Keep previous data** | `placeholderData: keepPreviousData` while page changes |

### B. Rendering

| Technique | How |
|-----------|-----|
| **Virtualization (later)** | If >50 cards in one view without pagination — use `virtua` / `tanstack-virtual`. With pagination usually not needed. |
| **Image lazy loading** | `loading="lazy"` + Cloudinary transforms (`w_600,q_auto,f_auto`) |
| **Code splitting** | React.lazy for Admin, Detail, Forms routes |
| **Memo cards** | `ProjectCard` as pure component; avoid re-render whole grid on unrelated state |

### C. Images (Cloudinary `luysen3q`)

| Technique | How |
|-----------|-----|
| Responsive URLs | Request sized images, not full originals |
| Format auto | `f_auto,q_auto` |
| Blur placeholder | Tiny LQIP or CSS skeleton |
| Screenshot gallery | Load thumbnails first; full size on click |

### D. Forms & UX under load

| Technique | How |
|-----------|-----|
| Optimistic disable | Submit button disabled while mutation pending |
| Client validation | Before API (email/mobile required) |
| Error toasts | Show API `message` / `errors[]` |
| Rate limit UX | If 429, show “Try again in a minute” |

### E. Admin tables (many leads)

| Technique | How |
|-----------|-----|
| Paginated leads | `page` + `limit` on admin APIs |
| Status filter chips | Don’t load all statuses at once |
| Column minimalism | LeadId, name, company, status, date |

### F. Bundle & runtime

| Technique | How |
|-----------|-----|
| Route-based chunks | Admin separate from public |
| Avoid huge icon packs | Use few SVG icons |
| No unnecessary global state | Server state in React Query; only auth in Zustand |

### G. Backend cooperation (already partly done)

| Already | Still good to remember |
|---------|------------------------|
| Pagination + filters on `/projects` | Don’t add client-only filtering of huge arrays |
| Text index on projects | Keep search server-side |
| Rate limits on forms | Frontend must handle errors gracefully |

### Scale checklist (when data grows)

- [ ] Gallery always paginated (12/24 per page)  
- [ ] Search debounced  
- [ ] Images via Cloudinary transforms  
- [ ] Detail routes lazy-loaded  
- [ ] React Query cache tuned  
- [ ] Admin lists paginated  
- [ ] Lighthouse mobile ≥ 80 on Home + Gallery  

---

## 7. Folder Structure

```
preview/                          # Sagar temp UI
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── layout/               # Navbar, Footer, Shell
│   │   ├── projects/             # Card, Grid, Filters, Badge
│   │   ├── forms/                # Requirement, Customize
│   │   └── ui/                   # Button, Input, Spinner, Pagination
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── ProjectsPage.jsx
│   │   ├── ProjectDetailPage.jsx
│   │   ├── RequirementPage.jsx
│   │   ├── CustomizePage.jsx
│   │   └── admin/
│   │       ├── AdminLoginPage.jsx
│   │       ├── AdminDashboardPage.jsx
│   │       ├── AdminProjectsPage.jsx
│   │       └── AdminLeadsPage.jsx
│   ├── services/
│   │   └── api.js                # Axios instance
│   ├── hooks/
│   │   ├── useProjects.js
│   │   ├── useProject.js
│   │   └── useDebounce.js
│   ├── store/
│   │   └── authStore.js
│   ├── styles/
│   │   └── index.css             # Tailwind + CSS variables
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── package.json
└── vite.config.js

frontend/                         # Aadrika final (later, same patterns)
```

---

## 8. Page Specs

### Home

- Brand + headline: Explore. Experience. Customize.  
- Subline: live solutions by SM Global + verified developers  
- CTAs: Explore Projects · Submit Requirement  
- Section: Featured (`GET /projects/featured`)  

### Projects (Gallery)

- Search box (debounced)  
- Filters: category, industry, ownerType, liveDemo, customizable  
- Sort: featured / newest / popular  
- Grid of `ProjectCard`  
- Pagination controls  

### Project Detail (`/projects/:slug`)

1. Title + badges (Company / Developer, Featured)  
2. Short description  
3. Live Demo + Customize buttons  
4. Full HTML description (prose styles for h1/h2/p/ul)  
5. Features chips/list  
6. Screenshots gallery  
7. Tech stack  
8. Price display text  

### Submit Requirement

Steps: Business details → Need/modules → Budget/timeline → Review → Submit  
Success: show `leadId` + recommended projects cards  

### Customize

Load project by slug → select modules → notes → budget/timeline → submit  

### Admin (light)

Login → Dashboard cards → Projects table → Leads tabs (Requirement / Customization)  

---

## 9. Build Plan (Days)

### Preview track (Sagar)

| Day | Deliverable |
|-----|-------------|
| **Day 1** | Vite + Tailwind + Router + API client + Navbar/Footer + Home featured |
| **Day 2** | Gallery (filters, search, pagination) + ProjectCard + Detail page HTML |
| **Day 3** | Requirement form + Customize form + success states |
| **Day 4** | Admin login + dashboard + leads list + status patch |
| **Day 5** | Polish, mobile QA, Cloudinary upload in admin, performance pass |

### Final track (Aadrika — parallel after Day 1 API docs)

| Week | Focus |
|------|-------|
| Week 1 | Design system + Home + Gallery shell |
| Week 2 | Detail + forms |
| Week 3 | Admin full UI |
| Week 4 | Connect production API + polish |

---

## 10. Frontend Tracker

**Legend:** ✅ Done · 🔄 In Progress · ⬜ Not Started · ⚪ Later

### Overall

| Track | Status | Progress |
|-------|--------|----------|
| Preview (`preview/`) | 🔄 In Progress | 85% |
| Final (`frontend/`) | ⬜ Not Started (Aadrika) | 0% |

### Preview — Setup

| # | Task | Owner | Status |
|---|------|-------|--------|
| F1 | Create `preview/` Vite + React app | Sagar | ✅ |
| F2 | Tailwind + design CSS variables | Sagar | ✅ |
| F3 | React Router public + admin routes | Sagar | ✅ |
| F4 | Axios API client + env `VITE_API_URL` | Sagar | ✅ |
| F5 | TanStack Query provider | Sagar | ✅ |
| F6 | Navbar + Footer layout | Sagar | ✅ |

### Preview — Public pages

| # | Task | Owner | Status |
|---|------|-------|--------|
| F7 | Home hero + featured section | Sagar | ✅ |
| F8 | ProjectCard + badges | Sagar | ✅ |
| F9 | Projects gallery + filters | Sagar | ✅ |
| F10 | Debounced search | Sagar | ✅ |
| F11 | Pagination | Sagar | ✅ |
| F12 | Project detail page | Sagar | ✅ |
| F13 | HTML description rendering | Sagar | ✅ |
| F14 | Screenshot gallery | Sagar | ✅ |
| F15 | Live Demo button | Sagar | ✅ |
| F16 | Requirement multi-step form | Sagar | ✅ |
| F17 | Recommendations after submit | Sagar | ✅ |
| F18 | Customize multi-step form | Sagar | ✅ |
| F19 | Mobile responsive pass | Sagar | ✅ |

### Preview — Admin

| # | Task | Owner | Status |
|---|------|-------|--------|
| F20 | Admin login + Zustand auth | Sagar | ✅ |
| F21 | Protected admin routes | Sagar | ✅ |
| F22 | Dashboard stats | Sagar | ✅ |
| F23 | Admin projects list | Sagar | ✅ |
| F24 | Admin leads (requirements) | Sagar | ✅ |
| F25 | Admin leads (customizations) | Sagar | ✅ |
| F26 | Lead status update | Sagar | ✅ |
| F27 | Image upload (Cloudinary) | Sagar | ⬜ |

### Preview — Multi-role dashboards

| # | Task | Owner | Status |
|---|------|-------|--------|
| F33 | Shared `/login` + role redirect | Sagar | ✅ |
| F34 | Super Admin (`/super-admin`) | Sagar | ✅ |
| F35 | Admin ops + developers page | Sagar | ✅ |
| F36 | Developer dashboard (`/developer`) | Sagar | ✅ |
| F37 | Client / buyer dashboard (`/client`) | Sagar | ✅ |
| F38 | RoleProtectedRoute guards | Sagar | ✅ |

### Preview — Performance

| # | Task | Owner | Status |
|---|------|-------|--------|
| F28 | Pagination only (no full dump) | Sagar | ✅ |
| F29 | Query cache + staleTime | Sagar | ✅ |
| F30 | Lazy route splitting | Sagar | ✅ |
| F31 | Image lazy + sized URLs | Sagar | 🔄 |
| F32 | Search debounce | Sagar | ✅ |

### Final frontend (Aadrika)

| # | Task | Owner | Status |
|---|------|-------|--------|
| A1 | `frontend/` Vite setup | Aadrika | ⬜ |
| A2 | Design system / branding | Aadrika | ⬜ |
| A3 | All public pages polished | Aadrika | ⬜ |
| A4 | Full admin panel UX | Aadrika | ⬜ |
| A5 | About / Contact / Industries | Aadrika | ⬜ |
| A6 | Production connect + deploy | Both | ⬜ |

---

## 11. Handoff to Aadrika

Share these files:

1. [`docs/API.md`](./docs/API.md)  
2. [`docs/PROJECT_LINKS.md`](./docs/PROJECT_LINKS.md)  
3. [`docs/postman/SM-Global-Hub.postman_collection.json`](./docs/postman/SM-Global-Hub.postman_collection.json)  
4. This plan: [`FRONTEND_PLAN.md`](./FRONTEND_PLAN.md)  
5. Credentials (API URL + admin login) from `CREDENTIALS.md`

```env
VITE_API_URL=http://localhost:5001/api
```

Admin test login:
- Email: `admin@smglobal.com`
- Password: `SmGlobal@2026`

Multi-role demo logins (preferred): see `CREDENTIALS.md` — Super Admin / Admin / Developer / Client at `http://localhost:5173/login`

---

## Quick Decisions Log

| Decision | Choice |
|----------|--------|
| Temp UI folder | `preview/` |
| Final UI folder | `frontend/` (Aadrika) |
| Design vibe | Clean marketplace (ThemeForest-inspired, not cloned) |
| Data fetching | TanStack Query + paginated APIs |
| Images | Cloudinary cloud `luysen3q` |
| Description format | HTML (`h1/h2/p/ul`) from backend |
| Scale strategy | Pagination first, virtualization only if needed |

---

*Update this tracker as preview tasks complete. Start build when ready — Day 1 = scaffold + Home.*
