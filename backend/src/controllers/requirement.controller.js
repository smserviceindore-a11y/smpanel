const Requirement = require('../models/Requirement');
const Project = require('../models/Project');
const generateLeadId = require('../utils/generateLeadId');
const { getRecommendations } = require('../utils/recommendationEngine');
const { sendSuccess, sendPaginated, sendError } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { sendExcel } = require('../utils/excelExport');
const { MAX_EXPORT, buildLeadSearchFilter, buildDateRangeFilter, mergeFilters } = require('../utils/queryHelpers');

const LIST_SELECT =
  'leadId name company email mobile industry projectType modules budget timeline status adminNotes createdAt updatedAt clientId';

const buildRequirementFilter = (query) => {
  const parts = [];
  if (query.status) parts.push({ status: query.status });
  if (query.industry) parts.push({ industry: new RegExp(String(query.industry).trim(), 'i') });
  parts.push(
    buildLeadSearchFilter(query.search, ['name', 'company', 'email', 'leadId', 'mobile', 'projectType'])
  );
  parts.push(buildDateRangeFilter(query, 'createdAt'));
  return mergeFilters(...parts);
};

const createRequirement = async (req, res, next) => {
  try {
    const leadId = await generateLeadId();

    // Only fields needed for recommendations — avoid full collection dump
    const publishedProjects = await Project.find({
      status: { $in: ['published', 'featured'] },
    })
      .select('title slug shortDescription industry projectType category features status featured')
      .populate('category', 'name')
      .lean()
      .limit(200);

    const recommendedProjects = getRecommendations(req.body, publishedProjects);

    const requirement = await Requirement.create({
      ...req.body,
      leadId,
      recommendedProjects,
      clientId: req.user?.role === 'client' ? req.user._id : undefined,
    });

    const populated = await Requirement.findById(requirement._id)
      .populate('recommendedProjects.projectId', 'title slug shortDescription industry projectType')
      .lean();

    sendSuccess(
      res,
      populated,
      'Requirement submitted successfully. Our team will contact you soon.',
      201
    );
  } catch (error) {
    next(error);
  }
};

const getAdminRequirements = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const filter = buildRequirementFilter(req.query);

    const [requirements, total] = await Promise.all([
      Requirement.find(filter)
        .select(LIST_SELECT)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Requirement.countDocuments(filter),
    ]);

    sendPaginated(
      res,
      requirements,
      buildPaginationMeta(total, page, limit),
      'Requirements fetched'
    );
  } catch (error) {
    next(error);
  }
};

const getAdminRequirementById = async (req, res, next) => {
  try {
    const requirement = await Requirement.findById(req.params.id).populate(
      'recommendedProjects.projectId',
      'title slug industry projectType'
    );
    if (!requirement) return sendError(res, 'Requirement not found', 404);
    sendSuccess(res, requirement, 'Requirement fetched');
  } catch (error) {
    next(error);
  }
};

const updateRequirementStatus = async (req, res, next) => {
  try {
    const { status, adminNotes, assignedTo } = req.body;
    const update = {};
    if (status) update.status = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;
    if (assignedTo) update.assignedTo = assignedTo;

    const requirement = await Requirement.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).select(LIST_SELECT);

    if (!requirement) return sendError(res, 'Requirement not found', 404);
    sendSuccess(res, requirement, 'Requirement status updated');
  } catch (error) {
    next(error);
  }
};

const exportRequirementsExcel = async (req, res, next) => {
  try {
    const filter = buildRequirementFilter(req.query);
    const rows = await Requirement.find(filter)
      .select(LIST_SELECT)
      .sort({ createdAt: -1 })
      .limit(MAX_EXPORT)
      .lean();

    await sendExcel(res, {
      filename: `requirements-leads-${Date.now()}.xlsx`,
      sheetName: 'Requirements',
      columns: [
        { header: 'Lead ID', key: 'leadId', width: 14 },
        { header: 'Name', key: 'name', width: 22 },
        { header: 'Company', key: 'company', width: 22 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Mobile', key: 'mobile', width: 16 },
        { header: 'Industry', key: 'industry', width: 16 },
        { header: 'Project Type', key: 'projectType', width: 16 },
        { header: 'Modules', key: 'modules', width: 28 },
        { header: 'Budget', key: 'budget', width: 18 },
        { header: 'Timeline', key: 'timeline', width: 14 },
        { header: 'Status', key: 'status', width: 18 },
        { header: 'Admin Notes', key: 'adminNotes', width: 30 },
        { header: 'Created At', key: 'createdAt', width: 20 },
      ],
      rows: rows.map((r) => ({
        leadId: r.leadId,
        name: r.name,
        company: r.company || '',
        email: r.email,
        mobile: r.mobile,
        industry: r.industry || '',
        projectType: r.projectType || '',
        modules: (r.modules || []).join(', '),
        budget: r.budget || '',
        timeline: r.timeline || '',
        status: r.status,
        adminNotes: r.adminNotes || '',
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : '',
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequirement,
  getAdminRequirements,
  getAdminRequirementById,
  updateRequirementStatus,
  exportRequirementsExcel,
};
