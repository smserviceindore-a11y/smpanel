const Project = require('../models/Project');
const CustomizationRequest = require('../models/CustomizationRequest');
const Category = require('../models/Category');
const User = require('../models/User');
const { sendSuccess, sendPaginated, sendError } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { escapeRegex } = require('../utils/excelExport');

const getDeveloperDashboard = async (req, res, next) => {
  try {
    const developerId = req.user._id;

    const [
      totalProjects,
      publishedProjects,
      draftProjects,
      pendingProjects,
      totalViews,
      requests,
      newRequests,
      wonRequests,
      recentRequests,
      myProjects,
    ] = await Promise.all([
      Project.countDocuments({ developerId }),
      Project.countDocuments({ developerId, status: { $in: ['published', 'featured'] } }),
      Project.countDocuments({ developerId, status: 'draft' }),
      Project.countDocuments({ developerId, status: { $in: ['draft'] } }),
      Project.aggregate([
        { $match: { developerId } },
        { $group: { _id: null, views: { $sum: '$views' } } },
      ]),
      CustomizationRequest.countDocuments({ developerId }),
      CustomizationRequest.countDocuments({ developerId, status: 'new' }),
      CustomizationRequest.countDocuments({ developerId, status: 'won' }),
      CustomizationRequest.find({ developerId })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('projectId', 'title slug')
        .select('leadId name projectTitle status budget timeline createdAt'),
      Project.find({ developerId })
        .sort({ updatedAt: -1 })
        .limit(6)
        .select('title slug status featured views liveDemoAvailable price createdAt'),
    ]);

    const commissionRate = req.user.commissionRate ?? 30;
    const estimatedWonValue = wonRequests * 150000;
    const platformCommission = Math.round((estimatedWonValue * commissionRate) / 100);
    const developerShare = estimatedWonValue - platformCommission;

    sendSuccess(
      res,
      {
        profile: {
          name: req.user.name,
          email: req.user.email,
          verificationStatus: req.user.verificationStatus,
          status: req.user.status,
          commissionRate,
        },
        projects: {
          total: totalProjects,
          published: publishedProjects,
          draft: draftProjects,
          pending: pendingProjects,
          views: totalViews[0]?.views || 0,
        },
        requests: {
          total: requests,
          new: newRequests,
          won: wonRequests,
        },
        earnings: {
          currency: 'INR',
          note: 'Demo estimates until Phase 3 payments go live',
          estimatedWonValue,
          platformCommission,
          developerShare,
          pendingSettlement: developerShare,
          paid: 0,
        },
        recent: {
          requests: recentRequests,
          projects: myProjects,
        },
        permissions: [
          'view_own_projects',
          'submit_projects',
          'view_own_requests',
          'view_earnings',
        ],
      },
      'Developer dashboard fetched'
    );
  } catch (error) {
    next(error);
  }
};

const getMyProjects = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 12);
    const filter = { developerId: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const q = escapeRegex(String(req.query.search).trim());
      filter.$or = [{ title: new RegExp(q, 'i') }, { industry: new RegExp(q, 'i') }];
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .select('title slug industry projectType status featured views screenshots createdAt updatedAt category reviewStatus reviewNotes')
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(filter),
    ]);

    sendPaginated(res, projects, buildPaginationMeta(total, page, limit), 'Developer projects fetched');
  } catch (error) {
    next(error);
  }
};

const getMyRequests = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 12);
    // Only released, sanitized requests — never expose client contact
    const filter = {
      developerId: req.user._id,
      ownership: 'developer',
      reviewStatus: 'released_to_developer',
    };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const q = escapeRegex(String(req.query.search).trim());
      filter.$or = [
        { leadId: new RegExp(q, 'i') },
        { projectTitle: new RegExp(q, 'i') },
        { developerBrief: new RegExp(q, 'i') },
      ];
    }

    const [requests, total] = await Promise.all([
      CustomizationRequest.find(filter)
        .select(
          'leadId projectTitle selectedModules budget timeline status createdAt projectId developerBrief developerQuoteAmount developerQuoteNotes developerQuotedAt ownership reviewStatus'
        )
        .populate('projectId', 'title slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CustomizationRequest.countDocuments(filter),
    ]);

    // Explicit sanitize (no name/email/mobile/company)
    const sanitized = requests.map((r) => ({
      _id: r._id,
      leadId: r.leadId,
      projectTitle: r.projectTitle,
      projectId: r.projectId,
      selectedModules: r.selectedModules,
      budget: r.budget,
      timeline: r.timeline,
      status: r.status,
      createdAt: r.createdAt,
      developerBrief: r.developerBrief,
      developerQuoteAmount: r.developerQuoteAmount,
      developerQuoteNotes: r.developerQuoteNotes,
      developerQuotedAt: r.developerQuotedAt,
      ownership: r.ownership,
      reviewStatus: r.reviewStatus,
      clientLabel: 'Client (contact hidden)',
    }));

    sendPaginated(
      res,
      sanitized,
      buildPaginationMeta(total, page, limit),
      'Developer requests fetched'
    );
  } catch (error) {
    next(error);
  }
};

const submitDeveloperQuote = async (req, res, next) => {
  try {
    const amount = Number(req.body.amount);
    const notes = req.body.notes || '';
    if (!amount || amount <= 0) return sendError(res, 'Valid amount required', 400);

    const request = await CustomizationRequest.findOne({
      _id: req.params.id,
      developerId: req.user._id,
      reviewStatus: 'released_to_developer',
    });
    if (!request) return sendError(res, 'Request not found or not released to you', 404);

    request.developerQuoteAmount = amount;
    request.developerQuoteNotes = notes;
    request.developerQuotedAt = new Date();
    if (['new', 'contacted'].includes(request.status)) {
      request.status = 'negotiation';
    }
    await request.save();

    sendSuccess(
      res,
      {
        _id: request._id,
        leadId: request.leadId,
        developerQuoteAmount: request.developerQuoteAmount,
        developerQuoteNotes: request.developerQuoteNotes,
        developerQuotedAt: request.developerQuotedAt,
        status: request.status,
      },
      'Quote submitted. SM team will share with the client.'
    );
  } catch (error) {
    next(error);
  }
};

const submitMyProject = async (req, res, next) => {
  try {
    if (req.user.verificationStatus === 'rejected') {
      return sendError(res, 'Your developer account was rejected. Contact admin.', 403);
    }

    const project = await Project.create({
      ...req.body,
      ownerType: 'developer',
      developerId: req.user._id,
      createdBy: req.user._id,
      status: 'draft',
      featured: false,
      reviewStatus: 'pending',
      reviewNotes: '',
    });

    if (project.category) {
      await Category.findByIdAndUpdate(project.category, { $inc: { projectCount: 1 } });
    }

    sendSuccess(
      res,
      project,
      'Project submitted for admin review. You will be notified after approval.',
      201
    );
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
        ...user.profile?.toObject?.() || user.profile || {},
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
        verificationStatus: user.verificationStatus,
      },
      'Profile updated'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDeveloperDashboard,
  getMyProjects,
  getMyRequests,
  submitDeveloperQuote,
  submitMyProject,
  updateMyProfile,
};
