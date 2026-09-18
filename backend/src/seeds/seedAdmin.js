require('dotenv').config();
const User = require('../models/User');

const seedAdmin = async () => {
  const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (existing) {
    console.log('Admin user already exists:', existing.email);
    return existing;
  }

  const admin = await User.create({
    name: process.env.ADMIN_NAME || 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@smglobal.com',
    password: process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!',
    role: 'super_admin',
    status: 'active',
  });

  console.log('Admin user created:', admin.email);
  return admin;
};

module.exports = seedAdmin;
