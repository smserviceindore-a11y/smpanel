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
      bio: 'Lead full-stack developer — React, Node.js, MongoDB. Built SM Global Solution Hub end-to-end.',
      skills: ['React', 'Node.js', 'Express', 'MongoDB', 'Vite'],
      company: 'SM Global Tech Solutions',
      experience: 'Full-stack',
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
      bio: 'Software developer contributing to marketplace projects and product builds.',
      skills: ['JavaScript', 'Web Development'],
      company: 'SM Global Tech Solutions',
      experience: 'Developer',
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
      bio: 'Frontend contributor — HTML / UI experiments for SM Global projects.',
      skills: ['HTML', 'CSS', 'Frontend'],
      company: 'SM Global Tech Solutions',
      experience: 'Frontend',
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
      bio: 'Developer on the SM Global Solution Hub college team.',
      skills: ['JavaScript', 'Web'],
      company: 'SM Global Tech Solutions',
      experience: 'Developer',
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
      bio: 'Developer on the SM Global Solution Hub college team.',
      skills: ['JavaScript', 'Web'],
      company: 'SM Global Tech Solutions',
      experience: 'Developer',
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
