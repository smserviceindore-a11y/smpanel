# SM Global Solution Hub — API Documentation

> **Base URL (local):** `http://localhost:5001/api`  
> **Team:** Sagar (Backend) · Aadrika (Frontend)  
> **Auth:** JWT Bearer token for admin routes

---

## Standard Response Format

### Success
```json
{
  "success": true,
  "message": "Projects fetched successfully",
  "data": {}
}
```

### Paginated list
```json
{
  "success": true,
  "message": "Success",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 24,
    "totalPages": 2
  }
}
```

### Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Valid email is required" }
  ]
}
```

---

## 1. Health

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/health` | No |

**Example:** [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## 2. Auth

### Login
`POST /auth/login`

```json
{
  "email": "admin@smglobal.com",
  "password": "SmGlobal@2026"
}
```

**Response `data`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "Sagar Admin",
    "email": "admin@smglobal.com",
    "role": "super_admin"
  }
}
```

### Me (current admin)
`GET /auth/me`  
**Header:** `Authorization: Bearer <token>`

---

## 3. Categories (Public)

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/categories` | No |

Returns active categories (`name`, `slug`, `description`, `projectCount`).

---

## 4. Projects (Public)

### List / Gallery
`GET /projects`

| Query | Example | Description |
|-------|---------|-------------|
| `page` | `1` | Page number |
| `limit` | `12` | Max 50 |
| `search` | `payroll` | Text search |
| `category` | `erp` | Category slug or ObjectId |
| `industry` | `Manufacturing` | Industry filter |
| `projectType` | `ERP` | Type filter |
| `technology` | `react` | Tech filter |
| `customizable` | `true` | Only customizable |
| `liveDemo` | `true` | Only with live demo |
| `ownerType` | `company` \| `developer` | Ownership |
| `featured` | `true` | Featured only |
| `sort` | `featured` \| `newest` \| `popular` | Sort |

**Examples:**
- All: `/projects?limit=50`
- Company: `/projects?ownerType=company`
- Developer: `/projects?ownerType=developer`
- Search: `/projects?search=crm`
- Category: `/projects?category=erp`

### Featured (Home)
`GET /projects/featured`

### Detail by slug
`GET /projects/:slug`

**Example:** `/projects/sm-hr-pro`  
**Example:** `/projects/coravo-ai-crm-and-erp-saas`

**Important fields in `data`:**
- `title`, `slug`, `shortDescription`
- `description` — **HTML string** (`h1`, `h2`, `p`, `ul`, `li`) — render with `dangerouslySetInnerHTML`
- `features[]`, `technologies[]`, `screenshots[]`
- `demoUrl`, `liveDemoAvailable`, `price`
- `ownerType` (`company` \| `developer`), `featured`, `category`
- `demoCredentials` are **NOT** returned on public APIs

### Increment views
`POST /projects/:id/view`  
`:id` = MongoDB `_id` (not slug)

---

## 5. Requirements (Public form)

`POST /requirements`  
Rate limit: 5 requests / minute / IP

```json
{
  "name": "Rahul Sharma",
  "company": "ABC Pvt Ltd",
  "email": "rahul@abc.com",
  "mobile": "9876543210",
  "industry": "Manufacturing",
  "location": "Pune",
  "projectType": "ERP",
  "modules": ["Inventory", "Production", "Attendance"],
  "numUsers": 50,
  "needsWeb": true,
  "needsMobile": false,
  "needsERP": true,
  "budget": "₹2,00,000 - ₹5,00,000",
  "timeline": "2-3 months",
  "additionalNotes": "Need GST ready invoices"
}
```

**Required:** `name`, `email`, `mobile`  
**Response:** lead with `leadId` (e.g. `SGH-10001`) + `recommendedProjects[]`

---

## 6. Customization Requests (Public form)

`POST /customization-requests`  
Rate limit: 5 requests / minute / IP

```json
{
  "name": "Priya Verma",
  "company": "XYZ Ltd",
  "email": "priya@xyz.com",
  "mobile": "9876501234",
  "projectId": "68a9...",
  "selectedModules": ["Payroll", "Attendance"],
  "additionalRequirements": "Need biometric sync",
  "budget": "₹1,50,000",
  "timeline": "45 days"
}
```

