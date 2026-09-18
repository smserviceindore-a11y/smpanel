const Project = require('../models/Project');
const Category = require('../models/Category');

const seedProjects = async (adminId) => {
  const erpCategory = await Category.findOne({ name: 'ERP' });
  const hrmsCategory = await Category.findOne({ name: 'HRMS' });
  const jobPortalCategory = await Category.findOne({ name: 'Job Portal' });
  const aiCategory = await Category.findOne({ name: 'AI Solutions' });

  const projects = [
    {
      title: 'SM HR Pro',
      shortDescription: 'Complete HR & Payroll Management System for modern businesses',
      description: 'SM HR Pro is a comprehensive HR and payroll management solution designed for SMEs and enterprises. Manage employees, attendance, payroll, leave, and reports from a single dashboard.',
      category: hrmsCategory?._id,
      industry: 'HR',
      projectType: 'HRMS',
      technologies: ['React', 'Node.js', 'MongoDB'],
      features: [
        'Employee Management',
        'Attendance Tracking',
        'Payroll Processing',
        'Leave Management',
        'Reports & Analytics',
        'Dashboard',
      ],
      demoUrl: 'https://demo.smhrpro.com',
      liveDemoAvailable: true,
      demoCredentials: { username: 'demo', password: 'demo123', notes: 'Read-only demo account' },
      price: { displayText: 'Starting from ₹1,50,000', min: 150000, max: 500000, currency: 'INR' },
      customizable: true,
      ownerType: 'company',
      status: 'featured',
      featured: true,
      tier: 1,
      createdBy: adminId,
    },
    {
      title: 'VR Industry ERP',
      shortDescription: 'Manufacturing & Production ERP for industrial businesses',
      description: 'VR Industry ERP is a full-featured manufacturing ERP system covering inventory, production planning, purchase, sales, and employee management for manufacturing units.',
      category: erpCategory?._id,
      industry: 'Manufacturing',
      projectType: 'ERP',
      technologies: ['React', 'Node.js', 'MongoDB', 'PostgreSQL'],
      features: [
        'Inventory Management',
        'Production Management',
        'Employee Management',
        'Attendance',
        'Purchase',
        'Sales',
        'Reports',
        'Dashboard',
      ],
      demoUrl: 'https://demo.vrerp.com',
      liveDemoAvailable: true,
      demoCredentials: { username: 'admin', password: 'admin123', notes: 'Demo environment' },
      price: { displayText: 'Starting from ₹3,00,000', min: 300000, max: 1000000, currency: 'INR' },
      customizable: true,
      ownerType: 'company',
      status: 'featured',
      featured: true,
      tier: 1,
      createdBy: adminId,
    },
    {
      title: 'Job Portal',
      shortDescription: 'Recruitment & Placement Platform for agencies and companies',
      description: 'A complete job portal solution with employer dashboard, candidate profiles, job posting, application tracking, and placement management.',
      category: jobPortalCategory?._id,
      industry: 'Recruitment',
      projectType: 'SaaS',
      technologies: ['React', 'Node.js', 'MongoDB'],
      features: [
        'Job Posting',
        'Candidate Profiles',
        'Application Tracking',
        'Employer Dashboard',
        'Search & Filters',
        'Email Notifications',
      ],
      demoUrl: 'https://demo.jobportal.com',
      liveDemoAvailable: true,
      price: { displayText: 'Starting from ₹2,00,000', min: 200000, max: 600000, currency: 'INR' },
      customizable: true,
      ownerType: 'company',
      status: 'published',
      featured: true,
      tier: 2,
      createdBy: adminId,
    },
    {
      title: 'AI Resume Builder',
      shortDescription: 'AI-powered Resume & Career Platform',
      description: 'An intelligent resume builder that uses AI to help candidates create professional resumes, optimize for ATS, and get career recommendations.',
      category: aiCategory?._id,
      industry: 'Career',
      projectType: 'AI Solutions',
      technologies: ['React', 'Node.js', 'OpenAI API', 'MongoDB'],
      features: [
        'AI Resume Generation',
        'ATS Optimization',
        'Multiple Templates',
        'Career Recommendations',
        'PDF Export',
        'Cover Letter Builder',
      ],
      demoUrl: 'https://demo.aireume.com',
      liveDemoAvailable: true,
      price: { displayText: 'Starting from ₹1,00,000', min: 100000, max: 300000, currency: 'INR' },
      customizable: true,
      ownerType: 'company',
      status: 'published',
      featured: true,
      tier: 2,
      createdBy: adminId,
    },
  ];

  let created = 0;
  for (const project of projects) {
    const exists = await Project.findOne({ title: project.title });
    if (!exists) {
      await Project.create(project);
      created++;
    }
  }

  if (created > 0) {
    const categoryIds = [...new Set(projects.map((p) => p.category).filter(Boolean))];
    for (const catId of categoryIds) {
      const count = await Project.countDocuments({ category: catId });
      await Category.findByIdAndUpdate(catId, { projectCount: count });
    }
  }

  console.log(`Projects seeded: ${created} new, ${projects.length - created} already existed`);
};

module.exports = seedProjects;
