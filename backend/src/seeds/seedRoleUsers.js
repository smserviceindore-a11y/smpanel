require('dotenv').config();
const User = require('../models/User');
const Project = require('../models/Project');
const CustomizationRequest = require('../models/CustomizationRequest');
const Requirement = require('../models/Requirement');
const generateLeadId = require('../utils/generateLeadId');

const seedRoleUsers = async () => {
  const users = [
    {
      name: 'Master Super Admin',
      email: 'superadmin@smglobal.com',
      password: 'Super@2026',
      role: 'super_admin',
      status: 'active',
      verificationStatus: 'verified',
      phone: '9000000001',
    },
    {
      name: 'Platform Admin',
      email: 'ops@smglobal.com',
      password: 'Admin@2026',
      role: 'admin',
      status: 'active',
      verificationStatus: 'verified',
      phone: '9000000002',
    },
    {
      name: 'Demo Client',
      email: 'client@demo.com',
      password: 'Client@2026',
      role: 'client',
      status: 'active',
      verificationStatus: 'verified',
      phone: '9000000003',
      profile: { company: 'Demo Buyer Pvt Ltd' },
    },
    {
      name: 'Support Agent',
      email: 'support@smglobal.com',
      password: 'Support@2026',
      role: 'support_agent',
      status: 'active',
      verificationStatus: 'verified',
      phone: '9000000004',
    },
  ];

  const created = {};
  for (const u of users) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = await User.create(u);
      console.log('Role user created:', u.email, `(${u.role})`);
    } else {
      // Ensure role/status correct for demo accounts
      user.role = u.role;
      user.status = 'active';
      user.verificationStatus = 'verified';
      await user.save();
      console.log('Role user updated:', u.email, `(${u.role})`);
    }
    const key =
      u.role === 'super_admin'
        ? 'super'
        : u.role === 'admin'
          ? 'admin'
          : u.role === 'support_agent'
            ? 'support'
            : 'client';
    created[key] = user;
  }

  // Verify developers
  await User.updateMany(
    { role: 'developer' },
    { $set: { verificationStatus: 'verified', status: 'active' } }
  );
  console.log('Developers marked verified');

  return created;
};

const seedClientDemoLeads = async (client) => {
  if (!client) return;

  const existing = await Requirement.findOne({ email: client.email });
  if (!existing) {
    const leadId = await generateLeadId();
    await Requirement.create({
      leadId,
      clientId: client._id,
      name: client.name,
      company: client.profile?.company || 'Demo Buyer Pvt Ltd',
      email: client.email,
      mobile: client.phone || '9000000003',
      industry: 'Manufacturing',
      projectType: 'ERP',
      modules: ['Inventory', 'Production'],
      needsERP: true,
      budget: '₹2,00,000 - ₹4,00,000',
      timeline: '2 months',
      status: 'contacted',
      additionalNotes: 'Seeded demo requirement for client dashboard',
    });
    console.log('Demo client requirement seeded');
  }

  const project = await Project.findOne({ ownerType: 'developer', status: { $in: ['published', 'featured'] } });
  if (project) {
    const existsCust = await CustomizationRequest.findOne({
      email: client.email,
      projectId: project._id,
    });
    if (!existsCust) {
      const leadId = await generateLeadId();
      await CustomizationRequest.create({
        leadId,
        clientId: client._id,
        developerId: project.developerId,
        name: client.name,
        company: client.profile?.company || 'Demo Buyer Pvt Ltd',
        email: client.email,
        mobile: client.phone || '9000000003',
        projectId: project._id,
        projectTitle: project.title,
        selectedModules: (project.features || []).slice(0, 3),
        budget: '₹1,50,000',
        timeline: '45 days',
        status: 'new',
        additionalRequirements: 'Seeded demo customization for dashboards',
      });
      console.log('Demo client customization seeded for developer project');
    }
  }
};

module.exports = { seedRoleUsers, seedClientDemoLeads };
