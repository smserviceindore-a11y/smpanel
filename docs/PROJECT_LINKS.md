# Project API Links — SM Global Solution Hub

> College demo project — individual project detail links  
> Base URL: `http://localhost:5001/api`

---

## Kaise Kaam Karta Hai

| Page | API Endpoint | Example |
|------|--------------|---------|
| **All Projects (list)** | `GET /api/projects?limit=50` | [Open List](http://localhost:5001/api/projects?limit=50) |
| **Featured Projects** | `GET /api/projects/featured` | [Open Featured](http://localhost:5001/api/projects/featured) |
| **Single Project Detail** | `GET /api/projects/{slug}` | [Coravo Example](http://localhost:5001/api/projects/coravo-ai-crm-and-erp-saas) |
| **Filter by Company** | `GET /api/projects?ownerType=company` | [Company Projects](http://localhost:5001/api/projects?ownerType=company) |
| **Filter by Developer** | `GET /api/projects?ownerType=developer` | [Developer Projects](http://localhost:5001/api/projects?ownerType=developer) |
| **Search** | `GET /api/projects?search=payroll` | [Search Example](http://localhost:5001/api/projects?search=payroll) |
| **Filter by Category** | `GET /api/projects?category=erp` | [ERP Projects](http://localhost:5001/api/projects?category=erp) |

**Note:** Detail page ke liye **slug** use hota hai, ID nahi.  
Frontend page (Aadrika banayegi): `http://localhost:5173/projects/{slug}`

---

## SM Global — Company Projects

| Project | Detail API Link |
|---------|-----------------|
| Coravo — AI CRM & ERP SaaS | http://localhost:5001/api/projects/coravo-ai-crm-and-erp-saas |
| WorkDo Dash — SaaS ERP Platform | http://localhost:5001/api/projects/workdo-dash-saas-erp-platform |
| Mighty School Pro — School ERP SaaS | http://localhost:5001/api/projects/mighty-school-pro-school-erp-saas |
| Mentor LMS — Learning Management System | http://localhost:5001/api/projects/mentor-lms-learning-management-system |
| SM HR Pro | http://localhost:5001/api/projects/sm-hr-pro |
| VR Industry ERP | http://localhost:5001/api/projects/vr-industry-erp |
| Job Portal | http://localhost:5001/api/projects/job-portal |
| AI Resume Builder | http://localhost:5001/api/projects/ai-resume-builder |
| SM CRM Suite | http://localhost:5001/api/projects/sm-crm-suite |
| SM Commerce Hub | http://localhost:5001/api/projects/sm-commerce-hub |
| SM Edu Portal | http://localhost:5001/api/projects/sm-edu-portal |
| SM Invoice Pro | http://localhost:5001/api/projects/sm-invoice-pro |

---

## Developer Marketplace Projects

| Project | Developer | Detail API Link |
|---------|-----------|-----------------|
| JobPilot — Job Portal Platform | Priya | http://localhost:5001/api/projects/jobpilot-job-portal-platform |
| JobLab — Job Portal Platform | Priya | http://localhost:5001/api/projects/joblab-job-portal-platform |
| Jobs Portal — Job Board Script | Priya | http://localhost:5001/api/projects/jobs-portal-job-board-script |
| GoResumeCV — SaaS Resume Builder | Amit | http://localhost:5001/api/projects/goresumecv-saas-resume-builder |
| OneJobPortal — Jobs & Resume Builder | Amit | http://localhost:5001/api/projects/onejobportal-jobs-and-resume-builder |
| Resume Builder — CV & Services Platform | Amit | http://localhost:5001/api/projects/resume-builder-cv-and-services-platform |
| Mentorship Pro — Mentor-Mentee Platform | Amit | http://localhost:5001/api/projects/mentorship-pro-mentor-mentee-platform |
| Mentorship SaaS — Online Mentoring Platform | Amit | http://localhost:5001/api/projects/mentorship-saas-online-mentoring-platform |
| Global School Express — Multi School ERP | Rahul | http://localhost:5001/api/projects/global-school-express-multi-school-erp |
| EduManage Pro | Rahul | http://localhost:5001/api/projects/edumanage-pro |
| ShopWave Commerce | Priya | http://localhost:5001/api/projects/shopwave-commerce |
| MediCare HMS | Amit | http://localhost:5001/api/projects/medicare-hms |

---

## Detail API Response — Kya Milega

Ek project open karoge to yeh fields milenge:

```json
{
  "success": true,
  "data": {
    "title": "Coravo — AI CRM & ERP SaaS",
    "slug": "coravo-ai-crm-and-erp-saas",
    "shortDescription": "...",
    "description": "...",
    "industry": "Business",
    "projectType": "CRM / ERP",
    "technologies": ["Laravel", "Vue 3", ...],
    "features": ["CRM & Sales Pipeline", ...],
    "screenshots": [{ "url": "...", "caption": "..." }],
    "demoUrl": "https://...",
    "liveDemoAvailable": true,
    "price": { "displayText": "Starting from ₹2,50,000" },
    "customizable": true,
    "ownerType": "company",
    "featured": true,
    "category": { "name": "CRM", "slug": "crm" }
  }
}
```

> **Security:** `demoCredentials` public API mein nahi aate — sirf admin panel se dikhenge.

---

## Frontend Route (Aadrika ke liye)

Jab frontend ready hogi, detail page yeh hogi:

```
http://localhost:5173/projects/coravo-ai-crm-and-erp-saas
http://localhost:5173/projects/sm-hr-pro
http://localhost:5173/projects/jobpilot-job-portal-platform
```

Frontend internally call karegi: `GET /api/projects/{slug}`

---

*Auto-generated from database. Naye projects add hone par slug list update karo.*