**Required:** `name`, `email`, `mobile`, `projectId`

---

## 7. Upload

### Document (client attachment — public)
`POST /upload/document`  
`Content-Type: multipart/form-data`  
Field name: `document` (PDF / DOC / DOCX, max 5MB)

### Image (admin only)
`POST /upload/image`  
**Header:** `Authorization: Bearer <token>`  
Field name: `image` (JPEG / PNG / WebP, max 5MB)

> Needs `CLOUDINARY_CLOUD_NAME` in `.env`. Key + secret already set.

---

## 8. Admin APIs

All require: `Authorization: Bearer <token>` + admin role.

### Dashboard
`GET /admin/dashboard`

### Projects
| Method | Endpoint |
|--------|----------|
| GET | `/admin/projects` |
| GET | `/admin/projects/:id` |
| POST | `/admin/projects` |
| PUT | `/admin/projects/:id` |
| DELETE | `/admin/projects/:id` |
| PATCH | `/admin/projects/:id/status` |

**Create body (example):**
```json
{
  "title": "New Project",
  "shortDescription": "Short text",
  "description": "<h1>Title</h1><p>Full HTML...</p>",
  "category": "CATEGORY_OBJECT_ID",
  "industry": "HR",
  "projectType": "HRMS",
  "technologies": ["React", "Node.js"],
  "features": ["Dashboard", "Reports"],
  "demoUrl": "https://...",
  "liveDemoAvailable": true,
  "customizable": true,
  "status": "draft",
  "featured": false,
  "tier": 1,
  "ownerType": "company",
  "price": {
    "displayText": "Starting from ₹1,00,000",
    "min": 100000,
    "max": 300000,
    "currency": "INR"
  }
}
```

**Status patch:**
```json
{ "status": "published", "featured": true }
```
`status`: `draft` | `published` | `featured` | `archived`

### Categories
| Method | Endpoint |
|--------|----------|
| GET | `/admin/categories` |
| POST | `/admin/categories` |
| PUT | `/admin/categories/:id` |
| DELETE | `/admin/categories/:id` |

```json
{ "name": "ERP", "description": "Enterprise systems", "isActive": true }
```

### Requirement leads
| Method | Endpoint |
|--------|----------|
| GET | `/admin/requirements` |
| GET | `/admin/requirements/:id` |
| PATCH | `/admin/requirements/:id/status` |

```json
{
  "status": "contacted",
  "adminNotes": "Called client"
}
```

Statuses: `new` | `contacted` | `requirement_discussed` | `demo_given` | `quotation_sent` | `negotiation` | `won` | `lost`

### Customization leads
| Method | Endpoint |
|--------|----------|
| GET | `/admin/customization-requests` |
| GET | `/admin/customization-requests/:id` |
| PATCH | `/admin/customization-requests/:id/status` |

Statuses: `new` | `contacted` | `quotation_sent` | `negotiation` | `won` | `lost`

---

## Frontend Integration (Aadrika)

```env
VITE_API_URL=http://localhost:5001/api
```

```js
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

### Detail page HTML description
```jsx
<div
  className="prose"
  dangerouslySetInnerHTML={{ __html: project.description }}
/>
```

### Suggested frontend routes
| Page | Route | API |
|------|-------|-----|
| Home | `/` | `GET /projects/featured` |
| Gallery | `/projects` | `GET /projects?...` |
| Detail | `/projects/:slug` | `GET /projects/:slug` |
| Requirement | `/submit-requirement` | `POST /requirements` |
| Customize | `/customize/:slug` | `GET /projects/:slug` + `POST /customization-requests` |
| Admin login | `/admin/login` | `POST /auth/login` |

---

## Admin Credentials (Dev)

| Field | Value |
|-------|-------|
| Email | `admin@smglobal.com` |
| Password | `SmGlobal@2026` |

See also: `CREDENTIALS.md`, `docs/PROJECT_LINKS.md`, `docs/postman/SM-Global-Hub.postman_collection.json`

---

## Quick Test Commands

```bash
curl http://localhost:5001/api/health
curl http://localhost:5001/api/projects/featured
curl http://localhost:5001/api/projects/sm-hr-pro
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smglobal.com","password":"SmGlobal@2026"}'
```

Automated suite:
```bash
cd backend && npm run test:api
```
