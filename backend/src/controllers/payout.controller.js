const PayoutRequest = require('../models/PayoutRequest');
const WalletLedger = require('../models/WalletLedger');
const generateBusinessId = require('../utils/generateBusinessId');
const { sendSuccess, sendPaginated, sendError } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const {
  getWalletSummary,
  debitAvailableForPayout,
  reserveAvailableForPayout,
  releasePayoutReservation,
  releaseMaturedHolds,
  getOrCreateWallet,
} = require('../services/wallet.service');
const { sendEmail } = require('../utils/mailer');

const createPayoutRequest = async (req, res, next) => {
  try {
    const { amount, method, details, notes } = req.body;
    const amt = Number(amount);
    if (!amt || amt <= 0) return sendError(res, 'Valid amount required', 400);
    if (!['upi', 'bank', 'paypal'].includes(method)) {
      return sendError(res, 'method must be upi, bank, or paypal', 400);
    }

    await releaseMaturedHolds(req.user._id);
    const wallet = await getOrCreateWallet(req.user._id);
    if (wallet.availableBalance < amt) {
      return sendError(
        res,
        `Insufficient available balance (₹${wallet.availableBalance}). Hold balance cannot be withdrawn yet.`,
        400
      );
    }

    // Fraud / velocity limits from Master Admin settings
    const payCfg = await require('../services/settings.service').getPaymentConfig({ force: true });
    const maxAmt = Number(payCfg.maxPayoutAmount) || 0;
    if (maxAmt > 0 && amt > maxAmt) {
      return sendError(
        res,
        `Payout amount exceeds platform limit of ₹${maxAmt.toLocaleString('en-IN')}`,
        400
      );
    }
    const maxPerDay = Number(payCfg.maxPayoutRequestsPerDay) || 3;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await PayoutRequest.countDocuments({
      developerId: req.user._id,
      createdAt: { $gte: since },
      status: { $nin: ['rejected'] },
    });
    if (recentCount >= maxPerDay) {
      return sendError(
        res,
        `Payout velocity limit: max ${maxPerDay} request(s) per 24 hours. Try again later.`,
        429
      );
    }

    if (method === 'upi' && !details?.upiId) return sendError(res, 'upiId required', 400);
    if (method === 'paypal' && !details?.paypalEmail) return sendError(res, 'paypalEmail required', 400);
    if (method === 'bank' && (!details?.accountNumber || !details?.ifsc || !details?.accountName)) {
      return sendError(res, 'accountName, accountNumber, ifsc required for bank', 400);
    }

    const payout = await PayoutRequest.create({
      payoutId: generateBusinessId('PO'),
      developerId: req.user._id,
      amount: amt,
      method,
      details: details || {},
      adminNotes: notes || '',
      status: 'pending',
    });

    try {
      await reserveAvailableForPayout({
        developerId: req.user._id,
        amount: amt,
        payoutId: payout._id,
        note: `Reserved for ${payout.payoutId}`,
      });
    } catch (e) {
      await PayoutRequest.findByIdAndDelete(payout._id);
      return sendError(res, e.message || 'Could not reserve wallet amount', e.statusCode || 400);
    }

    const walletAfter = await getOrCreateWallet(req.user._id);

    sendSuccess(
      res,
      {
        ...payout.toObject(),
        wallet: {
          availableBalance: walletAfter.availableBalance,
          reservedBalance: walletAfter.reservedBalance || 0,
          holdBalance: walletAfter.holdBalance,
        },
      },
      'Payout request submitted — amount reserved from available',
      201
    );
  } catch (error) {
    next(error);
  }
};

const listMyPayouts = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const filter = { developerId: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const [rows, total] = await Promise.all([
      PayoutRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PayoutRequest.countDocuments(filter),
    ]);

    sendPaginated(res, rows, buildPaginationMeta(total, page, limit), 'Payouts fetched');
  } catch (error) {
    next(error);
  }
};

const listAdminPayouts = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const { buildLeadSearchFilter, buildDateRangeFilter, mergeFilters } = require('../utils/queryHelpers');
    const parts = [];
    if (req.query.status) parts.push({ status: req.query.status });
    if (req.query.developerId) parts.push({ developerId: req.query.developerId });
    parts.push(buildLeadSearchFilter(req.query.search, ['payoutId', 'adminNotes']));
    parts.push(buildDateRangeFilter(req.query, 'createdAt'));
    const filter = mergeFilters(...parts);

    const [rows, total] = await Promise.all([
      PayoutRequest.find(filter)
        .populate('developerId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PayoutRequest.countDocuments(filter),
    ]);

    sendPaginated(res, rows, buildPaginationMeta(total, page, limit), 'Payouts fetched');
  } catch (error) {
    next(error);
  }
};

