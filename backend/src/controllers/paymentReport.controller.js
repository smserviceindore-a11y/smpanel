const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { escapeRegex } = require('../utils/excelExport');

const parseDateRange = (query) => {
  const match = { status: 'paid' };
  if (query.status && query.status !== 'paid') {
    // allow viewing created/failed too when explicitly filtered
    match.status = query.status;
  }
  if (query.from || query.to) {
    match.paidAt = {};
    if (query.from) match.paidAt.$gte = new Date(query.from);
    if (query.to) {
      const end = new Date(query.to);
      end.setHours(23, 59, 59, 999);
      match.paidAt.$lte = end;
    }
  }
  if (query.developerId && mongoose.Types.ObjectId.isValid(query.developerId)) {
    match.developerId = new mongoose.Types.ObjectId(query.developerId);
  }
  return match;
};

const getPaymentReportSummary = async (req, res, next) => {
  try {
    const match = parseDateRange(req.query);

    const [agg] = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          grossSales: { $sum: '$amount' },
          platformCommission: { $sum: '$platformCommission' },
          developerShare: { $sum: '$developerShare' },
          companyOrders: {
            $sum: { $cond: [{ $ifNull: ['$developerId', false] }, 0, 1] },
          },
          developerOrders: {
            $sum: { $cond: [{ $ifNull: ['$developerId', false] }, 1, 0] },
          },
        },
      },
    ]);

    const byDeveloper = await Transaction.aggregate([
      { $match: { ...match, developerId: { $ne: null } } },
      {
        $group: {
          _id: '$developerId',
          orders: { $sum: 1 },
          grossSales: { $sum: '$amount' },
          platformCommission: { $sum: '$platformCommission' },
          developerShare: { $sum: '$developerShare' },
        },
      },
      { $sort: { grossSales: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'developer',
        },
      },
      { $unwind: { path: '$developer', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          developerId: '$_id',
          name: '$developer.name',
          email: '$developer.email',
          orders: 1,
          grossSales: 1,
          platformCommission: 1,
          developerShare: 1,
        },
      },
    ]);

    sendSuccess(
      res,
      {
        summary: {
          totalOrders: agg?.totalOrders || 0,
          grossSales: agg?.grossSales || 0,
          platformCommission: agg?.platformCommission || 0,
          developerShare: agg?.developerShare || 0,
          companyOrders: agg?.companyOrders || 0,
          developerOrders: agg?.developerOrders || 0,
        },
        topDevelopers: byDeveloper,
        filters: {
          from: req.query.from || null,
          to: req.query.to || null,
          status: match.status,
        },
      },
      'Payment report summary'
    );
  } catch (error) {
    next(error);
  }
};

const getDeveloperPaymentReports = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 12);
    const match = parseDateRange(req.query);
    match.developerId = { $ne: null };
    if (req.query.developerId && mongoose.Types.ObjectId.isValid(req.query.developerId)) {
      match.developerId = new mongoose.Types.ObjectId(req.query.developerId);
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$developerId',
          orders: { $sum: 1 },
          projectsSold: { $sum: 1 },
          grossSales: { $sum: '$amount' },
          platformCommission: { $sum: '$platformCommission' },
          developerShare: { $sum: '$developerShare' },
          lastPaidAt: { $max: '$paidAt' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'developer',
        },
      },
      { $unwind: { path: '$developer', preserveNullAndEmptyArrays: true } },
    ];

    if (req.query.search) {
      const q = escapeRegex(String(req.query.search).trim());
      pipeline.push({
        $match: {
          $or: [
            { 'developer.name': new RegExp(q, 'i') },
            { 'developer.email': new RegExp(q, 'i') },
          ],
        },
      });
    }

    pipeline.push({
      $facet: {
        rows: [
          { $sort: { grossSales: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              developerId: '$_id',
              name: '$developer.name',
              email: '$developer.email',
              orders: 1,
              projectsSold: 1,
              grossSales: 1,
              platformCommission: 1,
              developerShare: 1,
              lastPaidAt: 1,
              avgCommissionRate: {
                $cond: [
                  { $gt: ['$grossSales', 0] },
                  {
                    $round: [
                      { $multiply: [{ $divide: ['$platformCommission', '$grossSales'] }, 100] },
                      1,
                    ],
                  },
                  0,
                ],
              },
            },
          },
        ],
        totalCount: [{ $count: 'count' }],
        totals: [
          {
            $group: {
              _id: null,
              developers: { $sum: 1 },
              orders: { $sum: '$orders' },
              grossSales: { $sum: '$grossSales' },
              platformCommission: { $sum: '$platformCommission' },
              developerShare: { $sum: '$developerShare' },
            },
          },
        ],
      },
    });

    const [result] = await Transaction.aggregate(pipeline);
    const total = result?.totalCount?.[0]?.count || 0;

    sendPaginated(
      res,
      {
        developers: result?.rows || [],
        totals: result?.totals?.[0] || {
          developers: 0,
          orders: 0,
          grossSales: 0,
          platformCommission: 0,
          developerShare: 0,
        },
      },
      buildPaginationMeta(total, page, limit),
      'Developer payment reports'
    );
  } catch (error) {
    next(error);
  }
};

