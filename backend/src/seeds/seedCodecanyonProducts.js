require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Project = require('../models/Project');
const Category = require('../models/Category');
const User = require('../models/User');

const preview = (slug, id) =>
  `https://codecanyon.net/item/${slug}/full_screen_preview/${id}`;

const itemUrl = (slug, id) => `https://codecanyon.net/item/${slug}/${id}`;

const screenshot = (seed, caption) => ({
  url: `https://picsum.photos/seed/${seed}/1200/800`,
  caption,
  order: 0,
});

const codecanyonProducts = [
  // ─── SM Global Company Products ───
  {
    title: 'Coravo — AI CRM & ERP SaaS',
    codecanyonId: '64710287',
    shortDescription: 'AI-powered multi-tenant CRM, ERP, invoicing, inventory, accounting and HR platform.',
    description:
      'Coravo is a multi-tenant business operating system covering CRM, sales, invoicing, inventory, accounting and HR. Run as SaaS with landlord panel or standalone for a single company. Built on Laravel, Inertia.js and Vue 3 with AI copilot workflows.',
    categoryName: 'CRM',
    industry: 'Business',
    projectType: 'CRM / ERP',
    technologies: ['Laravel', 'Vue 3', 'Inertia.js', 'MySQL'],
    features: [
      'CRM & Sales Pipeline',
      'Invoicing & Accounting',
      'Inventory Management',
      'HR Module',
      'Multi-tenant SaaS',
      'AI Copilot',
      'Role-based Permissions',
    ],
    demoUrl: preview('coravo-aipowered-crm-erp-saas-platform', '64710287'),
    sourceUrl: itemUrl('coravo-aipowered-crm-erp-saas-platform', '64710287'),
    liveDemoAvailable: true,
    ownerType: 'company',
    status: 'featured',
    featured: true,
    tier: 1,
    price: { displayText: 'Starting from ₹2,50,000', min: 250000, max: 800000, currency: 'INR' },
  },
  {
    title: 'WorkDo Dash — SaaS ERP Platform',
    codecanyonId: '45919116',
    shortDescription: 'Open-source ERP with 300+ add-ons, multi-workspace and subscription SaaS features.',
    description:
      'WorkDo Dash is a comprehensive open-source ERP and business management platform with multi-workspace support, white-label branding, role-based access, payment gateways, and 300+ premium add-ons for scaling modern enterprises.',
    categoryName: 'ERP',
    industry: 'Business',
    projectType: 'ERP',
    technologies: ['Laravel', 'PHP', 'MySQL', 'JavaScript'],
    features: [
      'Multi-workspace ERP',
      '300+ Add-ons',
      'Subscription SaaS',
      'White-label Branding',
      'Payment Gateways',
      'Role-based Access',
      'Analytics Dashboard',
    ],
    demoUrl: 'https://dash-demo.workdo.io/login/',
    sourceUrl: itemUrl('workdo-dash-saas-open-source-erp-with-multiworkspace', '45919116'),
    demoCredentials: {
      username: 'superadmin@example.com',
      password: '1234',
      notes: 'Also try company@example.com / 1234',
    },
    liveDemoAvailable: true,
    ownerType: 'company',
    status: 'featured',
    featured: true,
    tier: 1,
    price: { displayText: 'Starting from ₹3,00,000', min: 300000, max: 1000000, currency: 'INR' },
  },
  {
    title: 'Mighty School Pro — School ERP SaaS',
    codecanyonId: '57385565',
    shortDescription: 'Multi-branch school management ERP with fees, attendance, exams and mobile app support.',
    description:
      'Mighty School Pro is a cutting-edge SaaS-based multi-branch school management system for schools, colleges and universities. Includes student management, fees, attendance, exams, library, biometric attendance and multi-school SaaS panel.',
    categoryName: 'Education',
    industry: 'Education',
    projectType: 'School ERP',
    technologies: ['Laravel', 'Flutter', 'MySQL'],
    features: [
      'Multi-branch SaaS',
      'Student Management',
      'Fee Collection',
      'Attendance & Exams',
      'Library Management',
      'Mobile App Ready',
      'QR Attendance',
    ],
    demoUrl: preview('mighty-school-pro-school-management-system-erp-multibranch-saas-all-in-one', '57385565'),
    sourceUrl: itemUrl('mighty-school-pro-school-management-system-erp-multibranch-saas-all-in-one', '57385565'),
    demoCredentials: {
      username: 'saasadmin@gmail.com',
      password: '12345678',
      notes: 'SaaS admin demo — check product page for latest demo link',
    },
    liveDemoAvailable: true,
    ownerType: 'company',
    status: 'featured',
    featured: true,
    tier: 1,
    price: { displayText: 'Starting from ₹2,00,000', min: 200000, max: 600000, currency: 'INR' },
  },
  {
    title: 'Mentor LMS — Learning Management System',
    codecanyonId: '59092700',
    shortDescription: 'Self-hosted LMS to sell courses solo or run a multi-instructor marketplace.',
    description:
      'Mentor LMS is a powerful self-hosted learning management platform. Sell courses independently or operate a multi-instructor marketplace with payments, blogs, course player, and modern admin dashboards.',
    categoryName: 'Education',
    industry: 'Education',
    projectType: 'LMS',
    technologies: ['Laravel', 'React', 'MySQL'],
    features: [
      'Course Marketplace',
      'Multi-instructor',
      'Video Course Player',
      'Payment Gateways',
      'Blog Module',
      'Student Dashboard',
      'Admin & Instructor Panels',
    ],
    demoUrl: 'https://demo.mentor-lms.com',
    sourceUrl: itemUrl('mentor-lms-learning-management-system', '59092700'),
    demoCredentials: {
      username: 'admin@example.com',
      password: '12345678',
      notes: 'Instructor: john.smith@example.com | Student: sophie.miller@example.com',
    },
    liveDemoAvailable: true,
    ownerType: 'company',
    status: 'published',
    featured: true,
    tier: 2,
    price: { displayText: 'Starting from ₹1,75,000', min: 175000, max: 500000, currency: 'INR' },
  },

  // ─── Developer Products ───
  {
    title: 'Global School Express — Multi School ERP',
    codecanyonId: '21975378',
    developerEmail: 'rahul.dev@smglobalhub.com',
    shortDescription: 'Multi-school management system with SaaS subscription, live classes and branding.',
    description:
      'Global Multi School Management System Express provides centralized control for multiple schools with subscription billing, live classes, assignments, exams, fees, and parent-student portals.',
    categoryName: 'Education',
    industry: 'Education',
    projectType: 'School ERP',
    technologies: ['CodeIgniter', 'PHP', 'MySQL'],
    features: [
      'Multi-school SaaS',
      'Live Classes',
      'Fee Management',
      'Exam & Results',
      'Parent Portal',
      'Subscription Billing',
      'Branding Options',
    ],
    demoUrl: preview('global-multi-school-management-system-express', '21975378'),
    sourceUrl: itemUrl('global-multi-school-management-system-express', '21975378'),
    liveDemoAvailable: true,
    ownerType: 'developer',
    status: 'published',
    featured: false,
    tier: 3,
    price: { displayText: 'Starting from ₹1,50,000', min: 150000, max: 400000, currency: 'INR' },
  },
  {
    title: 'Mentorship Pro — Mentor-Mentee Platform',
    codecanyonId: '51348547',
    developerEmail: 'amit.dev@smglobalhub.com',
    shortDescription: 'Platform to connect mentors and mentees with sessions, payouts and messaging.',
    description:
      'Mentorship Management helps organizations and professionals run structured mentorship programs with session booking, mentor-mentee matching, internal messaging and admin oversight.',
    categoryName: 'SaaS',
    industry: 'Professional Services',
    projectType: 'SaaS',
    technologies: ['Laravel', 'PHP', 'MySQL'],
    features: [
      'Mentor Matching',
      'Session Booking',
      'Internal Messaging',
      'Admin Dashboard',
      'User Profiles',
      'Notifications',
    ],
    demoUrl: preview('mentorship-management', '51348547'),
    sourceUrl: itemUrl('mentorship-management', '51348547'),
    liveDemoAvailable: true,
    ownerType: 'developer',
    status: 'published',
    featured: false,
    tier: 3,
    price: { displayText: 'Starting from ₹1,20,000', min: 120000, max: 350000, currency: 'INR' },
  },
  {
    title: 'Mentorship SaaS — Online Mentoring Platform',
    codecanyonId: '50928340',
    developerEmail: 'amit.dev@smglobalhub.com',
    shortDescription: 'Ultimate mentors & mentees connecting platform with Zoom, payments and commissions.',
    description:
      'SaaS Online Mentoring Platform connects mentees with expert mentors across design, marketing, engineering and more. Includes payouts, commission system, Zoom/Google Meet integration and multi-language support.',
    categoryName: 'SaaS',
    industry: 'Education',
    projectType: 'SaaS',
    technologies: ['CodeIgniter', 'PHP', 'MySQL'],
    features: [
      'Mentor-Mentee Matching',
      'Session Time Slots',
      'Zoom & Google Meet',
      'Payouts & Commission',
      '6 Payment Gateways',
      'WhatsApp Notifications',
      'Multi-language RTL',
    ],
    demoUrl: preview('saas-online-mentoring-platform', '50928340'),
    sourceUrl: itemUrl('saas-online-mentoring-platform', '50928340'),
    liveDemoAvailable: true,
    ownerType: 'developer',
    status: 'published',
    featured: false,
    tier: 3,
    price: { displayText: 'Starting from ₹1,40,000', min: 140000, max: 400000, currency: 'INR' },
  },
  {
    title: 'JobPilot — Job Portal Platform',
    codecanyonId: '37897822',
    developerEmail: 'priya.dev@smglobalhub.com',
    shortDescription: 'Complete Laravel job marketplace with employer, candidate and admin dashboards.',
    description:
      'JobPilot is a full-featured job portal and marketplace built with Laravel. Supports job posting, candidate profiles, application tracking, multi-language, currency and premium job plans.',
    categoryName: 'Job Portal',
    industry: 'Recruitment',
    projectType: 'Job Portal',
    technologies: ['Laravel', 'PHP', 'MySQL'],
    features: [
      'Job Marketplace',
      'Employer Dashboard',
      'Candidate Dashboard',
      'Application Tracking',
      'Multi-language',
      'Premium Job Plans',
      'Admin Panel',
    ],
    demoUrl: 'https://jobpilot.templatecookie.com/',
    sourceUrl: itemUrl('jobpilot-job-portal-laravel-script', '37897822'),
    demoCredentials: {
      username: 'admin@mail.com',
      password: 'password',
      notes: 'Admin: jobpilot.templatecookie.com/admin/login',
    },
    liveDemoAvailable: true,
    ownerType: 'developer',
    status: 'published',
    featured: true,
    tier: 3,
    price: { displayText: 'Starting from ₹1,30,000', min: 130000, max: 400000, currency: 'INR' },
  },
  {
    title: 'JobLab — Job Portal Platform',
    codecanyonId: '33741485',
    developerEmail: 'priya.dev@smglobalhub.com',
    shortDescription: 'Laravel job board with employer subscriptions and applicant management.',
    description:
      'JobLab is a complete job portal platform for launching a recruitment website with employer subscriptions, job listings, candidate applications and a powerful admin backend.',
    categoryName: 'Job Portal',
    industry: 'Recruitment',
    projectType: 'Job Portal',
    technologies: ['Laravel', 'PHP', 'MySQL'],
    features: [
      'Job Listings',
      'Employer Subscriptions',
      'Applicant Management',
      'Admin Dashboard',
      'SEO Friendly',
      'Payment Integration',
    ],
    demoUrl: 'https://script.viserlab.com/joblab',
    sourceUrl: itemUrl('joblab-job-portal-platform', '33741485'),
    demoCredentials: {
      username: 'admin',
      password: 'admin',
      notes: 'Admin: script.viserlab.com/joblab/admin',
    },
    liveDemoAvailable: true,
    ownerType: 'developer',
    status: 'published',
    featured: false,
    tier: 3,
    price: { displayText: 'Starting from ₹1,00,000', min: 100000, max: 300000, currency: 'INR' },
  },
  {
    title: 'Jobs Portal — Job Board Script',
    codecanyonId: '22607607',
    developerEmail: 'priya.dev@smglobalhub.com',
    shortDescription: 'Interactive job board connecting seekers and employers with resume management.',
    description:
      'Jobs Portal enables job seekers to post resumes and search jobs while companies publish vacancies. Includes admin module, kanban candidate board, Jitsi Meet integration and mobile app support.',
    categoryName: 'Job Portal',
    industry: 'Recruitment',
    projectType: 'Job Portal',
    technologies: ['Laravel', 'PHP', 'MySQL'],
    features: [
      'Resume Management',
      'Job Search',
      'Employer Portal',
      'Kanban Board',
      'Jitsi Meet',
      'Mobile App API',
      'Admin Module',
    ],
    demoUrl: 'https://www.sharjeelanjum.com/demos/jobsportal-update/',
    sourceUrl: itemUrl('jobs-portal-job-board-laravel-script', '22607607'),
    demoCredentials: {
      username: 'buyer@buyer.com',
      password: 'buyer123456',
      notes: 'Admin: /admin path on demo URL',
    },
    liveDemoAvailable: true,
    ownerType: 'developer',
    status: 'published',
    featured: false,
    tier: 3,
    price: { displayText: 'Starting from ₹1,25,000', min: 125000, max: 350000, currency: 'INR' },
  },
  {
    title: 'OneJobPortal — Jobs & Resume Builder',
    codecanyonId: '32935642',
    developerEmail: 'amit.dev@smglobalhub.com',
    shortDescription: 'Job board with integrated resume/CV builder for candidates and employers.',
    description:
      'OneJobPortal combines a jobs portal with a built-in resume builder. Candidates create profiles and apply to jobs; employers post vacancies, search candidates and manage applicants. Supports SAAS packages for monetization.',
    categoryName: 'Job Portal',
    industry: 'Career',
    projectType: 'SaaS',
    technologies: ['Laravel', 'PHP', 'MySQL'],
    features: [
      'Resume Builder',
      'Job Board',
      'Employer Dashboard',
      'Candidate Profiles',
      'PDF Resume Export',
      'SAAS Packages',
      'Social Login',
    ],
    demoUrl: 'https://oneresumecv.zillapage.com',
    sourceUrl: itemUrl('oneresumecv-jobs-portal-and-resumecv-builder', '32935642'),
    demoCredentials: {
      username: 'admin@admin.com',
      password: 'admin@admin.com',
      notes: 'Candidate: candidate@candidate.com | Employer: employer@employer.com',
    },
    liveDemoAvailable: true,
    ownerType: 'developer',
    status: 'published',
    featured: false,
    tier: 3,
    price: { displayText: 'Starting from ₹1,10,000', min: 110000, max: 320000, currency: 'INR' },
  },
  {
    title: 'GoResumeCV — SaaS Resume Builder',
    codecanyonId: '34113236',
    developerEmail: 'amit.dev@smglobalhub.com',
    shortDescription: 'Online SaaS resume builder with templates, ATS optimization and PDF export.',
    description:
      'GoResumeCV is a self-hosted SaaS resume builder helping users create professional resumes with multiple templates, PDF export, and admin-managed subscription plans.',
    categoryName: 'AI Solutions',
    industry: 'Career',
    projectType: 'SaaS',
    technologies: ['Laravel', 'PHP', 'MySQL'],
    features: [
      'Resume Templates',
      'PDF Export',
      'User Dashboard',
      'Admin Panel',
      'SAAS Subscriptions',
      'Multi-language',
    ],
    demoUrl: 'https://goresumecv.techfago.com',
    sourceUrl: itemUrl('goresumecv-saas-resume-builder-online', '34113236'),
    demoCredentials: {
      username: 'admin@admin.com',
      password: 'admin@admin.com',
      notes: 'User demo: user@user.com / user@user.com',
    },
    liveDemoAvailable: true,
    ownerType: 'developer',
    status: 'published',
    featured: true,
    tier: 3,
    price: { displayText: 'Starting from ₹90,000', min: 90000, max: 250000, currency: 'INR' },
  },
  {
    title: 'Resume Builder — CV & Services Platform',
    codecanyonId: '31632224',
    developerEmail: 'amit.dev@smglobalhub.com',
    shortDescription: 'Build resumes online and sell resume writing services to clients.',
    description:
      'Resume Builder platform lets users create professional CVs online and enables freelancers or agencies to sell resume-building services with client management and template customization.',
    categoryName: 'AI Solutions',
    industry: 'Career',
    projectType: 'SaaS',
    technologies: ['Laravel', 'PHP', 'MySQL'],
    features: [
      'CV Builder',
      'Multiple Templates',
      'Service Selling',
      'Client Management',
      'PDF Download',
      'Admin Dashboard',
    ],
    demoUrl: preview('resume-builder-build-your-resume-sell-your-service', '31632224'),
    sourceUrl: itemUrl('resume-builder-build-your-resume-sell-your-service', '31632224'),
    liveDemoAvailable: true,
    ownerType: 'developer',
    status: 'published',
    featured: false,
    tier: 3,
    price: { displayText: 'Starting from ₹80,000', min: 80000, max: 220000, currency: 'INR' },
  },
];

