const User = require('../models/User');
const Project = require('../models/Project');
const Requirement = require('../models/Requirement');
const CustomizationRequest = require('../models/CustomizationRequest');
const Category = require('../models/Category');
const { sendSuccess, sendPaginated, sendError } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { publicUser } = require('./auth.controller');

const getSuperDashboard = async (req, res, next) => {
  try {
    const [
      totalProjects,
      companyProjects,
      developerProjects,
      publishedProjects,
      featuredProjects,
      draftProjects,
      totalCategories,
      totalRequirements,
      newRequirements,
      wonRequirements,
      totalCustomizations,
      newCustomizations,
      wonCustomizations,
      totalDevelopers,
      pendingDevelopers,
      verifiedDevelopers,
      totalClients,
      totalAdmins,
      totalUsers,
      recentRequirements,
      recentCustomizations,
      recentUsers,
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ ownerType: 'company' }),
      Project.countDocuments({ ownerType: 'developer' }),
      Project.countDocuments({ status: { $in: ['published', 'featured'] } }),
      Project.countDocuments({ featured: true }),
      Project.countDocuments({ status: 'draft' }),
      Category.countDocuments(),
      Requirement.countDocuments(),
      Requirement.countDocuments({ status: 'new' }),
      Requirement.countDocuments({ status: 'won' }),
      CustomizationRequest.countDocuments(),
      CustomizationRequest.countDocuments({ status: 'new' }),
      CustomizationRequest.countDocuments({ status: 'won' }),
      User.countDocuments({ role: 'developer' }),
      User.countDocuments({ role: 'developer', verificationStatus: 'pending' }),
      User.countDocuments({ role: 'developer', verificationStatus: 'verified' }),
      User.countDocuments({ role: 'client' }),
      User.countDocuments({ role: { $in: ['admin', 'super_admin'] } }),
      User.countDocuments(),
      Requirement.find().sort({ createdAt: -1 }).limit(5).select('leadId name company status createdAt'),
      CustomizationRequest.find().sort({ createdAt: -1 }).limit(5).select('leadId name projectTitle status createdAt'),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role status verificationStatus createdAt'),
    ]);

    const totalViews = await Project.aggregate([
      { $group: { _id: null, views: { $sum: '$views' } } },
    ]);

    sendSuccess(
      res,
      {
        overview: {
          totalProjects,
          companyProjects,
          developerProjects,
          publishedProjects,
          featuredProjects,
          draftProjects,
          totalViews: totalViews[0]?.views || 0,
          totalCategories,
          totalUsers,
        },
        leads: {
          requirements: { total: totalRequirements, new: newRequirements, won: wonRequirements },
          customizations: { total: totalCustomizations, new: newCustomizations, won: wonCustomizations },
          conversionRate:
            totalRequirements + totalCustomizations > 0
              ? Math.round(
                  ((wonRequirements + wonCustomizations) /
                    (totalRequirements + totalCustomizations)) *
                    100
                )
              : 0,
        },
        users: {
          developers: { total: totalDevelopers, pending: pendingDevelopers, verified: verifiedDevelopers },
          clients: totalClients,
          admins: totalAdmins,
        },
        recent: {
          requirements: recentRequirements,
          customizations: recentCustomizations,
          users: recentUsers,
        },
        permissions: [
          'manage_all_users',
          'manage_admins',
          'manage_developers',
          'manage_projects',
          'manage_leads',
          'manage_categories',
          'manage_commission',
          'view_platform_analytics',
        ],
      },
      'Super admin dashboard fetched'
    );
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.verificationStatus) filter.verificationStatus = req.query.verificationStatus;
    if (req.query.search) {
      const { escapeRegex } = require('../utils/excelExport');
      const q = escapeRegex(String(req.query.search).trim());
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password').lean(),
      User.countDocuments(filter),
    ]);

    sendPaginated(res, users.map(publicUser), buildPaginationMeta(total, page, limit), 'Users fetched');
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { status, verificationStatus, role, commissionRate } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);

    if (user.role === 'super_admin' && req.user._id.toString() !== user._id.toString()) {
      return sendError(res, 'Cannot modify another super admin', 403);
    }

    if (status) user.status = status;
    if (verificationStatus) user.verificationStatus = verificationStatus;
    if (role && req.user.role === 'super_admin') {
      if (['admin', 'support_agent', 'developer', 'client', 'super_admin'].includes(role)) {
        user.role = role;
      }
    }
    if (commissionRate !== undefined && req.user.role === 'super_admin') {
      user.commissionRate = commissionRate;
    }

    await user.save();
    sendSuccess(res, publicUser(user), 'User updated');
  } catch (error) {
    next(error);
  }
};

const createAdminUser = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return sendError(res, 'Email already exists', 409);

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'admin',
      status: 'active',
      verificationStatus: 'verified',
    });

    sendSuccess(res, publicUser(user), 'Admin user created', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuperDashboard,
  getUsers,
  updateUserStatus,
  createAdminUser,
};
