const Quotation = require('../models/Quotation');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Project = require('../models/Project');
const CustomizationRequest = require('../models/CustomizationRequest');
const Requirement = require('../models/Requirement');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { sendEmail } = require('../utils/mailer');

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const getAnalyticsSummary = async (req, res, next) => {
  try {
    const since7 = daysAgo(7);
    const since30 = daysAgo(30);

    const [
      paidTx7,
      paidTx30,
      invoices30,
      quotesSent,
      quotesAbandoned,
      newClients7,
      projectsLive,
      customizationsOpen,
      requirementsOpen,
    ] = await Promise.all([
      Transaction.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: since7 } } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { status: 'paid', paidAt: { $gte: since30 } } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
      ]),
      Invoice.countDocuments({ createdAt: { $gte: since30 } }),
      Quotation.countDocuments({ status: 'sent', createdAt: { $gte: since30 } }),
      Quotation.countDocuments({
        status: 'sent',
        updatedAt: { $lte: daysAgo(3) },
        createdAt: { $gte: daysAgo(60) },
      }),
      User.countDocuments({ role: 'client', createdAt: { $gte: since7 } }),
      Project.countDocuments({ status: { $in: ['published', 'featured'] } }),
      CustomizationRequest.countDocuments({
        status: { $in: ['new', 'contacted', 'quotation_sent', 'negotiation'] },
      }),
      Requirement.countDocuments({
        status: { $in: ['new', 'contacted', 'requirement_discussed', 'demo_given', 'quotation_sent', 'negotiation'] },
      }),
    ]);

    sendSuccess(
      res,
      {
        revenue7d: paidTx7[0]?.revenue || 0,
        payments7d: paidTx7[0]?.count || 0,
        revenue30d: paidTx30[0]?.revenue || 0,
        payments30d: paidTx30[0]?.count || 0,
        invoices30d: invoices30,
        quotesSent30d: quotesSent,
        abandonedQuotes: quotesAbandoned,
        newClients7d: newClients7,
        liveProjects: projectsLive,
        openCustomizations: customizationsOpen,
        openRequirements: requirementsOpen,
      },
      'Analytics summary'
    );
  } catch (error) {
    next(error);
  }
};

const listAbandonedQuotes = async (req, res, next) => {
  try {
    const days = Math.min(60, Math.max(1, Number(req.query.days) || 3));
    const { buildLeadSearchFilter, mergeFilters } = require('../utils/queryHelpers');
    const filter = mergeFilters(
      { status: 'sent', updatedAt: { $lte: daysAgo(days) } },
      buildLeadSearchFilter(req.query.search, [
        'quotationId',
        'title',
        'clientName',
        'clientEmail',
      ])
    );
    const rows = await Quotation.find(filter)
      .select('quotationId title clientName clientEmail total status createdAt updatedAt leadType')
      .sort({ updatedAt: 1 })
      .limit(200)
      .lean();
    sendSuccess(res, rows, 'Abandoned quotations');
  } catch (error) {
    next(error);
  }
};

const exportAbandonedQuotesExcel = async (req, res, next) => {
  try {
    const { sendExcel } = require('../utils/excelExport');
    const days = Math.min(60, Math.max(1, Number(req.query.days) || 3));
    const { buildLeadSearchFilter, mergeFilters } = require('../utils/queryHelpers');
    const filter = mergeFilters(
      { status: 'sent', updatedAt: { $lte: daysAgo(days) } },
      buildLeadSearchFilter(req.query.search, [
        'quotationId',
        'title',
        'clientName',
        'clientEmail',
      ])
    );
    const rows = await Quotation.find(filter).sort({ updatedAt: 1 }).limit(5000).lean();
    await sendExcel(res, {
      filename: `abandoned-quotes-${Date.now()}.xlsx`,
      sheetName: 'Abandoned',
      columns: [
        { header: 'Quotation ID', key: 'quotationId', width: 16 },
        { header: 'Title', key: 'title', width: 32 },
        { header: 'Client', key: 'clientName', width: 20 },
        { header: 'Email', key: 'clientEmail', width: 28 },
        { header: 'Total', key: 'total', width: 12 },
        { header: 'Lead type', key: 'leadType', width: 12 },
        { header: 'Created', key: 'createdAt', width: 14 },
        { header: 'Updated', key: 'updatedAt', width: 14 },
      ],
      rows: rows.map((r) => ({
        quotationId: r.quotationId,
        title: r.title,
        clientName: r.clientName,
        clientEmail: r.clientEmail,
        total: r.total,
        leadType: r.leadType,
        createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '',
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('en-IN') : '',
      })),
    });
  } catch (error) {
    next(error);
  }
};

const remindAbandonedQuotes = async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const days = Math.min(60, Math.max(1, Number(req.body?.days) || 3));
    const filter =
      ids.length > 0
        ? { _id: { $in: ids }, status: 'sent' }
        : { status: 'sent', updatedAt: { $lte: daysAgo(days) } };

    const rows = await Quotation.find(filter).limit(50).lean();
    let sent = 0;
    for (const q of rows) {
      if (!q.clientEmail) continue;
      await sendEmail({
        to: q.clientEmail,
        subject: `Reminder: Quotation ${q.quotationId} awaiting your response`,
        text: `Hi ${q.clientName || 'there'},\n\nYour quotation "${q.title}" (₹${Number(
          q.total || 0
        ).toLocaleString('en-IN')}) is still open. Log in to your dashboard to review and pay.\n\n— SM Global Hub`,
      });
      sent += 1;
    }
    sendSuccess(res, { reminded: sent }, `Sent ${sent} reminder email(s)`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalyticsSummary,
  listAbandonedQuotes,
  exportAbandonedQuotesExcel,
  remindAbandonedQuotes,
};
