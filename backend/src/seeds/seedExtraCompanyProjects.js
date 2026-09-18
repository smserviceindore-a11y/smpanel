const Project = require('../models/Project');
const Category = require('../models/Category');

const placeholderScreenshot = (seed, caption) => ({
  url: `https://picsum.photos/seed/${seed}/1200/800`,
  caption,
  order: 0,
});

const seedExtraCompanyProjects = async (adminId) => {
  const crmCategory = await Category.findOne({ name: 'CRM' });
  const ecommerceCategory = await Category.findOne({ name: 'E-Commerce' });
  const educationCategory = await Category.findOne({ name: 'Education' });
  const saasCategory = await Category.findOne({ name: 'SaaS' });

  const projects = [
    {
      title: 'SM CRM Suite',
      shortDescription: 'Customer relationship management for sales-driven teams',
      description:
        'SM CRM Suite helps businesses manage leads, contacts, deals, follow-ups, pipelines and sales reports with a clean modern interface.',
      category: crmCategory?._id,
      industry: 'Sales',
      projectType: 'CRM',
      technologies: ['React', 'Node.js', 'MongoDB'],
      features: ['Lead Management', 'Contact Database', 'Sales Pipeline', 'Follow-ups', 'Reports', 'Team Dashboard'],
      screenshots: [placeholderScreenshot('smcrm1', 'CRM Dashboard'), placeholderScreenshot('smcrm2', 'Pipeline View')],
      demoUrl: 'https://demo.smcrm.com',
      liveDemoAvailable: true,
      demoCredentials: { username: 'sales', password: 'sales123', notes: 'Demo sales account' },
      price: { displayText: 'Starting from ₹1,75,000', min: 175000, max: 400000, currency: 'INR' },
      customizable: true,
      ownerType: 'company',
      status: 'published',
      featured: true,
      tier: 2,
      createdBy: adminId,
    },
    {
      title: 'SM Commerce Hub',
      shortDescription: 'Enterprise e-commerce platform by SM Global',
      description:
        'SM Commerce Hub is a ready-to-deploy online store solution with product management, orders, payments, coupons and analytics.',
      category: ecommerceCategory?._id,
      industry: 'Retail',
      projectType: 'E-Commerce',
      technologies: ['React', 'Node.js', 'MongoDB', 'Razorpay'],
      features: ['Product Management', 'Order Tracking', 'Payment Gateway', 'Coupons', 'Analytics', 'Mobile Ready'],
      screenshots: [placeholderScreenshot('smshop1', 'Store Home'), placeholderScreenshot('smshop2', 'Checkout')],
      demoUrl: 'https://demo.smcommerce.com',
      liveDemoAvailable: true,
      price: { displayText: 'Starting from ₹2,40,000', min: 240000, max: 650000, currency: 'INR' },
      customizable: true,
      ownerType: 'company',
      status: 'published',
      featured: false,
      tier: 2,
      createdBy: adminId,
    },
    {
      title: 'SM Edu Portal',
      shortDescription: 'Learning management and institute management platform',
      description:
        'SM Edu Portal supports online classes, course management, student enrollment, assessments and institute administration.',
      category: educationCategory?._id,
      industry: 'Education',
      projectType: 'LMS',
      technologies: ['React', 'Node.js', 'MongoDB', 'WebRTC'],
      features: ['Course Management', 'Online Classes', 'Student Enrollment', 'Assessments', 'Certificates', 'Admin Panel'],
      screenshots: [placeholderScreenshot('smedu1', 'Course Dashboard'), placeholderScreenshot('smedu2', 'Student View')],
      demoUrl: 'https://demo.smeduportal.com',
      liveDemoAvailable: true,
      price: { displayText: 'Starting from ₹1,90,000', min: 190000, max: 500000, currency: 'INR' },
      customizable: true,
      ownerType: 'company',
      status: 'published',
      featured: false,
      tier: 2,
      createdBy: adminId,
    },
    {
      title: 'SM Invoice Pro',
      shortDescription: 'Billing, invoicing and business accounting SaaS',
      description:
        'SM Invoice Pro simplifies invoicing, expense tracking, GST billing, client management and financial reporting for SMEs.',
      category: saasCategory?._id,
      industry: 'Finance',
      projectType: 'SaaS',
      technologies: ['React', 'Node.js', 'PostgreSQL'],
      features: ['Invoice Generation', 'Expense Tracking', 'GST Billing', 'Client Management', 'Reports', 'PDF Export'],
      screenshots: [placeholderScreenshot('sminvoice1', 'Invoice Dashboard'), placeholderScreenshot('sminvoice2', 'Reports')],
      demoUrl: 'https://demo.sminvoice.com',
      liveDemoAvailable: true,
      price: { displayText: 'Starting from ₹1,20,000', min: 120000, max: 350000, currency: 'INR' },
      customizable: true,
      ownerType: 'company',
      status: 'published',
      featured: false,
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

  console.log(`Extra company projects seeded: ${created} new, ${projects.length - created} already existed`);
};

module.exports = seedExtraCompanyProjects;
