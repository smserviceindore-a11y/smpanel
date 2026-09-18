const Project = require('../models/Project');
const Category = require('../models/Category');

const placeholderScreenshot = (seed, caption) => ({
  url: `https://picsum.photos/seed/${seed}/1200/800`,
  caption,
  order: 0,
});

const seedDeveloperProjects = async (developers) => {
  const educationCategory = await Category.findOne({ name: 'Education' });
  const ecommerceCategory = await Category.findOne({ name: 'E-Commerce' });
  const healthcareCategory = await Category.findOne({ name: 'Healthcare' });

  const [rahul, priya, amit] = developers;

  const projects = [
    {
      title: 'EduManage Pro',
      shortDescription: 'Complete school and college management system',
      description:
        'EduManage Pro helps educational institutions manage students, teachers, fees, attendance, exams and reports from one unified platform.',
      category: educationCategory?._id,
      industry: 'Education',
      projectType: 'SaaS',
      technologies: ['React', 'Node.js', 'MongoDB', 'Tailwind CSS'],
      features: [
        'Student Management',
        'Teacher Management',
        'Fees Collection',
        'Attendance',
        'Examination',
        'Reports',
      ],
      screenshots: [placeholderScreenshot('edumanage1', 'Dashboard'), placeholderScreenshot('edumanage2', 'Student Panel')],
      demoUrl: '',
      liveDemoAvailable: false,
      price: { displayText: 'Starting from ₹1,80,000', min: 180000, max: 450000, currency: 'INR' },
      customizable: true,
      ownerType: 'developer',
      developerId: rahul?._id,
      status: 'published',
      featured: false,
      tier: 3,
      createdBy: rahul?._id,
    },
    {
      title: 'ShopWave Commerce',
      shortDescription: 'Modern multi-vendor e-commerce platform',
      description:
        'ShopWave Commerce is a scalable e-commerce solution with vendor management, product catalog, cart, checkout, payments and order tracking.',
      category: ecommerceCategory?._id,
      industry: 'Retail',
      projectType: 'E-Commerce',
      technologies: ['React', 'Next.js', 'Node.js', 'Stripe'],
      features: [
        'Multi-vendor Support',
        'Product Catalog',
        'Cart & Checkout',
        'Order Management',
        'Payment Gateway',
        'Admin Dashboard',
      ],
      screenshots: [placeholderScreenshot('shopwave1', 'Storefront'), placeholderScreenshot('shopwave2', 'Admin Panel')],
      demoUrl: '',
      liveDemoAvailable: false,
      price: { displayText: 'Starting from ₹2,20,000', min: 220000, max: 600000, currency: 'INR' },
      customizable: true,
      ownerType: 'developer',
      developerId: priya?._id,
      status: 'published',
      featured: false,
      tier: 3,
      createdBy: priya?._id,
    },
    {
      title: 'MediCare HMS',
      shortDescription: 'Hospital and clinic management system',
      description:
        'MediCare HMS streamlines patient records, appointments, billing, pharmacy inventory and doctor scheduling for healthcare providers.',
      category: healthcareCategory?._id,
      industry: 'Healthcare',
      projectType: 'HMS',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Redis'],
      features: [
        'Patient Records',
        'Appointment Scheduling',
        'Billing & Invoices',
        'Pharmacy Inventory',
        'Doctor Dashboard',
        'Reports',
      ],
      screenshots: [placeholderScreenshot('medicare1', 'Patient Dashboard'), placeholderScreenshot('medicare2', 'Appointments')],
      demoUrl: '',
      liveDemoAvailable: false,
      price: { displayText: 'Starting from ₹2,50,000', min: 250000, max: 700000, currency: 'INR' },
      customizable: true,
      ownerType: 'developer',
      developerId: amit?._id,
      status: 'published',
      featured: false,
      tier: 3,
      createdBy: amit?._id,
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

  console.log(`Developer projects seeded: ${created} new, ${projects.length - created} already existed`);
};

module.exports = seedDeveloperProjects;