const getDeveloperPaymentDetail = async (req, res, next) => {
  try {
    const developerId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(developerId)) {
      return sendError(res, 'Invalid developer id', 400);
    }

    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const match = parseDateRange({ ...req.query, developerId });

    const developer = await User.findOne({ _id: developerId, role: 'developer' })
      .select('name email phone commissionRate verificationStatus')
      .lean();
    if (!developer) return sendError(res, 'Developer not found', 404);

    const [summary] = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          grossSales: { $sum: '$amount' },
          platformCommission: { $sum: '$platformCommission' },
          developerShare: { $sum: '$developerShare' },
        },
      },
    ]);

    const [txns, total] = await Promise.all([
      Transaction.find(match)
        .populate('quotationId', 'quotationId title')
        .populate('clientId', 'name email')
        .sort({ paidAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(match),
    ]);

    sendSuccess(
      res,
      {
        developer: {
          id: developer._id,
          name: developer.name,
          email: developer.email,
          phone: developer.phone,
          commissionRate: developer.commissionRate,
          verificationStatus: developer.verificationStatus,
        },
        summary: {
          orders: summary?.orders || 0,
          projectsSold: summary?.orders || 0,
          grossSales: summary?.grossSales || 0,
          platformCommission: summary?.platformCommission || 0,
          developerShare: summary?.developerShare || 0,
        },
        transactions: txns,
        pagination: buildPaginationMeta(total, page, limit),
      },
      'Developer payment detail'
    );
  } catch (error) {
    next(error);
  }
};

const getPaymentTransactions = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    else filter.status = 'paid';

    if (req.query.from || req.query.to) {
      filter.paidAt = {};
      if (req.query.from) filter.paidAt.$gte = new Date(req.query.from);
      if (req.query.to) {
        const end = new Date(req.query.to);
        end.setHours(23, 59, 59, 999);
        filter.paidAt.$lte = end;
      }
    }
    if (req.query.developerId === 'company') {
      filter.developerId = null;
    } else if (req.query.developerId && mongoose.Types.ObjectId.isValid(req.query.developerId)) {
      filter.developerId = req.query.developerId;
    }

    if (req.query.search) {
      const q = escapeRegex(String(req.query.search).trim());
      filter.transactionId = new RegExp(q, 'i');
    }

    const [rows, total] = await Promise.all([
      Transaction.find(filter)
        .populate('quotationId', 'quotationId title')
        .populate('developerId', 'name email')
        .populate('clientId', 'name email')
        .sort({ paidAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    sendPaginated(res, rows, buildPaginationMeta(total, page, limit), 'Payment transactions');
  } catch (error) {
    next(error);
  }
};

const exportPaymentTransactionsExcel = async (req, res, next) => {
  try {
    const { sendExcel } = require('../utils/excelExport');
    const { MAX_EXPORT } = require('../utils/queryHelpers');
    const match = parseDateRange({
      ...req.query,
      status: req.query.status || 'paid',
      from: req.query.from || req.query.dateFrom,
      to: req.query.to || req.query.dateTo,
    });
    const filter = { ...match };
    if (req.query.search) {
      const q = escapeRegex(String(req.query.search).trim());
      filter.$or = [
        { transactionId: new RegExp(q, 'i') },
        { couponCode: new RegExp(q, 'i') },
      ];
    }
    const rows = await Transaction.find(filter)
      .populate('quotationId', 'quotationId title')
      .populate('developerId', 'name email')
      .populate('clientId', 'name email')
      .sort({ paidAt: -1, createdAt: -1 })
      .limit(MAX_EXPORT)
      .lean();
    await sendExcel(res, {
      filename: `payment-report-${Date.now()}.xlsx`,
      sheetName: 'Payments',
      columns: [
        { header: 'Txn ID', key: 'transactionId', width: 16 },
        { header: 'Quotation', key: 'quotation', width: 16 },
        { header: 'Client', key: 'client', width: 24 },
        { header: 'Developer', key: 'developer', width: 22 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Platform', key: 'platformCommission', width: 12 },
        { header: 'Dev share', key: 'developerShare', width: 12 },
        { header: 'GST', key: 'gstAmount', width: 10 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Paid at', key: 'paidAt', width: 14 },
      ],
      rows: rows.map((r) => ({
        transactionId: r.transactionId,
        quotation: r.quotationId?.quotationId || '',
        client: r.clientId?.email || '',
        developer: r.developerId?.name || 'Platform',
        amount: r.amount,
        platformCommission: r.platformCommission || 0,
        developerShare: r.developerShare || 0,
        gstAmount: r.gstAmount || 0,
        status: r.status,
        paidAt: r.paidAt
          ? new Date(r.paidAt).toLocaleDateString('en-IN')
          : r.createdAt
            ? new Date(r.createdAt).toLocaleDateString('en-IN')
            : '',
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPaymentReportSummary,
  getDeveloperPaymentReports,
  getDeveloperPaymentDetail,
  getPaymentTransactions,
  exportPaymentTransactionsExcel,
};
