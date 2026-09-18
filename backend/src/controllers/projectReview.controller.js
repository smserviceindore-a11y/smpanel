const Project = require('../models/Project');
const Category = require('../models/Category');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { sendEmail } = require('../utils/mailer');
const User = require('../models/User');

const LIST_SELECT =
  'title slug industry projectType ownerType status featured views screenshots liveDemoAvailable reviewStatus reviewNotes reviewedAt createdAt updatedAt category developerId';

const getApprovalQueue = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const filter = {
      ownerType: 'developer',
      reviewStatus: req.query.reviewStatus || 'pending',
    };
    if (req.query.search) {
      const { escapeRegex } = require('../utils/excelExport');
      const q = escapeRegex(String(req.query.search).trim());
      filter.$or = [{ title: new RegExp(q, 'i') }, { industry: new RegExp(q, 'i') }];
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .select(LIST_SELECT)
        .populate('developerId', 'name email phone verificationStatus')
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(filter),
    ]);

    sendPaginated(res, projects, buildPaginationMeta(total, page, limit), 'Approval queue fetched');
  } catch (error) {
    next(error);
  }
};

const reviewDeveloperProject = async (req, res, next) => {
  try {
    const { decision, notes, publish } = req.body;
    if (!['approve', 'reject'].includes(decision)) {
      return sendError(res, 'decision must be approve or reject', 400);
    }

    const project = await Project.findOne({
      _id: req.params.id,
      ownerType: 'developer',
    });
    if (!project) return sendError(res, 'Developer project not found', 404);

    project.reviewNotes = notes || '';
    project.reviewedAt = new Date();
    project.reviewedBy = req.user._id;

    if (decision === 'approve') {
      project.reviewStatus = 'approved';
      if (publish !== false) {
        project.status = 'published';
        project.featured = false;
      }
    } else {
      project.reviewStatus = 'rejected';
      project.status = 'draft';
      project.featured = false;
    }

    await project.save();

    if (project.developerId) {
      const developer = await User.findById(project.developerId).select('email name').lean();
      if (developer?.email) {
        await sendEmail({
          to: developer.email,
          subject: `Project ${decision === 'approve' ? 'approved' : 'rejected'}: ${project.title}`,
          text: `Hi ${developer.name},\n\nYour project "${project.title}" was ${decision}d.\n${notes || ''}\n\n— SM Global Hub`,
        });
      }
    }

    sendSuccess(res, project, `Project ${decision}d`);
  } catch (error) {
    next(error);
  }
};

module.exports = { getApprovalQueue, reviewDeveloperProject, LIST_SELECT };
