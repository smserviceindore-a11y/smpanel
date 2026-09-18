/**
 * Updates every project with a rich HTML full description
 * (h1, h2, p, ul/li) so the frontend can render details cleanly.
 *
 * Usage: node src/seeds/updateFullDescriptions.js
 */
require('dotenv').config();
const connectDB = require('../config/db');
const Project = require('../models/Project');

const wrap = (title, intro, sections) => {
  const parts = [
    `<h1>${title}</h1>`,
    `<p>${intro}</p>`,
  ];

  for (const section of sections) {
    parts.push(`<h2>${section.heading}</h2>`);
    if (section.paragraphs) {
      for (const p of section.paragraphs) parts.push(`<p>${p}</p>`);
    }
    if (section.list?.length) {
      parts.push('<ul>');
      for (const item of section.list) parts.push(`<li>${item}</li>`);
      parts.push('</ul>');
    }
  }

  return parts.join('\n');
};

const descriptions = {
  'coravo-ai-crm-and-erp-saas': wrap(
    'Coravo — AI-Powered CRM & ERP SaaS Platform',
    'Coravo is a multi-tenant business operating system that connects CRM, sales, invoicing, inventory, accounting and HR in one platform. Run it as your own hosted SaaS and sell subscriptions, or deploy it standalone for a single company.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Built on Laravel, Inertia.js and Vue 3, Coravo includes an AI copilot across core workflows so teams can move from first lead to closed books without switching tools.',
          'It supports two deployment modes — multi-tenant SaaS with a landlord panel, and a standalone workspace without tenancy or billing layers.',
        ],
      },
      {
        heading: 'Key Modules',
        list: [
          'CRM & sales pipeline management',
          'Invoicing, billing and accounting',
          'Inventory and warehouse tracking',
          'HR and employee workflows',
          'Multi-tenant SaaS with plans and billing',
          'AI copilot for day-to-day operations',
          'Role-based permissions per tenant',
          'Webhooks, API tokens and audit logs',
        ],
      },
      {
        heading: 'Who Is It For',
        paragraphs: [
          'Ideal for agencies and software companies that want to offer a branded business OS to clients, or for mid-size companies that need CRM and ERP together.',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'SM Global can customize modules, branding, workflows, AI prompts, reports and integrations based on your industry and team size.',
        ],
      },
    ]
  ),

  'workdo-dash-saas-erp-platform': wrap(
    'WorkDo Dash — Open Source SaaS ERP Platform',
    'WorkDo Dash SaaS is a comprehensive open-source ERP and business management platform with multi-workspace support, white-label branding and 300+ premium add-ons.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Dash is designed for startups, agencies and enterprises that want one smart dashboard to manage CRM, HRM, projects, finance, POS and more — with a flexible SaaS subscription model.',
          'Create multiple company workspaces, assign roles, and let each company subscribe only to the add-ons they need.',
        ],
      },
      {
        heading: 'Core Capabilities',
        list: [
          'Multi-workspace / multi-company management',
          '300+ add-ons across CRM, HRM, Accounting, POS and more',
          'White-label branding and multi-theme UI',
          'Custom monthly and yearly pricing plans',
          'Role-based access control',
          'Integrations with 45+ tools and payment gateways',
          'Project, ticket and fleet management modules',
          'Cloud storage options (local, AWS, Wasabi)',
        ],
      },
      {
        heading: 'Business Benefits',
        paragraphs: [
          'Scale from one company to many tenants without rebuilding your core product. Super admins control plans while company admins manage day-to-day operations.',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'We can help select the right add-on pack, rebrand the platform, integrate payments and customize modules for Indian GST, payroll and industry workflows.',
        ],
      },
    ]
  ),

  'mighty-school-pro-school-erp-saas': wrap(
    'Mighty School Pro — Multi-Branch School Management ERP',
    'Mighty School Pro is a SaaS-ready, multi-branch school management system for schools, colleges and universities. Manage academics, fees, attendance, exams and communication from one platform.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Built for single campuses as well as multi-school SaaS operators, Mighty School Pro covers student lifecycle, teacher management, fee collection, examinations, library and notifications.',
          'Optional add-ons include mobile apps, biometric attendance and a public school website.',
        ],
      },
      {
        heading: 'Main Features',
        list: [
          'Student and teacher management',
          'Multi-branch / multi-school SaaS panel',
          'Fee collection and invoices',
          'Attendance with QR / biometric options',
          'Examination and result management',
          'Library and certificate modules',
          'SMS and email notifications',
          'Multiple payment gateways',
        ],
      },
      {
        heading: 'Ideal For',
        paragraphs: [
          'School chains, coaching institutes, colleges and education SaaS startups that need one ERP for many campuses.',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'We can customize fee structures, academic year workflows, report cards, parent apps and branding for your institution.',
        ],
      },
    ]
  ),

  'mentor-lms-learning-management-system': wrap(
    'Mentor LMS — Self-Hosted Learning Management System',
    'Mentor LMS is a powerful self-hosted LMS to sell courses solo or run a full multi-instructor marketplace. Buy once, install on your server, and keep full control of your platform.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Built on Laravel and React, Mentor LMS includes a drag-and-drop course builder, live Zoom classes, exams, certificates, payments, blog and forums — without monthly SaaS fees or revenue cuts.',
        ],
      },
      {
        heading: 'Platform Features',
        list: [
          'Drag-and-drop course and page builder',
          'Solo instructor mode or multi-instructor marketplace',
          'Live classes via Zoom',
          'Exams, quizzes and auto-grading',
          'Certificates and marksheets',
          'Payment gateways (Stripe, PayPal, Razorpay and more)',
          'Admin, instructor and student dashboards',
          'Multi-language support with RTL',
          'Blog, forums and course reviews',
        ],
      },
      {
        heading: 'Who Should Use It',
        paragraphs: [
          'Perfect for trainers, academies, edtech startups and corporate L&D teams that want ownership of their learning platform.',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'SM Global can customize themes, course workflows, commission rules, certificates and payment setup for your brand.',
        ],
      },
    ]
  ),

  'global-school-express-multi-school-erp': wrap(
    'Global School Express — Multi School Management System',
    'Global Multi School Management System Express provides centralized control for multiple schools with subscription billing, academics, fees and parent-student portals.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Operate one or many schools from a single admin panel. Each school can have its own branding, academic sessions, staff and fee setup while the super admin manages subscriptions.',
        ],
      },
      {
        heading: 'Key Features',
        list: [
          'Multi-school SaaS / branding mode',
          'Student, teacher and guardian portals',
          'Live class and assignment modules',
          'Fee invoices and due tracking',
          'Exam schedules and merit lists',
          'SMS / email notifications',
          'Subscription plans for schools',
          'Library and employee modules',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'We can tailor school onboarding, fee rules, report cards and parent communication for Indian education boards and institutes.',
        ],
      },
    ]
  ),

  'mentorship-pro-mentor-mentee-platform': wrap(
    'Mentorship Pro — Mentor & Mentee Management Platform',
    'Mentorship Pro helps organizations run structured mentorship programs with mentor matching, session booking, messaging and admin oversight.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Create a dedicated space where mentors and mentees connect, schedule sessions, track progress and communicate securely.',
        ],
      },
      {
        heading: 'Features',
        list: [
          'Mentor and mentee profiles',
          'Matching and session booking',
          'Internal messaging system',
          'Admin dashboard and reports',
          'Notifications for key actions',
          'Role-based access',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'Useful for colleges, incubators and corporate mentoring programs. We can customize matching rules, session types and reporting.',
        ],
      },
    ]
  ),

  'mentorship-saas-online-mentoring-platform': wrap(
    'Mentorship SaaS — Online Mentoring Marketplace',
    'An online mentoring marketplace that connects mentees with expert mentors across marketing, product, engineering, content and more — with payouts, commissions and virtual meetings.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Launch a revenue-ready mentoring SaaS with mentor holidays, coupons, wallets, Zoom/Google Meet sessions and multi-language support.',
        ],
      },
      {
        heading: 'Highlight Features',
        list: [
          'Unlimited sessions with customizable time slots',
          'Payouts and commission system',
          '6+ payment gateways plus offline banks',
          'Zoom and Google Meet integration',
          'Google Calendar sync',
          'Twilio and WhatsApp booking notifications',
          'Admin, mentor and mentee dashboards',
          'Multi-lingual system with RTL support',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'We can brand the marketplace, configure commission splits, integrate local payments (UPI/Razorpay) and customize mentor categories.',
        ],
      },
    ]
  ),

  'jobpilot-job-portal-platform': wrap(
    'JobPilot — Complete Job Portal & Marketplace',
    'JobPilot is a full-featured Laravel job portal for building niche job boards, career marketplaces and organizational hiring platforms.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Candidates create profiles and apply for jobs while companies post vacancies, manage applicants and promote premium listings. Admins control users, plans, languages and currencies from a powerful backend.',
        ],
      },
      {
        heading: 'Features',
        list: [
          'Candidate and company dashboards',
          'Job posting and advanced search',
          'Application tracking',
          'Premium / paid job plans',
          'Multi-language and multi-currency',
          'Admin panel with full control',
          'Responsive modern UI',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'Perfect for recruitment agencies and niche boards. We can customize industries, pricing plans, email flows and branding.',
        ],
      },
    ]
  ),

  'joblab-job-portal-platform': wrap(
    'JobLab — Job Portal Platform',
    'JobLab is a complete job board script for launching a recruitment website with employer subscriptions, job listings and applicant management.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Provide employers with subscription-based posting and give job seekers a clean experience to discover and apply for roles.',
        ],
      },
      {
        heading: 'Features',
        list: [
          'Public job listings and filters',
          'Employer subscription packages',
          'Applicant management for companies',
          'Admin dashboard',
          'SEO-friendly pages',
          'Payment gateway integration',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'We can adapt packages, job categories, email templates and UI branding for your recruitment brand.',
        ],
      },
    ]
  ),

  'jobs-portal-job-board-script': wrap(
    'Jobs Portal — Interactive Job Board Script',
    'Jobs Portal connects job seekers and employers with resume management, vacancy posting, search and admin controls — including kanban-style candidate workflows.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'A dynamic Laravel job board where seekers upload resumes and apply for jobs, while companies publish vacancies and review candidates. Includes admin tools for full content and user control.',
        ],
      },
      {
        heading: 'Features',
        list: [
          'Job seeker resume management',
          'Employer vacancy posting',
          'Advanced job search',
          'Kanban board for candidates',
          'Jitsi Meet integration',
          'Admin module',
          'Mobile app API support',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'Useful for multi-city job boards and staffing firms. We can customize pipelines, chat/meeting options and reporting.',
        ],
      },
    ]
  ),

  'onejobportal-jobs-and-resume-builder': wrap(
    'OneJobPortal — Jobs Board & Resume Builder',
    'OneJobPortal combines a job board with an integrated resume/CV builder so candidates can create profiles, export PDFs and apply — while employers post jobs and manage applicants.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'A single platform for career portals that want both job discovery and resume creation. Supports SaaS packages for employers and monetization via ads or paid listings.',
        ],
      },
      {
        heading: 'Features',
        list: [
          'Built-in resume / CV builder',
          'PDF resume export',
          'Job search and applications',
          'Employer packages and job posting',
          'Candidate and employer dashboards',
          'Social login',
          'Admin management panel',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'We can customize resume templates, employer plans, branding and application workflows for your market.',
        ],
      },
    ]
  ),

  'goresumecv-saas-resume-builder': wrap(
    'GoResumeCV — SaaS Online Resume Builder',
    'GoResumeCV is a self-hosted SaaS resume builder that helps users create professional resumes with templates, PDF export and subscription plans managed by admin.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Launch your own resume-builder product similar to popular online CV tools. Users register, pick templates, edit content and download polished PDFs.',
        ],
      },
      {
        heading: 'Features',
        list: [
          'Multiple resume templates',
          'Online editor and PDF export',
          'User and admin dashboards',
          'SaaS subscription plans',
          'Multi-language support',
          'Self-hosted Laravel stack',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'We can add Indian resume formats, ATS-friendly templates, Razorpay billing and brand-specific themes.',
        ],
      },
    ]
  ),

  'resume-builder-cv-and-services-platform': wrap(
    'Resume Builder — Build CVs & Sell Resume Services',
    'A platform where users create professional CVs online and freelancers or agencies can sell resume-writing services with client management.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Combine a DIY resume builder with a services marketplace so you can monetize both self-serve templates and expert writing packages.',
        ],
      },
      {
        heading: 'Features',
        list: [
          'Online CV builder',
          'Multiple templates',
          'Service selling for writers/agencies',
          'Client management',
          'PDF download',
          'Admin dashboard',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'Ideal for career consultancies. We can customize service packages, order workflows and payment checkout.',
        ],
      },
    ]
  ),

  // Original SM Global / dummy projects
  'sm-hr-pro': wrap(
    'SM HR Pro — HR & Payroll Management System',
    'SM HR Pro is a complete HR and payroll management solution designed for SMEs and enterprises. Manage employees, attendance, payroll, leave and reports from a single dashboard.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Digitize your HR operations with employee records, attendance tracking, payroll processing, leave policies and management reports.',
        ],
      },
      {
        heading: 'Features',
        list: [
          'Employee management',
          'Attendance tracking',
          'Payroll processing',
          'Leave management',
          'Reports and analytics',
          'Admin dashboard',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'We can customize salary structures, leave policies, statutory compliance (PF/ESI/TDS) and approval workflows for your organization.',
        ],
      },
    ]
  ),

  'vr-industry-erp': wrap(
    'VR Industry ERP — Manufacturing & Production ERP',
    'VR Industry ERP is a full-featured manufacturing ERP covering inventory, production planning, purchase, sales and employee management for industrial units.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Run your manufacturing plant with connected modules for inventory, production, purchase, sales, attendance and management dashboards.',
        ],
      },
      {
        heading: 'Features',
        list: [
          'Inventory management',
          'Production management',
          'Employee management',
          'Attendance',
          'Purchase and sales',
          'Reports and dashboard',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'We can adapt BOMs, shop-floor workflows, batch tracking and GST-ready invoices for your manufacturing process.',
        ],
      },
    ]
  ),

  'job-portal': wrap(
    'Job Portal — Recruitment & Placement Platform',
    'A complete job portal solution with employer dashboard, candidate profiles, job posting, application tracking and placement management.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Launch a recruitment website where companies hire talent and candidates discover opportunities with structured application tracking.',
        ],
      },
      {
        heading: 'Features',
        list: [
          'Job posting',
          'Candidate profiles',
          'Application tracking',
          'Employer dashboard',
          'Search and filters',
          'Email notifications',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'Customize industries, screening stages, email alerts and branding for agencies or campus placement cells.',
        ],
      },
    ]
  ),

  'ai-resume-builder': wrap(
    'AI Resume Builder — Resume & Career Platform',
    'An intelligent resume builder that uses AI to help candidates create professional resumes, optimize for ATS and get career recommendations.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Help job seekers generate polished resumes faster with AI suggestions, ATS-friendly formatting and multiple modern templates.',
        ],
      },
      {
        heading: 'Features',
        list: [
          'AI resume generation',
          'ATS optimization',
          'Multiple templates',
          'Career recommendations',
          'PDF export',
          'Cover letter builder',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'We can tune AI prompts for Indian job markets, add industry templates and integrate with your career portal.',
        ],
      },
    ]
  ),

  'sm-crm-suite': wrap(
    'SM CRM Suite — Sales CRM for Growing Teams',
    'SM CRM Suite helps businesses manage leads, contacts, deals, follow-ups, pipelines and sales reports with a clean modern interface.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Give your sales team one place to track every lead from first contact to closed deal, with reminders and pipeline visibility.',
        ],
      },
      {
        heading: 'Features',
        list: [
          'Lead management',
          'Contact database',
          'Sales pipeline',
          'Follow-ups',
          'Reports',
          'Team dashboard',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'Customize pipeline stages, scoring rules, WhatsApp/email reminders and role permissions for your sales process.',
        ],
      },
    ]
  ),

  'sm-commerce-hub': wrap(
    'SM Commerce Hub — Enterprise E-Commerce Platform',
    'SM Commerce Hub is a ready-to-deploy online store solution with product management, orders, payments, coupons and analytics.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Build a branded online store with catalog management, checkout, payment gateway integration and order tracking.',
        ],
      },
      {
        heading: 'Features',
        list: [
          'Product management',
          'Order tracking',
          'Payment gateway',
          'Coupons',
          'Analytics',
          'Mobile-ready storefront',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'We can customize themes, shipping rules, Razorpay/UPI payments and seller workflows for your retail brand.',
        ],
      },
    ]
  ),

  'sm-edu-portal': wrap(
    'SM Edu Portal — Learning & Institute Management',
    'SM Edu Portal supports online classes, course management, student enrollment, assessments and institute administration.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Run courses, enrollments and assessments for coaching institutes, colleges and training centers on one portal.',
        ],
      },
      {
        heading: 'Features',
        list: [
          'Course management',
          'Online classes',
          'Student enrollment',
          'Assessments',
          'Certificates',
          'Admin panel',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'Customize batch schedules, fee collection, live-class tools and student dashboards for your institute.',
        ],
      },
    ]
  ),

  'sm-invoice-pro': wrap(
    'SM Invoice Pro — Billing & Accounting SaaS',
    'SM Invoice Pro simplifies invoicing, expense tracking, GST billing, client management and financial reporting for SMEs.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Create professional invoices, track expenses and generate financial reports with a simple SaaS-style interface.',
        ],
      },
      {
        heading: 'Features',
        list: [
          'Invoice generation',
          'Expense tracking',
          'GST billing',
          'Client management',
          'Reports',
          'PDF export',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'We can add GST slabs, e-invoice formats, recurring billing and multi-company accounting as needed.',
        ],
      },
    ]
  ),

  'edumanage-pro': wrap(
    'EduManage Pro — School & College Management System',
    'EduManage Pro helps educational institutions manage students, teachers, fees, attendance, exams and reports from one unified platform.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'A complete academic administration system for schools and colleges with portals for staff and students.',
        ],
      },
      {
        heading: 'Features',
        list: [
          'Student management',
          'Teacher management',
          'Fees collection',
          'Attendance',
          'Examination',
          'Reports',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'Customize academic years, fee structures, report cards and parent notifications for your campus.',
        ],
      },
    ]
  ),

  'shopwave-commerce': wrap(
    'ShopWave Commerce — Multi-Vendor E-Commerce Platform',
    'ShopWave Commerce is a scalable e-commerce solution with vendor management, product catalog, cart, checkout, payments and order tracking.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Launch a marketplace where multiple vendors sell products while you manage commissions, orders and payments centrally.',
        ],
      },
      {
        heading: 'Features',
        list: [
          'Multi-vendor support',
          'Product catalog',
          'Cart and checkout',
          'Order management',
          'Payment gateway',
          'Admin dashboard',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'We can customize vendor onboarding, commission rules, logistics integrations and storefront design.',
        ],
      },
    ]
  ),

  'medicare-hms': wrap(
    'MediCare HMS — Hospital & Clinic Management System',
    'MediCare HMS streamlines patient records, appointments, billing, pharmacy inventory and doctor scheduling for healthcare providers.',
    [
      {
        heading: 'Overview',
        paragraphs: [
          'Digitize clinic or hospital operations with patient EMR, appointments, billing and pharmacy in one system.',
        ],
      },
      {
        heading: 'Features',
        list: [
          'Patient records',
          'Appointment scheduling',
          'Billing and invoices',
          'Pharmacy inventory',
          'Doctor dashboard',
          'Reports',
        ],
      },
      {
        heading: 'Customization Scope',
        paragraphs: [
          'Customize OPD/IPD flows, lab modules, pharmacy stock and appointment rules for your healthcare setup.',
        ],
      },
    ]
  ),
};

const run = async () => {
  try {
    await connectDB();
    console.log('\n--- Updating full HTML descriptions ---\n');

    let updated = 0;
    let missing = 0;

    for (const [slug, html] of Object.entries(descriptions)) {
      const result = await Project.findOneAndUpdate(
        { slug },
        { $set: { description: html } },
        { new: true }
      );

      if (result) {
        updated++;
        console.log(`Updated: ${slug} (${html.length} chars)`);
      } else {
        missing++;
        console.log(`Not found: ${slug}`);
      }
    }

    console.log(`\nDone. Updated: ${updated}, Missing: ${missing}\n`);
    process.exit(0);
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
};

run();
