const CustomizationRequest = require('../models/CustomizationRequest');
const Project = require('../models/Project');
const Quotation = require('../models/Quotation');
const generateLeadId = require('../utils/generateLeadId');
const generateBusinessId = require('../utils/generateBusinessId');
const { sendSuccess, sendPaginated, sendError } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { sendExcel } = require('../utils/excelExport');
const { MAX_EXPORT, buildLeadSearchFilter, buildDateRangeFilter, mergeFilters } = require('../utils/queryHelpers');

const LIST_SELECT =
  'leadId name company email mobile projectId projectTitle selectedModules additionalRequirements budget timeline status adminNotes createdAt updatedAt clientId developerId ownership reviewStatus developerBrief developerQuoteAmount developerQuoteNotes developerQuotedAt releasedAt';

const buildCustomizationFilter = (query) => {
  const parts = [];
  if (query.status) parts.push({ status: query.status });
  if (query.ownership) parts.push({ ownership: query.ownership });
  if (query.reviewStatus) parts.push({ reviewStatus: query.reviewStatus });
  parts.push(
    buildLeadSearchFilter(query.search, [
      'name',
      'company',
      'email',
      'leadId',
      'mobile',
      'projectTitle',
    ])
  );
  parts.push(buildDateRangeFilter(query, 'createdAt'));
  return mergeFilters(...parts);
};

const createCustomizationRequest = async (req, res, next) => {
  try {
    const project = await Project.findById(req.body.projectId).select('title developerId');
    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    const leadId = await generateLeadId();
    const isDevProject = Boolean(project.developerId);

    const request = await CustomizationRequest.create({
      ...req.body,
      leadId,
      projectTitle: project.title,
      clientId: req.user?.role === 'client' ? req.user._id : undefined,
      developerId: project.developerId || undefined,
      ownership: isDevProject ? 'developer' : 'platform',
      reviewStatus: isDevProject ? 'pending_admin' : 'not_applicable',
      developerBrief:
        req.body.additionalRequirements ||
        `Customization for ${project.title}. Modules: ${(req.body.selectedModules || []).join(', ') || 'n/a'}`,
    });

    // Auto draft quotation from customization lead (I-4 / S-3)
    let draftQuote = null;
    try {
      const settingsDoc = await require('../services/settings.service').getOrCreateSettings();
      const taxPercent = Number(settingsDoc.billing?.defaultTaxPercent ?? 18) || 0;
      const hint = Number(req.body.budget) || Number(req.body.estimatedBudget) || 0;
      const unitAmount = hint > 0 ? Math.round(hint) : 10000;
      const line = {
        description: `Customization — ${project.title}`,
        quantity: 1,
        unitAmount,
        amount: unitAmount,
      };
      // Customer pays listed amount only — GST not added on top
      const total = unitAmount;
      draftQuote = await Quotation.create({
        quotationId: generateBusinessId('QT'),
        leadType: 'customization',
        customizationId: request._id,
        projectId: project._id,
        developerId: project.developerId || undefined,
        clientId: req.user?.role === 'client' ? req.user._id : undefined,
        clientName: req.body.name || req.user?.name || 'Client',
        clientEmail: (req.body.email || req.user?.email || '').toLowerCase(),
        clientPhone: req.body.mobile || req.body.phone || req.user?.phone || '',
        clientCompany: req.body.company || '',
        title: `Customization quote — ${project.title}`,
        items: [line],
        subtotal: unitAmount,
        taxPercent,
        taxAmount: 0,
        total,
        milestones: [{ key: 'full', label: 'Full payment', amount: total, status: 'pending' }],
        status: 'draft',
        notes: 'Auto-draft from customization lead. Admin/developer should review amounts before sending. GST is not charged extra to the client.',
        commissionRate: 30,
        createdBy: req.user?._id,
      });
      if (draftQuote) {
        request.status = 'quotation_sent';
        await request.save();
      }
    } catch (e) {
      console.warn('[auto-quote customization]', e.message);
    }

    sendSuccess(
      res,
      { ...request.toObject(), draftQuotationId: draftQuote?._id, draftQuotation: draftQuote?.quotationId },
      isDevProject
        ? 'Request submitted. A draft quotation was prepared for review.'
        : 'Customization request submitted. A draft quotation was prepared for our team.',
      201
    );
  } catch (error) {
    next(error);
  }
};

