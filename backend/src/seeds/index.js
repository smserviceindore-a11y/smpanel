require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const seedAdmin = require('./seedAdmin');
const seedCategories = require('./seedCategories');
const seedProjects = require('./seedProjects');
const seedExtraCompanyProjects = require('./seedExtraCompanyProjects');
const seedDevelopers = require('./seedDevelopers');
const seedDeveloperProjects = require('./seedDeveloperProjects');
const seedCodecanyonProducts = require('./seedCodecanyonProducts');
const { seedRoleUsers, seedClientDemoLeads } = require('./seedRoleUsers');
const seedMoneyStory = require('./seedMoneyStory');
const seedDemoBuyNow = require('./seedDemoBuyNow');

const runSeeds = async () => {
  try {
    await connectDB();
    console.log('\n--- Starting database seed ---\n');

    const admin = await seedAdmin();
    await seedCategories();
    await seedProjects(admin._id);
    await seedExtraCompanyProjects(admin._id);

    const developers = await seedDevelopers();
    await seedDeveloperProjects(developers);
    await seedCodecanyonProducts();

    const roles = await seedRoleUsers();
    await seedClientDemoLeads(roles.client);
    await seedMoneyStory();
    await seedDemoBuyNow();

    console.log('\n--- Seed completed successfully ---\n');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

runSeeds();
