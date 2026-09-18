const Category = require('../models/Category');

const categories = [
  { name: 'ERP', description: 'Enterprise Resource Planning solutions' },
  { name: 'CRM', description: 'Customer Relationship Management' },
  { name: 'HRMS', description: 'Human Resource Management Systems' },
  { name: 'Payroll', description: 'Payroll management solutions' },
  { name: 'Job Portal', description: 'Recruitment and job platforms' },
  { name: 'Education', description: 'Education management systems' },
  { name: 'Healthcare', description: 'Healthcare and hospital management' },
  { name: 'E-Commerce', description: 'Online store and marketplace solutions' },
  { name: 'Manufacturing', description: 'Manufacturing and production systems' },
  { name: 'Government', description: 'Government and public sector solutions' },
  { name: 'AI Solutions', description: 'AI-powered applications' },
  { name: 'Mobile Applications', description: 'Mobile app solutions' },
  { name: 'SaaS', description: 'Software as a Service platforms' },
  { name: 'Business Automation', description: 'Business process automation tools' },
  { name: 'Mentorship', description: 'Mentor-mentee and coaching platforms' },
  { name: 'Resume Builder', description: 'CV and resume builder tools' },
  { name: 'LMS', description: 'Learning management systems' },
  { name: 'Inventory', description: 'Inventory and warehouse management' },
];

const seedCategories = async () => {
  let created = 0;
  for (const cat of categories) {
    const exists = await Category.findOne({ name: cat.name });
    if (!exists) {
      await Category.create(cat);
      created++;
    }
  }
  console.log(`Categories seeded: ${created} new, ${categories.length - created} already existed`);
};

module.exports = seedCategories;
