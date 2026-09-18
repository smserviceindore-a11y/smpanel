# SM Global Solution Hub — Complete Project Plan

> **Team:** Sagar (Lead + Backend) · Aadrika (Frontend) · Ambikeshwar (Out)  
> **Stack:** React + Vite · Node.js + Express · MongoDB · Cloudinary · JWT  
> **Last Updated:** September 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Team Roles & Responsibilities](#2-team-roles--responsibilities)
3. [Full Folder Structure](#3-full-folder-structure)
4. [Database Design](#4-database-design)
5. [API Architecture & Connections](#5-api-architecture--connections)
6. [How Everything Connects](#6-how-everything-connects)
7. [Phase-wise Development Plan](#7-phase-wise-development-plan)
8. [Environment Setup Guide](#8-environment-setup-guide)
9. [API Endpoints Reference](#9-api-endpoints-reference)
10. [Frontend ↔ Backend Integration Guide](#10-frontend--backend-integration-guide)
11. [Security Checklist](#11-security-checklist)
12. [Deployment Guide](#12-deployment-guide)
13. [Daily Workflow](#13-daily-workflow)

---

## 1. Project Overview

### What is SM Global Solution Hub?

Ek **centralized digital sales platform** jahan:

- SM Global Tech Solutions apne projects showcase karegi
- Clients live demo ke through projects experience karenge
- Clients customize/requirement submit karenge
- Admin leads manage karega
- (Phase 2+) Developers apne projects submit karenge

### Core Business Flow

```
Visitor
  ↓
Explore Projects (Gallery / Search)
  ↓
Open Live Demo
  ↓
Like a Project
  ↓
"Customize This Project" OR "Submit Requirement"
  ↓
Smart Project Recommendations
  ↓
SM Global Team Reviews Lead
  ↓
Contact Client → Quotation → Payment → Development → Delivery
```

### Phase Summary

| Phase | Focus | Timeline |
|-------|-------|----------|
| **Phase 1 — MVP** | Company projects, gallery, forms, admin | Weeks 1–4 |
| **Phase 2** | Developer marketplace | Weeks 5–8 |
| **Phase 3** | CRM, quotation, payments | Weeks 9–12 |
| **Phase 4** | AI assistant, smart matching | Future |

---

## 2. Team Roles & Responsibilities

### Sagar (Lead + Backend)

| Task | Details |
|------|---------|
| Project lead | Scope, deadlines, team coordination |
| Backend development | All APIs, database, auth, file upload |
| API documentation | Postman collection + API.md for Aadrika |
| DevOps | MongoDB Atlas, backend hosting, env setup |
| Integration | Connect frontend when Aadrika is ready |
| Admin seed data | Sample projects, categories |

### Aadrika (Frontend)

| Task | Details |
|------|---------|
| Public website UI | Home, gallery, project detail, forms |
| Admin panel UI | Login, project management, leads |
| API integration | TanStack Query + axios |
| Responsive design | Mobile + desktop |
| Uses API docs | Works with mock data until backend is ready |

### Communication Rule

```
Har naya backend endpoint ready hone par:
  → API.md update karo
  → Aadrika ko message bhejo
  → Postman collection share karo
```

---

## 3. Full Folder Structure

```
sm-global-hub/
│
├── backend/                          # Sagar ka kaam
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 # MongoDB connection
│   │   │   ├── cloudinary.js         # Cloudinary setup
│   │   │   └── env.js                # Env validation
│   │   │
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Category.js
│   │   │   ├── Project.js
│   │   │   ├── Requirement.js
│   │   │   ├── CustomizationRequest.js
│   │   │   ├── Developer.js          # Phase 2
│   │   │   ├── ProjectApproval.js    # Phase 2
│   │   │   └── Transaction.js        # Phase 3
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── project.routes.js
│   │   │   ├── category.routes.js
│   │   │   ├── requirement.routes.js
│   │   │   ├── customization.routes.js
│   │   │   ├── upload.routes.js
│   │   │   ├── admin.routes.js
│   │   │   └── developer.routes.js   # Phase 2
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── project.controller.js
│   │   │   ├── category.controller.js
│   │   │   ├── requirement.controller.js
│   │   │   ├── customization.controller.js
│   │   │   ├── upload.controller.js
│   │   │   ├── admin.controller.js
│   │   │   └── developer.controller.js  # Phase 2
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js       # JWT verify
│   │   │   ├── role.middleware.js       # Admin/Developer check
│   │   │   ├── upload.middleware.js     # Multer + Cloudinary
│   │   │   ├── validate.middleware.js   # express-validator
│   │   │   ├── rateLimit.middleware.js
│   │   │   └── error.middleware.js
│   │   │
│   │   ├── utils/
│   │   │   ├── generateSlug.js
│   │   │   ├── generateLeadId.js        # SGH-10001 format
│   │   │   ├── recommendationEngine.js  # Project matching
│   │   │   ├── apiResponse.js           # Standard response format
│   │   │   └── pagination.js
│   │   │
│   │   ├── validators/
│   │   │   ├── auth.validator.js
│   │   │   ├── project.validator.js
│   │   │   ├── requirement.validator.js
│   │   │   └── customization.validator.js
│   │   │
│   │   ├── seeds/
│   │   │   ├── seedAdmin.js
│   │   │   ├── seedCategories.js
│   │   │   └── seedProjects.js
│   │   │
│   │   └── app.js                       # Express app setup
│   │
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js                        # Entry point
│
├── frontend/                            # Aadrika ka kaam
│   ├── public/
│   │   ├── favicon.ico
│   │   └── logo.png
│   │
│   ├── src/
│   │   ├── assets/
│   │   │   └── images/
│   │   │
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── SearchBar.jsx
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   ├── ErrorMessage.jsx
│   │   │   │   └── Pagination.jsx
│   │   │   │
│   │   │   ├── projects/
│   │   │   │   ├── ProjectCard.jsx
│   │   │   │   ├── ProjectGrid.jsx
│   │   │   │   ├── ProjectFilters.jsx
│   │   │   │   ├── ProjectHero.jsx
│   │   │   │   ├── FeatureList.jsx
│   │   │   │   ├── ScreenshotGallery.jsx
│   │   │   │   └── VideoPlayer.jsx
│   │   │   │
│   │   │   ├── forms/
│   │   │   │   ├── RequirementForm.jsx
│   │   │   │   ├── CustomizeForm.jsx
│   │   │   │   └── FormField.jsx
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── AdminSidebar.jsx
│   │   │       ├── ProjectForm.jsx
│   │   │       ├── LeadTable.jsx
│   │   │       └── StatsCard.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   ├── HomePage.jsx
│   │   │   │   ├── ProjectsPage.jsx
│   │   │   │   ├── ProjectDetailPage.jsx
│   │   │   │   ├── IndustriesPage.jsx
│   │   │   │   ├── SubmitRequirementPage.jsx
│   │   │   │   ├── CustomizeProjectPage.jsx
│   │   │   │   ├── AboutPage.jsx
│   │   │   │   └── ContactPage.jsx
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── AdminLoginPage.jsx
│   │   │       ├── AdminDashboardPage.jsx
│   │   │       ├── AdminProjectsPage.jsx
│   │   │       ├── AdminProjectFormPage.jsx
│   │   │       ├── AdminCategoriesPage.jsx
│   │   │       ├── AdminRequirementsPage.jsx
│   │   │       └── AdminCustomizationsPage.jsx
│   │   │
│   │   ├── services/
│   │   │   ├── api.js                   # Axios instance
│   │   │   ├── auth.service.js
│   │   │   ├── project.service.js
│   │   │   ├── category.service.js
│   │   │   ├── requirement.service.js
│   │   │   └── customization.service.js
│   │   │
│   │   ├── hooks/
│   │   │   ├── useProjects.js
│   │   │   ├── useAuth.js
│   │   │   └── useDebounce.js
│   │   │
│   │   ├── store/
│   │   │   └── authStore.js             # Zustand
│   │   │
│   │   ├── utils/
│   │   │   ├── constants.js
│   │   │   └── formatters.js
│   │   │
│   │   ├── routes/
│   │   │   ├── PublicRoutes.jsx
│   │   │   ├── AdminRoutes.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                    # Tailwind imports
│   │
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── docs/
│   ├── API.md                           # Full API documentation
│   ├── DATABASE.md                      # Database schema details
│   └── postman/
│       └── SM-Global-Hub.postman_collection.json
│
├── PROJECT_PLAN.md                      # This file
├── TRACKER.md                           # Progress tracker
└── README.md
```

---

## 4. Database Design

### Entity Relationship Overview

```
User (Admin)
  │
  ├── manages → Project (company owned)
  ├── manages → Category
  └── views   → Requirement (leads)
              → CustomizationRequest (leads)

Project
  ├── belongs to → Category
  ├── has many   → screenshots, features
  └── receives   → CustomizationRequest

Requirement
  ├── recommends → Project[] (with matchScore)
  └── has        → attachments[]

CustomizationRequest
  └── belongs to → Project
```

---

### Model 1: User

> Phase 1: Sirf Admin users. Phase 2+: Developer, Client roles add honge.

```javascript
// models/User.js
{
  _id: ObjectId,
  name: String,              // "Sagar Tiwari"
  email: String,             // unique, required
  phone: String,
  password: String,          // bcrypt hashed, never return in API
  role: {
    type: String,
    enum: ["super_admin", "admin", "developer", "client"],
    default: "admin"
  },
  status: {
    type: String,
    enum: ["active", "inactive", "suspended"],
    default: "active"
  },
  profile: {
    avatar: String,          // Cloudinary URL
    bio: String
  },
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `email` (unique)

---

### Model 2: Category

```javascript
// models/Category.js
{
  _id: ObjectId,
  name: String,              // "ERP"
  slug: String,              // "erp" (auto-generated)
  description: String,
  icon: String,              // icon name or URL
  isActive: Boolean,         // default: true
  projectCount: Number,      // denormalized count
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `slug` (unique)

**Seed Categories (Phase 1):**
```
ERP, CRM, HRMS, Payroll, Job Portal, Education,
Healthcare, E-Commerce, Manufacturing, Government,
AI Solutions, Mobile Applications, SaaS, Business Automation
```

---

### Model 3: Project

```javascript
// models/Project.js
{
  _id: ObjectId,
  title: String,                    // "SM HR Pro"
  slug: String,                     // "sm-hr-pro" (auto-generated, unique)
  shortDescription: String,         // Card ke liye (max 150 chars)
  description: String,              // Full description (HTML/markdown)

  category: ObjectId,               // ref: Category
  industry: String,                 // "Manufacturing", "HR", "Healthcare"
  projectType: String,              // "ERP", "HRMS", "SaaS"
  technologies: [String],           // ["React", "Node.js", "MongoDB"]

  features: [String],               // ["Inventory Management", "Payroll", ...]
  screenshots: [{
    url: String,                    // Cloudinary URL
    caption: String,                // "Dashboard", "Login Page"
    order: Number
  }],
  videoUrl: String,                 // YouTube/Vimeo embed URL
  videoThumbnail: String,

  demoUrl: String,                  // Live demo link
  demoCredentials: {                // Admin only — NOT in public API
    username: String,
    password: String,
    notes: String
  },
  liveDemoAvailable: Boolean,

  price: {
    displayText: String,            // "Starting from ₹2,00,000"
    min: Number,
    max: Number,
    currency: String                // "INR"
  },
  customizable: Boolean,

  ownerType: {
    type: String,
    enum: ["company", "developer"],
    default: "company"              // Phase 1: always "company"
  },
  developerId: ObjectId,            // ref: Developer (Phase 2 only)

  status: {
    type: String,
    enum: ["draft", "published", "featured", "archived"],
    default: "draft"
  },
  featured: Boolean,                // Home page featured section
  tier: {
    type: Number,
    enum: [1, 2, 3],               // 1=Featured, 2=Ready-to-customize, 3=Developer
    default: 1
  },

  views: Number,                    // default: 0
  demoViews: Number,

  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },

  createdBy: ObjectId,              // ref: User (admin who created)
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `slug` (unique)
- `status + featured`
- `category + industry`
- Text index on `title`, `description`, `features`

---

### Model 4: Requirement (Client Lead)

```javascript
// models/Requirement.js
{
  _id: ObjectId,
  leadId: String,                   // "SGH-10001" (auto-generated, unique)

  // Client Business Details
  name: String,
  company: String,
  email: String,
  mobile: String,
  industry: String,
  location: String,

  // Requirement Details
  projectType: String,              // "ERP", "HRMS", "Website"
  modules: [String],                // ["Inventory", "Payroll", "Attendance"]
  numUsers: Number,

  // What they need
  needsWeb: Boolean,
  needsMobile: Boolean,
  needsWebsite: Boolean,
  needsERP: Boolean,
  needsAI: Boolean,
  needsAPI: Boolean,

  // Commercial
  budget: String,                   // "₹2,00,000 - ₹5,00,000"
  timeline: String,                 // "2-3 months"
  additionalNotes: String,

  attachments: [{
    url: String,
    name: String,
    type: String                    // "pdf", "doc"
  }],

  // System Generated
  recommendedProjects: [{
    projectId: ObjectId,            // ref: Project
    matchScore: Number              // 0-99
  }],

  status: {
    type: String,
    enum: [
      "new",
      "contacted",
      "requirement_discussed",
      "demo_given",
      "quotation_sent",
      "negotiation",
      "won",
      "lost"
    ],
    default: "new"
  },

  adminNotes: String,               // Internal notes
  assignedTo: ObjectId,             // ref: User (admin)

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** `leadId` (unique), `status`, `email`

---

### Model 5: CustomizationRequest

```javascript
// models/CustomizationRequest.js
{
  _id: ObjectId,
  leadId: String,                   // "SGH-10025" (auto-generated)

  // Client Info
  name: String,
  company: String,
  email: String,
  mobile: String,

  // Project Reference
  projectId: ObjectId,              // ref: Project
  projectTitle: String,             // denormalized for quick display

  // Customization Details
  selectedModules: [String],        // ["Inventory", "Production", "Payroll"]
  additionalRequirements: String,

  // Commercial
  budget: String,
  timeline: String,

  status: {
    type: String,
    enum: ["new", "contacted", "quotation_sent", "negotiation", "won", "lost"],
    default: "new"
  },

  adminNotes: String,
  assignedTo: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

---

### Phase 2 Models (Future — abhi mat banao)

```javascript
// Developer — Phase 2
Developer {
  userId, skills[], experience, portfolio, github,
  verificationStatus, rating, totalProjects, totalSales,
  commissionRate
}

// ProjectApproval — Phase 2
ProjectApproval {
  projectId, developerId, reviewer, status,
  comments, reviewDate
}

// Transaction — Phase 3
Transaction {
  clientId, projectId, amount, commission,
  developerAmount, paymentStatus, settlementStatus
}
```

---

## 5. API Architecture & Connections

### Standard Response Format

Har API endpoint yeh format follow karega:

```javascript
// Success — Single item
{
  "success": true,
  "message": "Project fetched successfully",
  "data": { ... }
}

// Success — List with pagination
{
  "success": true,
  "message": "Projects fetched successfully",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 48,
    "totalPages": 4
  }
}

// Error
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Email is required" }
  ]
}
```

### Authentication Flow

```
Admin Login
  POST /api/auth/login  { email, password }
    ↓
  Server validates → returns JWT token
    ↓
  Frontend stores token in Zustand + localStorage
    ↓
  All admin requests include header:
  Authorization: Bearer <token>
    ↓
  auth.middleware.js verifies token
    ↓
  role.middleware.js checks admin role
    ↓
  Request proceeds to controller
```

### File Upload Flow

```
Admin uploads screenshot
  POST /api/upload/image  (multipart/form-data)
    ↓
  upload.middleware.js (Multer) receives file
    ↓
  Cloudinary upload
    ↓
  Returns { url, publicId }
    ↓
  Admin saves URL in project.screenshots[]
```

---

## 6. How Everything Connects

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                        │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │ Public Pages │    │ Admin Panel  │                   │
│  │ (React/Vite) │    │ (React/Vite) │                   │
│  └──────┬───────┘    └──────┬───────┘                   │
│         │                   │                            │
│         └─────────┬─────────┘                            │
│                   │ axios + TanStack Query               │
│                   │ VITE_API_URL                         │
└───────────────────┼─────────────────────────────────────┘
                    │ HTTPS
                    ▼
┌───────────────────────────────────────────────────────────┐
│              BACKEND (Node.js + Express)                   │
│              Port 5000 / Railway / Render                    │
│                                                            │
│  ┌─────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │  CORS   │→ │  Rate Limit  │→ │  Auth Middleware    │  │
│  └─────────┘  └──────────────┘  └─────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                    ROUTES                            │  │
│  │  /api/auth        /api/projects    /api/categories  │  │
│  │  /api/requirements  /api/customization-requests     │  │
│  │  /api/admin/*     /api/upload                       │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                 │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                  CONTROLLERS                         │  │
│  │  Business logic, validation, response formatting     │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────┬────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │  MongoDB    │  │ Cloudinary  │  │   Email     │
   │  Atlas      │  │  (Images/   │  │  (Future)   │
   │  Database   │  │   Docs)     │  │             │
   └─────────────┘  └─────────────┘  └─────────────┘
```

### Page → API Connection Map

| Frontend Page | API Calls | Method |
|---------------|-----------|--------|
| **HomePage** | `/api/projects/featured` | GET |
| **ProjectsPage** | `/api/projects?filters...` | GET |
| **ProjectsPage** | `/api/categories` | GET |
| **ProjectDetailPage** | `/api/projects/:slug` | GET |
| **ProjectDetailPage** | `/api/projects/:id/view` | POST |
| **SubmitRequirementPage** | `/api/requirements` | POST |
| **CustomizeProjectPage** | `/api/projects/:slug` | GET |
| **CustomizeProjectPage** | `/api/customization-requests` | POST |
| **AdminLoginPage** | `/api/auth/login` | POST |
| **AdminDashboardPage** | `/api/admin/dashboard` | GET |
| **AdminProjectsPage** | `/api/admin/projects` | GET |
| **AdminProjectFormPage** | `/api/admin/projects` | POST/PUT |
| **AdminProjectFormPage** | `/api/upload/image` | POST |
| **AdminCategoriesPage** | `/api/admin/categories` | GET/POST/PUT/DELETE |
| **AdminRequirementsPage** | `/api/admin/requirements` | GET |
| **AdminRequirementsPage** | `/api/admin/requirements/:id/status` | PATCH |
| **AdminCustomizationsPage** | `/api/admin/customization-requests` | GET/PATCH |

### Data Flow — Requirement Submit

```
Client fills RequirementForm
        ↓
POST /api/requirements
        ↓
Backend validates input
        ↓
generateLeadId() → "SGH-10001"
        ↓
recommendationEngine() → match projects
        ↓
Save to MongoDB (Requirement collection)
        ↓
Return { leadId, recommendedProjects[] }
        ↓
Frontend shows "Thank you" + recommended projects
        ↓
Admin sees new lead in AdminRequirementsPage
```

### Data Flow — Customize Project

```
Client on ProjectDetailPage clicks "Customize"
        ↓
Navigate to /customize/:slug
        ↓
GET /api/projects/:slug (pre-fill project info)
        ↓
Client selects modules, adds requirements, budget
        ↓
POST /api/customization-requests
        ↓
Backend saves → leadId generated
        ↓
Admin sees in AdminCustomizationsPage
```

---

## 7. Phase-wise Development Plan

---

### PHASE 1 — MVP (Weeks 1–4)
**Goal:** Platform live with SM Global company projects only

#### Week 1 — Backend Foundation (Sagar)

**Day 1–2: Project Setup**
- [ ] GitHub repo create (`sm-global-hub`)
- [ ] Backend folder scaffold
- [ ] Install dependencies:
  ```bash
  npm init -y
  npm install express mongoose bcryptjs jsonwebtoken
  npm install cors helmet express-rate-limit express-validator
  npm install cloudinary multer multer-storage-cloudinary
  npm install dotenv slugify
  npm install --save-dev nodemon
  ```
- [ ] MongoDB Atlas cluster create
- [ ] `.env` file setup
- [ ] `config/db.js` — MongoDB connection
- [ ] `app.js` + `server.js` — Express setup with CORS, helmet
- [ ] Standard `apiResponse.js` utility

**Day 3–4: Auth System**
- [ ] User model
- [ ] `POST /api/auth/login`
- [ ] `GET /api/auth/me`
- [ ] JWT middleware
- [ ] Admin role middleware
- [ ] Seed script — first admin user

**Day 5–7: Categories + Projects**
- [ ] Category model + CRUD
- [ ] Project model (full schema)
- [ ] Slug auto-generation
- [ ] Public GET APIs:
  - `GET /api/projects` (with filters, search, pagination)
  - `GET /api/projects/featured`
  - `GET /api/projects/:slug`
  - `POST /api/projects/:id/view`
- [ ] Admin CRUD APIs:
  - `GET /api/admin/projects`
  - `POST /api/admin/projects`
  - `PUT /api/admin/projects/:id`
  - `DELETE /api/admin/projects/:id`
  - `PATCH /api/admin/projects/:id/status`
- [ ] Seed 14 categories
- [ ] Seed 4 sample projects
- [ ] **Share API.md + Postman with Aadrika**

#### Week 1 — Frontend Foundation (Aadrika)

**Parallel work — mock data se UI banao:**
- [ ] Vite + React project setup
- [ ] Tailwind CSS configure
- [ ] React Router setup
- [ ] Axios + TanStack Query setup
- [ ] Navbar + Footer components
- [ ] HomePage layout (hero + featured section)
- [ ] ProjectCard component
- [ ] ProjectGrid component

---

#### Week 2 — Leads + Upload + Deploy (Sagar)

**Day 8–10: Lead Management APIs**
- [ ] Requirement model
- [ ] CustomizationRequest model
- [ ] `generateLeadId()` utility
- [ ] `POST /api/requirements`
- [ ] `POST /api/customization-requests`
- [ ] Recommendation engine (rule-based)
- [ ] Admin lead APIs:
  - `GET /api/admin/requirements`
  - `GET /api/admin/requirements/:id`
  - `PATCH /api/admin/requirements/:id/status`
  - `GET /api/admin/customization-requests`
  - `PATCH /api/admin/customization-requests/:id/status`

**Day 11–12: Upload + Dashboard**
- [ ] Cloudinary config
- [ ] `POST /api/upload/image`
- [ ] `POST /api/upload/document`
- [ ] `GET /api/admin/dashboard` (stats)
- [ ] Input validation on all endpoints
- [ ] Error handling middleware
- [ ] Rate limiting on public forms

**Day 13–14: Deploy Backend**
- [ ] Deploy to Railway / Render
- [ ] Production MongoDB Atlas
- [ ] Production env variables set
- [ ] Test all endpoints on production URL
- [ ] Update API.md with production URL
- [ ] **Send production URL to Aadrika**

#### Week 2 — Frontend Pages (Aadrika)

- [ ] ProjectsPage (gallery + filters)
- [ ] ProjectDetailPage (all sections)
- [ ] ProjectFilters component
- [ ] RequirementForm (multi-step)
- [ ] CustomizeForm (multi-step)
- [ ] SearchBar component
- [ ] Pagination component

---

#### Week 3 — Admin Panel + Polish

**Sagar:**
- [ ] Bug fixes from Aadrika's feedback
- [ ] Missing API endpoints add
- [ ] More seed data (screenshots, features)
- [ ] CORS fix for frontend URL
- [ ] API performance (indexes verify)

**Aadrika:**
- [ ] AdminLoginPage
- [ ] AdminDashboardPage
- [ ] AdminProjectsPage + ProjectForm
- [ ] AdminCategoriesPage
- [ ] AdminRequirementsPage (lead table)
- [ ] AdminCustomizationsPage
- [ ] Protected routes (admin only)
- [ ] Connect real API (replace mock data)

---

#### Week 4 — Integration + Go Live

**Sagar + Aadrika together:**
- [ ] Frontend `.env` → production API URL
- [ ] End-to-end testing:
  - [ ] Home page loads featured projects
  - [ ] Gallery filters work
  - [ ] Project detail page complete
  - [ ] Requirement form submits → admin sees lead
  - [ ] Customize form submits → admin sees lead
  - [ ] Admin login works
  - [ ] Admin can add/edit/delete projects
  - [ ] Admin can update lead status
  - [ ] Image upload works
  - [ ] Mobile responsive check
- [ ] Bug fixes
- [ ] Frontend deploy (Vercel)
- [ ] Custom domain setup (optional)
- [ ] **Phase 1 LIVE**

---

### PHASE 2 — Developer Marketplace (Weeks 5–8)

**Goal:** Verified developers apne projects submit kar saken

#### Backend (Sagar)
- [ ] Developer model + registration API
- [ ] Developer verification workflow
- [ ] Developer project submit API
- [ ] ProjectApproval model + workflow
- [ ] Admin: approve/reject developer projects
- [ ] Developer dashboard APIs (stats, earnings)
- [ ] Revenue share calculation logic
- [ ] Developer project listing (public)
- [ ] `ownerType: "developer"` support in Project model

#### Frontend (Aadrika)
- [ ] Developer registration page
- [ ] Developer dashboard
- [ ] Submit project form
- [ ] Developer profile page
- [ ] Developer marketplace section
- [ ] "Developer Project" badge on cards
- [ ] Developer project detail page

#### Admin (Both)
- [ ] Developer management (approve/reject/suspend)
- [ ] Project approval queue
- [ ] Commission rate settings

---

### PHASE 3 — Business Automation (Weeks 9–12)

**Goal:** Quotation, payments, client dashboard

#### Backend
- [ ] Transaction model
- [ ] Razorpay integration
- [ ] Quotation generation API
- [ ] PDF generation (quotation)
- [ ] Invoice system
- [ ] Developer commission tracking
- [ ] Settlement workflow
- [ ] Client registration + dashboard APIs
- [ ] Email notifications (Nodemailer / SendGrid)

#### Frontend
- [ ] Client registration + login
- [ ] Client dashboard (my requests, quotations)
- [ ] Quotation view + accept/reject
- [ ] Payment flow (Razorpay)
- [ ] Admin: quotation builder
- [ ] Admin: payment tracking
- [ ] Admin: developer settlement

---

### PHASE 4 — AI Features (Future)

- [ ] AI chat assistant ("What software do you need?")
- [ ] Natural language requirement parsing
- [ ] AI-powered project matching (replace rule-based)
- [ ] Automatic module recommendations
- [ ] AI quotation assistance
- [ ] Smart search (semantic)

---

## 8. Environment Setup Guide

### Prerequisites

```bash
# Install on your Mac
node --version    # v18+ required
npm --version     # v9+
git --version
```

### Step 1: Clone & Setup Backend

```bash
git clone https://github.com/your-org/sm-global-hub.git
cd sm-global-hub/backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev       # Starts on http://localhost:5000
```

### Step 2: Setup Frontend

```bash
cd ../frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev       # Starts on http://localhost:5173
```

### Step 3: Seed Database

```bash
cd backend
npm run seed      # Creates admin user + categories + sample projects
```

### Backend `.env.example`

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sm-global-hub

# JWT
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Admin Seed
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@smglobal.com
ADMIN_PASSWORD=ChangeThisPassword123!
```

### Frontend `.env.example`

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=SM Global Solution Hub
VITE_APP_TAGLINE=Explore. Experience. Customize.
```

---

## 9. API Endpoints Reference

### Public Endpoints (No Auth Required)

```
GET    /api/categories
GET    /api/projects
GET    /api/projects/featured
GET    /api/projects/:slug
POST   /api/projects/:id/view
POST   /api/requirements
POST   /api/customization-requests
POST   /api/upload/document          (client attachments only)
```

### Auth Endpoints

```
POST   /api/auth/login
GET    /api/auth/me                  (requires JWT)
```

### Admin Endpoints (JWT + Admin Role Required)

```
# Dashboard
GET    /api/admin/dashboard

# Projects
GET    /api/admin/projects
POST   /api/admin/projects
GET    /api/admin/projects/:id
PUT    /api/admin/projects/:id
DELETE /api/admin/projects/:id
PATCH  /api/admin/projects/:id/status

# Categories
GET    /api/admin/categories
POST   /api/admin/categories
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id

# Requirements (Leads)
GET    /api/admin/requirements
GET    /api/admin/requirements/:id
PATCH  /api/admin/requirements/:id/status

# Customization Requests (Leads)
GET    /api/admin/customization-requests
GET    /api/admin/customization-requests/:id
PATCH  /api/admin/customization-requests/:id/status

# Upload
POST   /api/upload/image
```

### Gallery Filter Query Parameters

```
GET /api/projects?
  category=erp                    # Category slug
  &industry=manufacturing         # Industry name
  &projectType=ERP               # Project type
  &technology=react              # Technology filter
  &customizable=true             # Only customizable
  &liveDemo=true                 # Only with live demo
  &ownerType=company             # company | developer
  &search=payroll                # Full text search
  &featured=true                 # Featured only
  &page=1                        # Pagination
  &limit=12                      # Items per page
  &sort=featured                 # featured | newest | popular
```

---

## 10. Frontend ↔ Backend Integration Guide

### Step 1: API Service Setup (Aadrika)

```javascript
// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to admin requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

### Step 2: Project Service Example

```javascript
// frontend/src/services/project.service.js
import api from './api';

export const getFeaturedProjects = () =>
  api.get('/projects/featured');

export const getProjects = (params) =>
  api.get('/projects', { params });

export const getProjectBySlug = (slug) =>
  api.get(`/projects/${slug}`);

export const createProject = (data) =>
  api.post('/admin/projects', data);
```

### Step 3: TanStack Query Hook Example

```javascript
// frontend/src/hooks/useProjects.js
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '../services/project.service';

export const useProjects = (filters) =>
  useQuery({
    queryKey: ['projects', filters],
    queryFn: () => getProjects(filters).then(r => r.data)
  });
```

### Step 4: Connect Checklist

```
Integration day par yeh test karo:

Public Site:
  □ Home page — featured projects load ho rahe hain
  □ Gallery — filters kaam kar rahe hain
  □ Search — results aa rahe hain
  □ Project detail — saari info + screenshots
  □ Live demo button — correct URL open ho raha hai
  □ Requirement form — submit hone par success message
  □ Customize form — submit hone par success message
  □ Recommendations — requirement ke baad projects show ho rahe hain

Admin Panel:
  □ Login — credentials se login ho raha hai
  □ Dashboard — stats show ho rahe hain
  □ Projects list — saare projects dikh rahe hain
  □ Add project — naya project create ho raha hai
  □ Edit project — update ho raha hai
  □ Image upload — screenshot upload ho raha hai
  □ Publish/Feature — status change ho raha hai
  □ Requirements — naye leads dikh rahe hain
  □ Status update — lead status change ho raha hai
  □ Customizations — customize requests dikh rahe hain
```

---

## 11. Security Checklist

### Phase 1 (Must Have)

- [ ] Passwords bcrypt hashed (min 10 rounds)
- [ ] JWT secret strong (32+ chars random)
- [ ] JWT expiry set (7 days for admin)
- [ ] Admin routes protected with auth + role middleware
- [ ] `demoCredentials` NEVER in public API response
- [ ] CORS restricted to frontend URL only
- [ ] Rate limiting: 5 req/min on public forms
- [ ] File upload validation: type + size (max 5MB)
- [ ] Input validation on all POST/PUT endpoints
- [ ] NoSQL injection prevention (sanitize inputs)
- [ ] Helmet.js security headers
- [ ] `.env` in `.gitignore` — never commit secrets

### Phase 2+ (Add Later)

- [ ] Refresh token rotation
- [ ] Activity logs
- [ ] IP-based rate limiting
- [ ] File virus scan
- [ ] HTTPS only in production
- [ ] Database backup automation

---

## 12. Deployment Guide

### Backend — Railway (Recommended)

```bash
# 1. Railway.app par account banao
# 2. New Project → Deploy from GitHub
# 3. Root directory: backend/
# 4. Environment variables add karo (.env se)
# 5. Deploy → URL milega: https://sm-global-hub.up.railway.app
```

### Frontend — Vercel

```bash
# 1. Vercel.com par account banao
# 2. Import GitHub repo
# 3. Root directory: frontend/
# 4. Environment variable: VITE_API_URL=https://your-railway-url/api
# 5. Deploy → URL milega: https://sm-global-hub.vercel.app
```

### MongoDB Atlas

```
1. mongodb.com/atlas → Free cluster
2. Database user banao
3. Network access → 0.0.0.0/0 (all IPs for Railway)
4. Connection string copy → MONGODB_URI mein daalo
```

### Cloudinary

```
1. cloudinary.com → Free account
2. Dashboard se Cloud Name, API Key, API Secret copy karo
3. .env mein daalo
```

---

## 13. Daily Workflow

### Sagar ka daily routine

```
🌅 Morning (30 min)
   - Aadrika se sync: kya chahiye? koi issue?
   - TRACKER.md update karo

💻 Dev Time (4-6 hours)
   - Backend features build
   - Postman se test karo
   - API.md update karo (har naya endpoint)

🌙 Evening (30 min)
   - Git commit + push
   - TRACKER.md mein completed items tick karo
   - Aadrika ko message: "X ready hai, test karo"
```

### Git commit message format

```
feat: add requirement submit API
fix: CORS issue on production
docs: update API.md with upload endpoints
seed: add 4 sample company projects
```

### Weekly sync meeting (Sagar + Aadrika)

```
Agenda (30 min):
1. Kya complete hua is week?
2. Koi blockers?
3. Next week priorities?
4. API changes jo frontend affect karenge?
5. TRACKER.md review
```

---

## Quick Reference

| Need | File/Location |
|------|---------------|
| API documentation | `docs/API.md` |
| Database schema | `docs/DATABASE.md` |
| Postman collection | `docs/postman/` |
| Progress tracking | `TRACKER.md` |
| Backend code | `backend/src/` |
| Frontend code | `frontend/src/` |
| Environment vars | `backend/.env.example` |

---

*Document maintained by Sagar. Update karo jab bhi koi decision change ho.*
