const Project = require('../models/Project');
const Transaction = require('../models/Transaction');
const Quotation = require('../models/Quotation');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { canViewRole } = require('../middleware/role.middleware');

const getProjectOpsDetail = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('developerId', 'name email phone role status verificationStatus commissionRate profile')
      .populate('category', 'name slug')
      .populate('createdBy', 'name email role')
      .lean();
    if (!project) return sendError(res, 'Project not found', 404);

    if (
      project.developerId &&
      !canViewRole(req.user.role, 'developer') &&
      req.user.role !== 'super_admin'
    ) {
      // support/admin can view developers — canViewRole covers this
    }

    const paidQuotes = await Quotation.find({
      projectId: project._id,
      status: { $in: ['paid', 'partially_paid'] },
    })
      .select('_id')
      .lean();
    const quoteIds = paidQuotes.map((q) => q._id);

    const paidTx = await Transaction.find({
      status: 'paid',
      quotationId: { $in: quoteIds },
    })
      .populate('clientId', 'name email')
      .populate('quotationId', 'quotationId title leadType total')
      .sort({ paidAt: -1 })
      .lean();

    let grossSales = 0;
    let platformCommission = 0;
    let developerShare = 0;
    const buyers = {};
    paidTx.forEach((t) => {
      grossSales += Number(t.amount) || 0;
      platformCommission += Number(t.platformCommission) || 0;
      developerShare += Number(t.developerShare) || 0;
      const cid = String(t.clientId?._id || t.clientId || '');
      if (cid) {
        if (!buyers[cid]) {
          buyers[cid] = {
            clientId: cid,
            name: t.clientId?.name || 'Client',
            email: t.clientId?.email || '',
            orders: 0,
            spent: 0,
          };
        }
        buyers[cid].orders += 1;
        buyers[cid].spent += Number(t.amount) || 0;
      }
    });

    let siblingProjects = [];
    if (project.developerId?._id || project.developerId) {
      const devId = project.developerId._id || project.developerId;
      siblingProjects = await Project.find({
        developerId: devId,
        _id: { $ne: project._id },
      })
        .select('title slug status featured price ratingAvg createdAt')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    }

    const monthly = {};
    paidTx.forEach((t) => {
      const d = t.paidAt || t.createdAt;
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthly[key] = (monthly[key] || 0) + (Number(t.amount) || 0);
    });

    sendSuccess(
      res,
      {
        project,
        creator: project.createdBy,
        developer: project.developerId,
        sales: {
          orders: paidTx.length,
          grossSales,
          platformCommission,
          developerShare,
          buyers: Object.values(buyers),
          transactions: paidTx,
          monthlyChart: Object.entries(monthly)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, amount]) => ({ month, amount })),
        },
        siblingProjects,
      },
      'Project ops detail fetched'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { getProjectOpsDetail };