const getAdminCustomizationRequests = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const filter = buildCustomizationFilter(req.query);

    const [requests, total] = await Promise.all([
      CustomizationRequest.find(filter)
        .select(LIST_SELECT)
        .populate('projectId', 'title slug industry')
        .populate('developerId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CustomizationRequest.countDocuments(filter),
    ]);

    sendPaginated(
      res,
      requests,
      buildPaginationMeta(total, page, limit),
      'Customization requests fetched'
    );
  } catch (error) {
    next(error);
  }
};

const getAdminCustomizationById = async (req, res, next) => {
  try {
    const request = await CustomizationRequest.findById(req.params.id)
      .populate('projectId', 'title slug industry projectType')
      .populate('developerId', 'name email');
    if (!request) return sendError(res, 'Request not found', 404);
    sendSuccess(res, request, 'Request fetched');
  } catch (error) {
    next(error);
  }
};

const updateCustomizationStatus = async (req, res, next) => {
  try {
    const {
      status,
      adminNotes,
      assignedTo,
      additionalRequirements,
      selectedModules,
      budget,
      timeline,
      developerBrief,
      reviewStatus,
      action,
    } = req.body;

    const request = await CustomizationRequest.findById(req.params.id);
    if (!request) return sendError(res, 'Request not found', 404);

    if (status) request.status = status;
    if (adminNotes !== undefined) request.adminNotes = adminNotes;
    if (assignedTo) request.assignedTo = assignedTo;
    if (additionalRequirements !== undefined) request.additionalRequirements = additionalRequirements;
    if (selectedModules !== undefined) request.selectedModules = selectedModules;
    if (budget !== undefined) request.budget = budget;
    if (timeline !== undefined) request.timeline = timeline;
    if (developerBrief !== undefined) request.developerBrief = developerBrief;

    // Explicit release / hold for developer-owned requests
    if (action === 'release_to_developer' || reviewStatus === 'released_to_developer') {
      if (request.ownership !== 'developer' || !request.developerId) {
        return sendError(res, 'Only developer-owned requests can be released', 400);
      }
      if (!request.developerBrief?.trim()) {
        request.developerBrief =
          request.additionalRequirements ||
          `Customization for ${request.projectTitle}. Modules: ${(request.selectedModules || []).join(', ')}`;
      }
      request.reviewStatus = 'released_to_developer';
      request.releasedAt = new Date();
      request.releasedBy = req.user._id;
      if (request.status === 'new') request.status = 'contacted';
    } else if (action === 'hold' || reviewStatus === 'held') {
      request.reviewStatus = 'held';
    } else if (reviewStatus) {
      request.reviewStatus = reviewStatus;
    }

    await request.save();
    sendSuccess(res, request, 'Request updated');
  } catch (error) {
    next(error);
  }
};

const exportCustomizationsExcel = async (req, res, next) => {
  try {
    const filter = buildCustomizationFilter(req.query);
    const rows = await CustomizationRequest.find(filter)
      .select(LIST_SELECT)
      .sort({ createdAt: -1 })
      .limit(MAX_EXPORT)
      .lean();

    await sendExcel(res, {
      filename: `customization-leads-${Date.now()}.xlsx`,
      sheetName: 'Customizations',
      columns: [
        { header: 'Lead ID', key: 'leadId', width: 14 },
        { header: 'Ownership', key: 'ownership', width: 12 },
        { header: 'Review', key: 'reviewStatus', width: 18 },
        { header: 'Name', key: 'name', width: 22 },
        { header: 'Company', key: 'company', width: 22 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Mobile', key: 'mobile', width: 16 },
        { header: 'Project', key: 'projectTitle', width: 28 },
        { header: 'Modules', key: 'modules', width: 28 },
        { header: 'Requirements', key: 'additionalRequirements', width: 32 },
        { header: 'Dev Brief', key: 'developerBrief', width: 32 },
        { header: 'Budget', key: 'budget', width: 18 },
        { header: 'Timeline', key: 'timeline', width: 14 },
        { header: 'Status', key: 'status', width: 16 },
        { header: 'Admin Notes', key: 'adminNotes', width: 30 },
        { header: 'Created At', key: 'createdAt', width: 20 },
      ],
      rows: rows.map((r) => ({
        leadId: r.leadId,
        ownership: r.ownership || 'platform',
        reviewStatus: r.reviewStatus || '',
        name: r.name,
        company: r.company || '',
        email: r.email,
        mobile: r.mobile,
        projectTitle: r.projectTitle || '',
        modules: (r.selectedModules || []).join(', '),
        additionalRequirements: r.additionalRequirements || '',
        developerBrief: r.developerBrief || '',
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
  createCustomizationRequest,
  getAdminCustomizationRequests,
  getAdminCustomizationById,
  updateCustomizationStatus,
  exportCustomizationsExcel,
};