const exportAdminPayoutsExcel = async (req, res, next) => {
  try {
    const { sendExcel } = require('../utils/excelExport');
    const { MAX_EXPORT, buildLeadSearchFilter, buildDateRangeFilter, mergeFilters } = require('../utils/queryHelpers');
    const parts = [];
    if (req.query.status) parts.push({ status: req.query.status });
    if (req.query.developerId) parts.push({ developerId: req.query.developerId });
    parts.push(buildLeadSearchFilter(req.query.search, ['payoutId', 'adminNotes']));
    parts.push(buildDateRangeFilter(req.query, 'createdAt'));
    const filter = mergeFilters(...parts);
    const rows = await PayoutRequest.find(filter)
      .populate('developerId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(MAX_EXPORT)
      .lean();
    await sendExcel(res, {
      filename: `payouts-${Date.now()}.xlsx`,
      sheetName: 'Payouts',
      columns: [
        { header: 'Payout ID', key: 'payoutId', width: 14 },
        { header: 'Developer', key: 'developer', width: 22 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Method', key: 'method', width: 10 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Notes', key: 'adminNotes', width: 24 },
        { header: 'Date', key: 'createdAt', width: 14 },
      ],
      rows: rows.map((r) => ({
        payoutId: r.payoutId,
        developer: r.developerId?.name || '',
        email: r.developerId?.email || '',
        amount: r.amount,
        method: r.method,
        status: r.status,
        adminNotes: r.adminNotes || '',
        createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '',
      })),
    });
  } catch (error) {
    next(error);
  }
};

const reviewPayout = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    if (!['approved', 'rejected', 'paid'].includes(status)) {
      return sendError(res, 'status must be approved, rejected, or paid', 400);
    }

    const payout = await PayoutRequest.findById(req.params.id);
    if (!payout) return sendError(res, 'Payout not found', 404);
    if (['paid', 'rejected'].includes(payout.status)) {
      return sendError(res, `Payout already ${payout.status}`, 400);
    }

    if (status === 'rejected') {
      await releasePayoutReservation({
        developerId: payout.developerId,
        amount: payout.amount,
        payoutId: payout._id,
        note: `Payout ${payout.payoutId} rejected — reservation restored`,
      });
      payout.status = 'rejected';
      payout.adminNotes = adminNotes !== undefined ? adminNotes : payout.adminNotes;
      payout.reviewedBy = req.user._id;
      payout.reviewedAt = new Date();
      await payout.save();
      return sendSuccess(res, payout, 'Payout rejected — reserved amount returned to available');
    }

    if (status === 'approved') {
      payout.status = 'approved';
      payout.adminNotes = adminNotes !== undefined ? adminNotes : payout.adminNotes;
      payout.reviewedBy = req.user._id;
      payout.reviewedAt = new Date();
      await payout.save();
      return sendSuccess(res, payout, 'Payout approved');
    }

    // status === paid → debit wallet
    if (!['pending', 'approved'].includes(payout.status)) {
      return sendError(res, 'Invalid payout state for payment', 400);
    }

    try {
      await debitAvailableForPayout({
        developerId: payout.developerId,
        amount: payout.amount,
        payoutId: payout._id,
        note: `Payout ${payout.payoutId}`,
      });
    } catch (e) {
      return sendError(res, e.message || 'Wallet debit failed', e.statusCode || 400);
    }

    payout.status = 'paid';
    payout.paidAt = new Date();
    payout.reviewedBy = req.user._id;
    payout.reviewedAt = new Date();
    if (adminNotes !== undefined) payout.adminNotes = adminNotes;
    await payout.save();

    const User = require('../models/User');
    const developer = await User.findById(payout.developerId).select('email name').lean();
    if (developer?.email) {
      await sendEmail({
        to: developer.email,
        subject: `Payout released ${payout.payoutId}`,
        text: `Hi ${developer.name},\n\nPayout ${payout.payoutId} of ₹${payout.amount} has been marked paid via ${payout.method}.\n\n— SM Global Hub`,
      });
    }

    sendSuccess(res, payout, 'Payout marked paid and wallet debited');
  } catch (error) {
    next(error);
  }
};

const getDeveloperWalletReport = async (req, res, next) => {
  try {
    const summary = await getWalletSummary(req.user._id);
    const Project = require('../models/Project');
    const enriched = await Promise.all(
      (summary.byProject || []).map(async (row) => {
        const project = row._id
          ? await Project.findById(row._id).select('title slug').lean()
          : null;
        return {
          projectId: row._id,
          projectTitle: project?.title || 'General',
          totalEarned: row.credited || 0,
          hold: row.hold || 0,
          releasedOrPaid: row.availableLike || 0,
        };
      })
    );

    const recentLedger = await WalletLedger.find({ developerId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    sendSuccess(
      res,
      {
        wallet: {
          availableBalance: summary.availableBalance,
          holdBalance: summary.holdBalance,
          reservedBalance: summary.reservedBalance || 0,
          currency: summary.currency,
          refundHoldDays: summary.refundHoldDays,
        },
        byProject: enriched,
        recentLedger,
      },
      'Wallet report fetched'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPayoutRequest,
  listMyPayouts,
  listAdminPayouts,
  exportAdminPayoutsExcel,
  reviewPayout,
  getDeveloperWalletReport,
};
