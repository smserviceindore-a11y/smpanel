const Project = require('../models/Project');
const Requirement = require('../models/Requirement');
const CustomizationRequest = require('../models/CustomizationRequest');
const Category = require('../models/Category');
const User = require('../models/User');
const Quotation = require('../models/Quotation');
const Invoice = require('../models/Invoice');
const Transaction = require('../models/Transaction');
const ContactMessage = require('../models/ContactMessage');
const mongoose = require('mongoose');
const { sendSuccess, sendPaginated, sendError } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { buildDateRangeFilter, MAX_EXPORT } = require('../utils/queryHelpers');
const { sendMasterDashboardExcel } = require('../utils/excelExport');


const toMap = (rows) => Object.fromEntries(rows.map((r) => [r._id || 'unknown', r.count]));

const monthLabel = (y, m) =>
  new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });

/** Shared report filters from query string */
const parseReportFilters = async (query = {}) => {
  const dateFilter = buildDateRangeFilter(query);
  const category = query.category && String(query.category).trim();
  const ownerType = query.ownerType && String(query.ownerType).trim();
  const projectStatus = query.projectStatus && String(query.projectStatus).trim();
  const industry = query.industry && String(query.industry).trim();
  const leadStatus = query.leadStatus && String(query.leadStatus).trim();

  const projectFilter = { ...dateFilter };
  if (category && mongoose.isValidObjectId(category)) {
    projectFilter.category = new mongoose.Types.ObjectId(category);
  }
  if (ownerType && ['company', 'developer'].includes(ownerType)) {
    projectFilter.ownerType = ownerType;
  }
  if (projectStatus) projectFilter.status = projectStatus;
  if (industry) {
    projectFilter.industry = new RegExp(
      `^${industry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
      'i'
    );
  }

  const leadFilter = { ...dateFilter };
  if (leadStatus) leadFilter.status = leadStatus;

  let customizationFilter = { ...leadFilter };
  if (category || ownerType || projectStatus || industry) {
    const ids = await Project.find(projectFilter).select('_id').lean();
    const projectIds = ids.map((p) => p._id);
    customizationFilter = {
      ...leadFilter,
      ...(projectIds.length
        ? { projectId: { $in: projectIds } }
        : { projectId: { $exists: false } }),
    };
  }

  return {
    projectFilter,
    leadFilter,
    customizationFilter,
    dateFilter,
    applied: {
      dateFrom: query.dateFrom || query.from || '',
      dateTo: query.dateTo || query.to || '',
      category: category || '',
      ownerType: ownerType || '',
      projectStatus: projectStatus || '',
      industry: industry || '',
      leadStatus: leadStatus || '',
    },
  };
};

const buildMonthlyTrend = (monthlyProjects, monthlyRequirements, monthlyCustomizations) => {
  const keys = new Set();
  [...monthlyProjects, ...monthlyRequirements, ...monthlyCustomizations].forEach((r) => {
    keys.add(`${r._id.y}-${r._id.m}`);
  });
  return [...keys]
    .sort()
    .map((key) => {
      const [y, m] = key.split('-').map(Number);
      const find = (arr) => arr.find((r) => r._id.y === y && r._id.m === m)?.count || 0;
      return {
        label: monthLabel(y, m),
        projects: find(monthlyProjects),
        requirements: find(monthlyRequirements),
        customizations: find(monthlyCustomizations),
      };
    });
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalProjects,
      publishedProjects,
      featuredProjects,
      draftProjects,
      companyProjects,
      developerProjects,
      totalCategories,
      totalRequirements,
      newRequirements,
      contactedRequirements,
      totalCustomizations,
      newCustomizations,
      pendingDevelopers,
      totalDevelopers,
      totalClients,
      recentRequirements,
      recentCustomizations,
      topProjects,
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: { $in: ['published', 'featured'] } }),
      Project.countDocuments({ featured: true }),
      Project.countDocuments({ status: 'draft' }),
      Project.countDocuments({ ownerType: 'company' }),
      Project.countDocuments({ ownerType: 'developer' }),
      Category.countDocuments({ isActive: true }),
      Requirement.countDocuments(),
      Requirement.countDocuments({ status: 'new' }),
      Requirement.countDocuments({ status: 'contacted' }),
      CustomizationRequest.countDocuments(),
      CustomizationRequest.countDocuments({ status: 'new' }),
      User.countDocuments({ role: 'developer', verificationStatus: 'pending' }),
      User.countDocuments({ role: 'developer' }),
      User.countDocuments({ role: 'client' }),
      Requirement.find().sort({ createdAt: -1 }).limit(6).select('leadId name company email status industry createdAt'),
      CustomizationRequest.find().sort({ createdAt: -1 }).limit(6).select('leadId name projectTitle status budget createdAt'),
      Project.find({ status: { $in: ['published', 'featured'] } })
        .sort({ views: -1 })
        .limit(5)
        .select('title slug views ownerType featured status'),
    ]);

    sendSuccess(
      res,
      {
        projects: {
          total: totalProjects,
          published: publishedProjects,
          featured: featuredProjects,
          draft: draftProjects,
          company: companyProjects,
          developer: developerProjects,
        },
        categories: { total: totalCategories },
        leads: {
          requirements: {
            total: totalRequirements,
            new: newRequirements,
            contacted: contactedRequirements,
          },
          customizations: {
            total: totalCustomizations,
            new: newCustomizations,
          },
        },
        developers: {
          total: totalDevelopers,
          pendingApproval: pendingDevelopers,
        },
        clients: { total: totalClients },
        recent: {
          requirements: recentRequirements,
          customizations: recentCustomizations,
          topProjects,
        },
        permissions: [
          'manage_projects',
          'manage_categories',
          'manage_leads',
          'verify_developers',
          'view_ops_analytics',
        ],
      },
      'Admin dashboard fetched'
    );
  } catch (error) {
    next(error);
  }
};

const getDevelopers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const filter = { role: 'developer' };
    if (req.query.verificationStatus) filter.verificationStatus = req.query.verificationStatus;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const { escapeRegex } = require('../utils/excelExport');
      const q = escapeRegex(String(req.query.search).trim());
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { phone: new RegExp(q, 'i') },
      ];
    }

    const [developers, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password')
        .lean(),
      User.countDocuments(filter),
    ]);

    const ids = developers.map((d) => d._id);
    const countRows =
      ids.length === 0
        ? []
        : await Project.aggregate([
            { $match: { developerId: { $in: ids } } },
            { $group: { _id: '$developerId', count: { $sum: 1 } } },
          ]);
    const countMap = Object.fromEntries(countRows.map((r) => [String(r._id), r.count]));

    const withCounts = developers.map((dev) => ({
      id: dev._id,
      name: dev.name,
      email: dev.email,
      phone: dev.phone,
      status: dev.status,
      verificationStatus: dev.verificationStatus,
      profile: dev.profile,
      commissionRate: dev.commissionRate,
      projectCount: countMap[String(dev._id)] || 0,
      createdAt: dev.createdAt,
    }));

    sendPaginated(res, withCounts, buildPaginationMeta(total, page, limit), 'Developers fetched');
  } catch (error) {
    next(error);
  }
};

const updateDeveloperVerification = async (req, res, next) => {
  try {
    const { verificationStatus, status } = req.body;
    const user = await User.findOne({ _id: req.params.id, role: 'developer' });
    if (!user) return sendError(res, 'Developer not found', 404);

    if (verificationStatus) user.verificationStatus = verificationStatus;
    if (status) user.status = status;
    await user.save();

    sendSuccess(
      res,
      {
        id: user._id,
        name: user.name,
        email: user.email,
        verificationStatus: user.verificationStatus,
        status: user.status,
      },
      'Developer updated'
    );
  } catch (error) {
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    const { projectFilter, leadFilter, customizationFilter, dateFilter, applied } =
      await parseReportFilters(req.query);

    const trendStart = dateFilter.createdAt?.$gte
      ? dateFilter.createdAt.$gte
      : new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1);
    const withTrendStart = (base) => ({
      ...base,
      createdAt: {
        ...(base.createdAt || {}),
        $gte: trendStart,
        ...(dateFilter.createdAt?.$lte ? { $lte: dateFilter.createdAt.$lte } : {}),
      },
    });

    const [
      projectsByStatus,
      projectsByOwner,
      projectsByCategory,
      requirementsByStatus,
      customizationsByStatus,
      topProjects,
      recentWon,
      monthlyProjects,
      monthlyRequirements,
      monthlyCustomizations,
      totalViews,
      categories,
      industries,
      projectCount,
    ] = await Promise.all([
      Project.aggregate([
        { $match: projectFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Project.aggregate([
        { $match: projectFilter },
        { $group: { _id: '$ownerType', count: { $sum: 1 } } },
      ]),
      Project.aggregate([
        { $match: projectFilter },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'cat',
          },
        },
        { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
        { $group: { _id: { $ifNull: ['$cat.name', 'Uncategorized'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Requirement.aggregate([
        { $match: leadFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      CustomizationRequest.aggregate([
        { $match: customizationFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Project.find({
        ...projectFilter,
        ...(projectFilter.status ? {} : { status: { $in: ['published', 'featured'] } }),
      })
        .sort({ views: -1 })
        .limit(10)
        .populate('category', 'name')
        .select(
          'title slug views ownerType status featured screenshots industry category createdAt'
        ),
      Requirement.find({ ...leadFilter, status: 'won' })
        .sort({ updatedAt: -1 })
        .limit(8)
        .select('leadId name company budget status updatedAt createdAt'),
      Project.aggregate([
        { $match: withTrendStart(projectFilter) },
        {
          $group: {
            _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.y': 1, '_id.m': 1 } },
      ]),
      Requirement.aggregate([
        { $match: withTrendStart(leadFilter) },
        {
          $group: {
            _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.y': 1, '_id.m': 1 } },
      ]),
      CustomizationRequest.aggregate([
        { $match: withTrendStart(customizationFilter) },
        {
          $group: {
            _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.y': 1, '_id.m': 1 } },
      ]),
      Project.aggregate([
        { $match: projectFilter },
        { $group: { _id: null, views: { $sum: '$views' } } },
      ]),
      Category.find({ isActive: true }).sort({ name: 1 }).select('name').lean(),
      Project.distinct('industry', { industry: { $nin: [null, ''] } }),
      Project.countDocuments(projectFilter),
    ]);

    const reqMap = toMap(requirementsByStatus);
    const custMap = toMap(customizationsByStatus);
    const won = (reqMap.won || 0) + (custMap.won || 0);
    const totalLeads =
      Object.values(reqMap).reduce((a, b) => a + b, 0) +
      Object.values(custMap).reduce((a, b) => a + b, 0);

    sendSuccess(
      res,
      {
        generatedAt: new Date().toISOString(),
        filters: applied,
        filterOptions: {
          categories: categories.map((c) => ({ id: String(c._id), name: c.name })),
          industries: (industries || []).filter(Boolean).sort(),
          ownerTypes: ['company', 'developer'],
          projectStatuses: ['draft', 'published', 'featured', 'archived'],
          leadStatuses: [
            'new',
            'contacted',
            'requirement_discussed',
            'demo_given',
            'quotation_sent',
            'negotiation',
            'won',
            'lost',
          ],
        },
        summary: {
          totalProjects: projectCount,
          totalViews: totalViews[0]?.views || 0,
          totalLeads,
          wonDeals: won,
          conversionRate: totalLeads > 0 ? Math.round((won / totalLeads) * 100) : 0,
        },
        projectsByStatus: toMap(projectsByStatus),
        projectsByOwner: toMap(projectsByOwner),
        projectsByCategory: toMap(projectsByCategory),
        requirementsByStatus: reqMap,
        customizationsByStatus: custMap,
        monthlyTrend: buildMonthlyTrend(
          monthlyProjects,
          monthlyRequirements,
          monthlyCustomizations
        ),
        topProjects,
        recentWon,
      },
      'Reports fetched'
    );
  } catch (error) {
    next(error);
  }
};

const exportMasterReportsExcel = async (req, res, next) => {
  try {
    const { projectFilter, leadFilter, customizationFilter, dateFilter, applied } =
      await parseReportFilters(req.query);
    const moneyFilter = { ...dateFilter };

    const [
      projects,
      requirements,
      customizations,
      quotations,
      invoices,
      transactions,
      contacts,
      projectsByStatus,
      projectsByOwner,
      projectsByCategory,
      requirementsByStatus,
      customizationsByStatus,
      totalViews,
    ] = await Promise.all([
      Project.find(projectFilter)
        .sort({ createdAt: -1 })
        .limit(MAX_EXPORT)
        .populate('category', 'name')
        .populate('developerId', 'name email')
        .select(
          'title slug status ownerType industry views featured price createdAt category developerId'
        )
        .lean(),
      Requirement.find(leadFilter)
        .sort({ createdAt: -1 })
        .limit(MAX_EXPORT)
        .select('leadId name email mobile company industry projectType budget status createdAt')
        .lean(),
      CustomizationRequest.find(customizationFilter)
        .sort({ createdAt: -1 })
        .limit(MAX_EXPORT)
        .populate('projectId', 'title')
        .populate('developerId', 'name email')
        .select(
          'leadId name email mobile status projectTitle ownership reviewStatus developerQuoteAmount createdAt projectId developerId'
        )
        .lean(),
      Quotation.find(moneyFilter)
        .sort({ createdAt: -1 })
        .limit(MAX_EXPORT)
        .populate('clientId', 'name email')
        .populate('projectId', 'title')
        .select(
          'quotationId title status total paidAmount leadType clientName clientEmail clientId projectId createdAt'
        )
        .lean(),
      Invoice.find(moneyFilter)
        .sort({ createdAt: -1 })
        .limit(MAX_EXPORT)
        .populate('clientId', 'name email')
        .select('invoiceId title status total clientName clientEmail createdAt clientId')
        .lean(),
      Transaction.find(moneyFilter)
        .sort({ createdAt: -1 })
        .limit(MAX_EXPORT)
        .populate('clientId', 'name email')
        .populate('developerId', 'name email')
        .select(
          'transactionId amount status platformCommission developerShare couponCode createdAt clientId developerId'
        )
        .lean(),
      ContactMessage.find(moneyFilter)
        .sort({ createdAt: -1 })
        .limit(MAX_EXPORT)
        .select('name email phone subject status createdAt')
        .lean(),
      Project.aggregate([
        { $match: projectFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Project.aggregate([
        { $match: projectFilter },
        { $group: { _id: '$ownerType', count: { $sum: 1 } } },
      ]),
      Project.aggregate([
        { $match: projectFilter },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'cat',
          },
        },
        { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
        { $group: { _id: { $ifNull: ['$cat.name', 'Uncategorized'] }, count: { $sum: 1 } } },
      ]),
      Requirement.aggregate([
        { $match: leadFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      CustomizationRequest.aggregate([
        { $match: customizationFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Project.aggregate([
        { $match: projectFilter },
        { $group: { _id: null, views: { $sum: '$views' } } },
      ]),
    ]);

    const reqMap = toMap(requirementsByStatus);
    const custMap = toMap(customizationsByStatus);
    const won = (reqMap.won || 0) + (custMap.won || 0);
    const totalLeads =
      Object.values(reqMap).reduce((a, b) => a + b, 0) +
      Object.values(custMap).reduce((a, b) => a + b, 0);
    const totalProjects = Object.values(toMap(projectsByStatus)).reduce((a, b) => a + b, 0);
    const conversionRate = totalLeads > 0 ? Math.round((won / totalLeads) * 100) : 0;
    const mapCountSheet = (rows) =>
      rows.map((r) => ({ key: r._id || 'unknown', count: r.count }));

    const trendStart = dateFilter.createdAt?.$gte
      ? dateFilter.createdAt.$gte
      : new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1);
    const withTrend = (base) => ({
      ...base,
      createdAt: {
        ...(base.createdAt || {}),
        $gte: trendStart,
        ...(dateFilter.createdAt?.$lte ? { $lte: dateFilter.createdAt.$lte } : {}),
      },
    });

    const [monthlyProjects, monthlyRequirements, monthlyCustomizations, categoryDoc] =
      await Promise.all([
        Project.aggregate([
          { $match: withTrend(projectFilter) },
          {
            $group: {
              _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.y': 1, '_id.m': 1 } },
        ]),
        Requirement.aggregate([
          { $match: withTrend(leadFilter) },
          {
            $group: {
              _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.y': 1, '_id.m': 1 } },
        ]),
        CustomizationRequest.aggregate([
          { $match: withTrend(customizationFilter) },
          {
            $group: {
              _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.y': 1, '_id.m': 1 } },
        ]),
        applied.category
          ? Category.findById(applied.category).select('name').lean()
          : Promise.resolve(null),
      ]);

    await sendMasterDashboardExcel(res, {
      filename: `master-reports-${Date.now()}.xlsx`,
      applied,
      categoryName: categoryDoc?.name || '',
      summary: {
        totalProjects,
        totalViews: totalViews[0]?.views || 0,
        totalLeads,
        wonDeals: won,
        conversionRate,
      },
      byStatus: mapCountSheet(projectsByStatus),
      byOwner: mapCountSheet(projectsByOwner),
      byCategory: mapCountSheet(projectsByCategory),
      reqStatus: mapCountSheet(requirementsByStatus),
      custStatus: mapCountSheet(customizationsByStatus),
      monthlyTrend: buildMonthlyTrend(
        monthlyProjects,
        monthlyRequirements,
        monthlyCustomizations
      ),
      detailSheets: [
        {
          name: 'Projects by Status',
          columns: [
            { header: 'Status', key: 'key', width: 22 },
            { header: 'Count', key: 'count', width: 12 },
          ],
          rows: mapCountSheet(projectsByStatus),
        },
        {
          name: 'Projects by Owner',
          columns: [
            { header: 'Owner', key: 'key', width: 22 },
            { header: 'Count', key: 'count', width: 12 },
          ],
          rows: mapCountSheet(projectsByOwner),
        },
        {
          name: 'Projects by Category',
          columns: [
            { header: 'Category', key: 'key', width: 28 },
            { header: 'Count', key: 'count', width: 12 },
          ],
          rows: mapCountSheet(projectsByCategory),
        },
        {
          name: 'Requirements Status',
          columns: [
            { header: 'Status', key: 'key', width: 22 },
            { header: 'Count', key: 'count', width: 12 },
          ],
          rows: mapCountSheet(requirementsByStatus),
        },
        {
          name: 'Customizations Status',
          columns: [
            { header: 'Status', key: 'key', width: 24 },
            { header: 'Count', key: 'count', width: 12 },
          ],
          rows: mapCountSheet(customizationsByStatus),
        },
        {
          name: 'Projects',
          columns: [
            { header: 'Title', key: 'title', width: 34 },
            { header: 'Slug', key: 'slug', width: 24 },
            { header: 'Status', key: 'status', width: 14 },
            { header: 'Owner', key: 'ownerType', width: 12 },
            { header: 'Category', key: 'category', width: 18 },
            { header: 'Industry', key: 'industry', width: 16 },
            { header: 'Views', key: 'views', width: 10 },
            { header: 'Price', key: 'price', width: 14 },
            { header: 'Developer', key: 'developer', width: 22 },
            { header: 'Created', key: 'createdAt', width: 20 },
          ],
          rows: projects.map((p) => ({
            title: p.title,
            slug: p.slug,
            status: p.status,
            ownerType: p.ownerType,
            category: p.category?.name || '',
            industry: p.industry || '',
            views: p.views || 0,
            price: p.price?.amount ?? p.price?.displayText ?? '',
            developer: p.developerId?.name || p.developerId?.email || '',
            createdAt: p.createdAt ? new Date(p.createdAt).toLocaleString('en-IN') : '',
          })),
        },
        {
          name: 'Requirements',
          columns: [
            { header: 'Lead ID', key: 'leadId', width: 14 },
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Email', key: 'email', width: 26 },
            { header: 'Mobile', key: 'mobile', width: 14 },
            { header: 'Company', key: 'company', width: 18 },
            { header: 'Industry', key: 'industry', width: 16 },
            { header: 'Type', key: 'projectType', width: 14 },
            { header: 'Budget', key: 'budget', width: 14 },
            { header: 'Status', key: 'status', width: 14 },
            { header: 'Created', key: 'createdAt', width: 20 },
          ],
          rows: requirements.map((r) => ({
            leadId: r.leadId,
            name: r.name,
            email: r.email,
            mobile: r.mobile,
            company: r.company || '',
            industry: r.industry || '',
            projectType: r.projectType || '',
            budget: r.budget || '',
            status: r.status,
            createdAt: r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : '',
          })),
        },
        {
          name: 'Customizations',
          columns: [
            { header: 'Lead ID', key: 'leadId', width: 14 },
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Email', key: 'email', width: 26 },
            { header: 'Project', key: 'project', width: 28 },
            { header: 'Ownership', key: 'ownership', width: 12 },
            { header: 'Review', key: 'reviewStatus', width: 18 },
            { header: 'Dev quote', key: 'quote', width: 12 },
            { header: 'Developer', key: 'developer', width: 20 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Created', key: 'createdAt', width: 20 },
          ],
          rows: customizations.map((c) => ({
            leadId: c.leadId,
            name: c.name,
            email: c.email,
            project: c.projectTitle || c.projectId?.title || '',
            ownership: c.ownership || '',
            reviewStatus: c.reviewStatus || '',
            quote: c.developerQuoteAmount || '',
            developer: c.developerId?.name || c.developerId?.email || '',
            status: c.status,
            createdAt: c.createdAt ? new Date(c.createdAt).toLocaleString('en-IN') : '',
          })),
        },
        {
          name: 'Quotations',
          columns: [
            { header: 'Quotation ID', key: 'quotationId', width: 16 },
            { header: 'Title', key: 'title', width: 28 },
            { header: 'Client', key: 'client', width: 22 },
            { header: 'Project', key: 'project', width: 24 },
            { header: 'Lead type', key: 'leadType', width: 14 },
            { header: 'Total', key: 'total', width: 12 },
            { header: 'Paid', key: 'paid', width: 12 },
            { header: 'Status', key: 'status', width: 14 },
            { header: 'Created', key: 'createdAt', width: 20 },
          ],
          rows: quotations.map((q) => ({
            quotationId: q.quotationId,
            title: q.title || '',
            client: q.clientName || q.clientId?.name || q.clientId?.email || '',
            project: q.projectId?.title || '',
            leadType: q.leadType || '',
            total: q.total || 0,
            paid: q.paidAmount || 0,
            status: q.status,
            createdAt: q.createdAt ? new Date(q.createdAt).toLocaleString('en-IN') : '',
          })),
        },
        {
          name: 'Invoices',
          columns: [
            { header: 'Invoice ID', key: 'invoiceId', width: 16 },
            { header: 'Title', key: 'title', width: 28 },
            { header: 'Client', key: 'client', width: 24 },
            { header: 'Email', key: 'email', width: 26 },
            { header: 'Amount', key: 'amount', width: 12 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Created', key: 'createdAt', width: 20 },
          ],
          rows: invoices.map((inv) => ({
            invoiceId: inv.invoiceId,
            title: inv.title || '',
            client: inv.clientName || inv.clientId?.name || '',
            email: inv.clientEmail || inv.clientId?.email || '',
            amount: inv.total || 0,
            status: inv.status,
            createdAt: inv.createdAt ? new Date(inv.createdAt).toLocaleString('en-IN') : '',
          })),
        },
        {
          name: 'Transactions',
          columns: [
            { header: 'Txn ID', key: 'transactionId', width: 16 },
            { header: 'Amount', key: 'amount', width: 12 },
            { header: 'Commission', key: 'commission', width: 12 },
            { header: 'Dev share', key: 'share', width: 12 },
            { header: 'Client', key: 'client', width: 22 },
            { header: 'Developer', key: 'developer', width: 22 },
            { header: 'Coupon', key: 'coupon', width: 12 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Created', key: 'createdAt', width: 20 },
          ],
          rows: transactions.map((t) => ({
            transactionId: t.transactionId,
            amount: t.amount || 0,
            commission: t.platformCommission || 0,
            share: t.developerShare || 0,
            client: t.clientId?.name || t.clientId?.email || '',
            developer: t.developerId?.name || t.developerId?.email || '',
            coupon: t.couponCode || '',
            status: t.status,
            createdAt: t.createdAt ? new Date(t.createdAt).toLocaleString('en-IN') : '',
          })),
        },
        {
          name: 'Contacts',
          columns: [
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Email', key: 'email', width: 26 },
            { header: 'Phone', key: 'phone', width: 14 },
            { header: 'Subject', key: 'subject', width: 28 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Created', key: 'createdAt', width: 20 },
          ],
          rows: contacts.map((m) => ({
            name: m.name,
            email: m.email,
            phone: m.phone || '',
            subject: m.subject || '',
            status: m.status,
            createdAt: m.createdAt ? new Date(m.createdAt).toLocaleString('en-IN') : '',
          })),
        },
      ],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getDevelopers,
  updateDeveloperVerification,
  getReports,
  exportMasterReportsExcel,
};