const seedCodecanyonProducts = async () => {
  const admin = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });
  if (!admin) {
    throw new Error('Admin user not found. Run npm run seed first.');
  }

  const developers = {};
  for (const email of ['rahul.dev@smglobalhub.com', 'priya.dev@smglobalhub.com', 'amit.dev@smglobalhub.com']) {
    developers[email] = await User.findOne({ email });
  }

  let created = 0;
  let skipped = 0;

  for (const product of codecanyonProducts) {
    const exists = await Project.findOne({
      $or: [{ title: product.title }, { 'seo.keywords': product.codecanyonId }],
    });

    if (exists) {
      skipped++;
      continue;
    }

    const category = await Category.findOne({ name: product.categoryName });

    let createdBy = admin._id;
    let developerId = undefined;

    if (product.ownerType === 'developer' && product.developerEmail) {
      const dev = developers[product.developerEmail];
      if (dev) {
        createdBy = dev._id;
        developerId = dev._id;
      }
    }

    await Project.create({
      title: product.title,
      shortDescription: product.shortDescription,
      description: `${product.description}\n\nReference product: ${product.sourceUrl}`,
      category: category?._id,
      industry: product.industry,
      projectType: product.projectType,
      technologies: product.technologies,
      features: product.features,
      screenshots: [
        screenshot(`cc-${product.codecanyonId}-1`, 'Dashboard Preview'),
        screenshot(`cc-${product.codecanyonId}-2`, 'Feature Preview'),
      ],
      demoUrl: product.demoUrl,
      demoCredentials: product.demoCredentials,
      liveDemoAvailable: product.liveDemoAvailable,
      price: product.price,
      customizable: true,
      ownerType: product.ownerType,
      developerId,
      status: product.status,
      featured: product.featured,
      tier: product.tier,
      createdBy,
      seo: {
        metaTitle: product.title,
        metaDescription: product.shortDescription,
        keywords: [product.codecanyonId, 'codecanyon', product.projectType.toLowerCase()],
      },
    });

    created++;
    console.log(`Added: ${product.title}`);
  }

  const categoryIds = await Category.find().select('_id');
  for (const cat of categoryIds) {
    const count = await Project.countDocuments({ category: cat._id, status: { $in: ['published', 'featured'] } });
    await Category.findByIdAndUpdate(cat._id, { projectCount: count });
  }

  console.log(`\nCodeCanyon products: ${created} added, ${skipped} skipped (already exist)`);
};

const run = async () => {
  try {
    await connectDB();
    console.log('\n--- Seeding CodeCanyon products ---\n');
    await seedCodecanyonProducts();
    console.log('\n--- Done ---\n');
    process.exit(0);
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  run();
}

module.exports = seedCodecanyonProducts;
