const Requirement = require('../models/Requirement');
const CustomizationRequest = require('../models/CustomizationRequest');
const User = require('../models/User');
const { sendSuccess, sendPaginated, sendError } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const getClientDashboard = async (req, res, next) => {
  try {
    const clientId = req.user._id;
    const email = req.user.email;

    const clientFilter = {
      $or: [{ clientId }, { email }],
    };

    const [
      totalRequirements,
      newRequirements,
      activeRequirements,
      wonRequirements,
      totalCustomizations,
      newCustomizations,
      wonCustomizations,
      recentRequirements,
      recentCustomizations,
    ] = await Promise.all([
      Requirement.countDocuments(clientFilter),
      Requirement.countDocuments({ ...clientFilter, status: 'new' }),
      Requirement.countDocuments({
        ...clientFilter,
        status: { $in: ['contacted', 'requirement_discussed', 'demo_given', 'quotation_sent', 'negotiation'] },
      }),
      Requirement.countDocuments({ ...clientFilter, status: 'won' }),
      CustomizationRequest.countDocuments(clientFilter),
      CustomizationRequest.countDocuments({ ...clientFilter, status: 'new' }),
      CustomizationRequest.countDocuments({ ...clientFilter, status: 'won' }),
      Requirement.find(clientFilter)
        .sort({ createdAt: -1 })
        .limit(6)
        .select('leadId projectType industry status budget timeline recommendedProjects createdAt')
        .populate('recommendedProjects.projectId', 'title slug'),
      CustomizationRequest.find(clientFilter)
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('projectId', 'title slug')
        .select('leadId projectTitle selectedModules status budget timeline createdAt'),
    ]);

    sendSuccess(
      res,
      {
        profile: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
          company: req.user.profile?.company,
        },
        requirements: {
          total: totalRequirements,
          new: newRequirements,
          active: activeRequirements,
          won: wonRequirements,
        },
        customizations: {
          total: totalCustomizations,
          new: newCustomizations,
          won: wonCustomizations,
        },
        orders: {
          note: 'Purchase / payment tracking activates in Phase 3',
          active: activeRequirements + newCustomizations,
          completed: wonRequirements + wonCustomizations,
        },
        recent: {
          requirements: recentRequirements,
          customizations: recentCustomizations,
        },
        permissions: [
          'submit_requirement',
          'submit_customization',
          'view_own_leads',
          'view_recommendations',
        ],
      },
      'Client dashboard fetched'
    );
  } catch (error) {
    next(error);
  }
};

const getMyRequirements = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 12);
    const filter = {
      $or: [{ clientId: req.user._id }, { email: req.user.email }],
    };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const { escapeRegex } = require('../utils/excelExport');
      const q = escapeRegex(String(req.query.search).trim());
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { leadId: new RegExp(q, 'i') },
            { industry: new RegExp(q, 'i') },
            { projectType: new RegExp(q, 'i') },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      Requirement.find(filter)
        .select(
          'leadId projectType industry modules budget timeline status recommendedProjects createdAt'
        )
        .populate('recommendedProjects.projectId', 'title slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Requirement.countDocuments(filter),
    ]);

    sendPaginated(res, items, buildPaginationMeta(total, page, limit), 'Client requirements fetched');
  } catch (error) {
    next(error);
  }
};

const getMyCustomizations = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 12);
    const filter = {
      $or: [{ clientId: req.user._id }, { email: req.user.email }],
    };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const { escapeRegex } = require('../utils/excelExport');
      const q = escapeRegex(String(req.query.search).trim());
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { leadId: new RegExp(q, 'i') },
            { projectTitle: new RegExp(q, 'i') },
            { name: new RegExp(q, 'i') },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      CustomizationRequest.find(filter)
        .select('leadId projectTitle selectedModules status budget timeline createdAt projectId')
        .populate('projectId', 'title slug industry')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CustomizationRequest.countDocuments(filter),
    ]);

    sendPaginated(res, items, buildPaginationMeta(total, page, limit), 'Client customizations fetched');
  } catch (error) {
    next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const { name, phone, profile } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 'User not found', 404);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (profile) {
      user.profile = {
        ...(user.profile?.toObject?.() || user.profile || {}),
        ...profile,
      };
    }
    await user.save();

    sendSuccess(
      res,
      {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profile: user.profile,
      },
      'Profile updated'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getClientDashboard,
  getMyRequirements,
  getMyCustomizations,
  updateMyProfile,
};
