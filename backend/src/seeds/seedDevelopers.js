const User = require('../models/User');

/** Shared demo password for all seeded developers */
const DEV_PASSWORD = 'Dev@2026';

const developers = [
  // Original demo sellers (money-story / marketplace samples)
  {
    name: 'Rahul Sharma',
    email: 'rahul.dev@smglobalhub.com',
    phone: '9876500001',
    password: DEV_PASSWORD,
    role: 'developer',
    verificationStatus: 'verified',
    profile: {
      bio: 'Full-stack developer with 5+ years experience in React, Node.js and MongoDB.',
      skills: ['React', 'Node.js', 'MongoDB'],
      experience: '5+ years',
    },
  },
  {
    name: 'Priya Verma',
    email: 'priya.dev@smglobalhub.com',
    phone: '9876500002',
    password: DEV_PASSWORD,
    role: 'developer',
    verificationStatus: 'verified',
    profile: {
      bio: 'Specialist in SaaS products, e-commerce platforms and admin dashboards.',
      skills: ['SaaS', 'E-commerce', 'Dashboards'],
      experience: '4+ years',
    },
  },
  {
    name: 'Amit Kumar',
    email: 'amit.dev@smglobalhub.com',
    phone: '9876500003',
    password: DEV_PASSWORD,
    role: 'developer',
    verificationStatus: 'verified',
    profile: {
      bio: 'Healthcare and education software developer with strong UI/UX focus.',
      skills: ['Healthcare', 'Education', 'UI/UX'],
      experience: '4+ years',
    },
  },

  // College team developers (SM Global Solution Hub)
  {
    name: 'Sagar Tiwari',
    email: 'sagar.dev@smglobalhub.com',
    phone: '9876510001',
    password: DEV_PASSWORD,
    role: 'developer',
    verificationStatus: 'verified',
    profile: {
      bio: 'Built SM Global Solution Hub marketplace and SMM Portal internship/training system (Admin, HR, Trainer, College, Intern).',
      skills: ['React', 'Node.js', 'Express', 'MongoDB', 'MySQL', 'Prisma', 'Vite', 'Razorpay'],
      company: 'SM Global Tech Solutions',
      experience: 'Full-stack / Lead',
      avatar:
        'https://res.cloudinary.com/luysen3q/image/upload/v1789876604/sm-global-hub/developers/sagar.jpg',
    },
  },
  {
    name: 'Shubham Gupta',
    email: 'shubham.dev@smglobalhub.com',
    phone: '9876510002',
    password: DEV_PASSWORD,
    role: 'developer',
    verificationStatus: 'verified',
    profile: {
      bio: 'Built Client Matrix (agency SaaS) and AB Public School Portal (institutional ERP) — multi-role dashboards, payments and operations.',
      skills: ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 'Tailwind CSS', 'Razorpay'],
      company: 'SM Global Tech Solutions',
      experience: 'Full-stack / Team Lead',
      avatar:
        'https://res.cloudinary.com/luysen3q/image/upload/v1789876606/sm-global-hub/developers/shubham.jpg',
    },
  },
  {
    name: 'Ambikeshwar',
    email: 'ambikeshwar.dev@smglobalhub.com',
    phone: '9876510003',
    password: DEV_PASSWORD,
    role: 'developer',
    verificationStatus: 'verified',
    profile: {
      bio: 'Built SM SERVICES — Flask invoice & billing automation with OCR, PDF invoices, and UPI QR.',
      skills: ['Python', 'Flask', 'SQLite', 'OCR', 'Bootstrap', 'ReportLab'],
      company: 'SM Global Tech Solutions',
      experience: 'Full-stack (Python)',
      avatar:
        'https://res.cloudinary.com/luysen3q/image/upload/v1789876607/sm-global-hub/developers/ambikeshwar.jpg',
    },
  },
  {
    name: 'Aadrika',
    email: 'aadrika.dev@smglobalhub.com',
    phone: '9876510004',
    password: DEV_PASSWORD,
    role: 'developer',
    verificationStatus: 'verified',
    profile: {
      bio: 'Frontend developer focused on UI layouts and React interfaces.',
      skills: ['HTML', 'CSS', 'React', 'UI'],
      company: 'SM Global Tech Solutions',
      experience: 'Frontend',
      avatar:
        'https://res.cloudinary.com/luysen3q/image/upload/v1789876610/sm-global-hub/developers/aadrika.jpg',
    },
  },
  {
    name: 'Yash',
    email: 'yash.dev@smglobalhub.com',
    phone: '9876510005',
    password: DEV_PASSWORD,
    role: 'developer',
    verificationStatus: 'verified',
    profile: {
      bio: 'Built Yash Health Connect — multi-role hospital management SaaS with appointments, billing, care rooms and AI assistance.',
      skills: ['React', 'Node.js', 'Express', 'MongoDB', 'Socket.io', 'Razorpay'],
      company: 'SM Global Tech Solutions',
      experience: 'Full-stack (MERN)',
      avatar:
        'https://res.cloudinary.com/luysen3q/image/upload/v1789876608/sm-global-hub/developers/yash.jpg',
    },
  },
  {
    name: 'Ayush',
    email: 'ayush.dev@smglobalhub.com',
    phone: '9876510006',
    password: DEV_PASSWORD,
    role: 'developer',
    verificationStatus: 'verified',
    profile: {
      bio: 'Built SmartJobs — Django career network with AI resume tools, employer billing, messaging and job CMS.',
      skills: ['Python', 'Django', 'SQLite', 'Razorpay', 'Gemini AI', 'HTML/CSS'],
      company: 'SM Global Tech Solutions',
      experience: 'Full-stack (Django)',
      avatar:
        'https://res.cloudinary.com/luysen3q/image/upload/v1789876609/sm-global-hub/developers/ayush.jpg',
    },
  },
];

const seedDevelopers = async () => {
  const created = [];

  for (const dev of developers) {
    let user = await User.findOne({ email: dev.email });
    if (!user) {
      user = await User.create(dev);
      console.log('Developer created:', user.email);
    } else {
      user.name = dev.name;
      user.phone = dev.phone || user.phone;
      user.role = 'developer';
      user.status = 'active';
      user.verificationStatus = 'verified';
      if (dev.profile) {
        user.profile = { ...(user.profile?.toObject?.() || user.profile || {}), ...dev.profile };
      }
      await user.save();
      console.log('Developer already exists (updated):', user.email);
    }
    created.push(user);
  }

  return created;
};

module.exports = seedDevelopers;
