const Quotation = require('../models/Quotation');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const Settlement = require('../models/Settlement');
const User = require('../models/User');
const Requirement = require('../models/Requirement');
const CustomizationRequest = require('../models/CustomizationRequest');
const generateBusinessId = require('../utils/generateBusinessId');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { sendEmail } = require('../utils/mailer');
const { buildDocumentPdf, buildTaxInvoicePdf, sendPdf } = require('../utils/pdf');
const { createPaymentOrder, verifyRazorpaySignature, hasRazorpay } = require('../utils/payments');
const { resolveTaxSplit, roundToInr, stateCodeFromGstin, extractInclusiveGst, allocateGstBear, scaleItemsToTaxable } = require('../utils/gst');

const calcTotals = (items = [], taxPercent = 18) => {
  const normalized = items.map((it) => {
    const quantity = Math.max(1, Number(it.quantity) || 1);
    // Accept unitAmount (canonical), unitPrice, or line amount (treated as unit when qty=1)
    let unitAmount = Number(it.unitAmount);
    if (!(unitAmount > 0)) unitAmount = Number(it.unitPrice);
    if (!(unitAmount > 0) && Number(it.amount) > 0) {
      unitAmount = quantity > 1 ? Number(it.amount) / quantity : Number(it.amount);
    }
    unitAmount = Math.max(0, unitAmount || 0);
    return {
      description: String(it.description || '').trim() || 'Item',
      quantity,
      unitAmount,
      amount: quantity * unitAmount,
    };
  });
  const subtotal = normalized.reduce((s, i) => s + i.amount, 0);
  // Customer is NOT charged GST on top — listed price is what they pay.
  // taxPercent is kept for invoice extraction + share GST bearing.
  return {
    items: normalized,
    subtotal,
    taxAmount: 0,
    total: subtotal,
    taxPercent: Number(taxPercent) || 0,
  };
};

const createQuotation = async (req, res, next) => {
  try {
    const {
      leadType = 'manual',
      requirementId,
      customizationId,
      projectId,
      developerId,
      clientId,
      clientName,
      clientEmail,
      clientPhone,
      clientCompany,
      clientAddress,
      clientGstin,
      title,
      items,
      taxPercent = 18,
      notes,
      validUntil,
      commissionRate,
      sendToClient,
      milestones: milestoneInput,
    } = req.body;

    if (!clientName || !clientEmail || !title) {
      return sendError(res, 'clientName, clientEmail and title are required', 400);
    }

    let rate = Number(commissionRate);
    if (Number.isNaN(rate) || rate < 0) {
      if (developerId) {
        const dev = await User.findById(developerId).select('commissionRate').lean();
        rate = dev?.commissionRate ?? 30;
      } else {
        rate = 30;
      }
    }

    const totals = calcTotals(items || [], taxPercent);
    if (!totals.items.length || !(totals.total > 0)) {
      return sendError(
        res,
        'Add at least one line item with unitAmount (or amount/unitPrice) greater than 0',
        400
      );
    }

    let milestones = [];
    if (Array.isArray(milestoneInput) && milestoneInput.length > 0) {
      milestones = milestoneInput.map((m, i) => ({
        key: m.key || `part_${i + 1}`,
        label: m.label || `Part ${i + 1}`,
        amount: Math.max(0, Number(m.amount) || 0),
        status: 'pending',
      }));
      const sum = milestones.reduce((s, m) => s + m.amount, 0);
      if (Math.abs(sum - totals.total) > 1) {
        return sendError(
          res,
          `Milestone amounts (₹${sum}) must equal quotation total (₹${totals.total})`,
          400
        );
      }
    } else {
      milestones = [
        {
          key: 'full',
          label: 'Full payment',
          amount: totals.total,
          status: 'pending',
        },
      ];
    }

    const quotation = await Quotation.create({
      quotationId: generateBusinessId('QT'),
      leadType,
      requirementId,
      customizationId,
      projectId,
      developerId: developerId || undefined,
      clientId: clientId || undefined,
      clientName,
      clientEmail: clientEmail.toLowerCase(),
      clientPhone,
      clientCompany,
      clientAddress: clientAddress || '',
      clientGstin: clientGstin ? String(clientGstin).trim().toUpperCase() : '',
      title,
      ...totals,
      taxPercent,
      milestones,
      paidAmount: 0,
      notes,
      validUntil: validUntil ? new Date(validUntil) : undefined,
      commissionRate: rate,
      status: sendToClient ? 'sent' : 'draft',
      createdBy: req.user._id,
    });
    if (sendToClient) {
      await sendEmail({
        to: quotation.clientEmail,
        subject: `Quotation ${quotation.quotationId} — ${quotation.title}`,
        text: `Hi ${quotation.clientName},\n\nYour quotation ${quotation.quotationId} for ${quotation.total} INR is ready.\nLogin to Client dashboard to accept and pay.\n\n— SM Global Hub`,
      });
    }

    sendSuccess(res, quotation, 'Quotation created', 201);
  } catch (error) {
    next(error);
  }
};

const listQuotations = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const { buildLeadSearchFilter, buildDateRangeFilter, mergeFilters } = require('../utils/queryHelpers');
    const filter = mergeFilters(
      req.query.status ? { status: req.query.status } : {},
      req.query.leadType ? { leadType: req.query.leadType } : {},
      buildLeadSearchFilter(req.query.search, [
        'quotationId',
        'title',
        'clientName',
        'clientEmail',
      ]),
      buildDateRangeFilter(req.query, 'createdAt')
    );

    const [rows, total] = await Promise.all([
      Quotation.find(filter)
        .select(
          'quotationId title clientName clientEmail status total currency commissionRate developerId projectId leadType createdAt paidAmount'
        )
        .populate('developerId', 'name email')
        .populate('projectId', 'title slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Quotation.countDocuments(filter),
    ]);

    sendPaginated(res, rows, buildPaginationMeta(total, page, limit), 'Quotations fetched');
  } catch (error) {
    next(error);
  }
};

const exportQuotationsExcel = async (req, res, next) => {
  try {
    const { sendExcel } = require('../utils/excelExport');
    const { MAX_EXPORT, buildLeadSearchFilter, buildDateRangeFilter, mergeFilters } = require('../utils/queryHelpers');
    const filter = mergeFilters(
      req.query.status ? { status: req.query.status } : {},
      req.query.leadType ? { leadType: req.query.leadType } : {},
      buildLeadSearchFilter(req.query.search, [
        'quotationId',
        'title',
        'clientName',
        'clientEmail',
      ]),
      buildDateRangeFilter(req.query, 'createdAt')
    );
    const rows = await Quotation.find(filter)
      .populate('developerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(MAX_EXPORT)
      .lean();
    await sendExcel(res, {
      filename: `quotations-${Date.now()}.xlsx`,
      sheetName: 'Quotations',
      columns: [
        { header: 'Quotation ID', key: 'quotationId', width: 16 },
        { header: 'Title', key: 'title', width: 32 },
        { header: 'Client', key: 'clientName', width: 20 },
        { header: 'Email', key: 'clientEmail', width: 28 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Lead type', key: 'leadType', width: 12 },
        { header: 'Total', key: 'total', width: 12 },
        { header: 'Paid', key: 'paidAmount', width: 12 },
        { header: 'Developer', key: 'developer', width: 20 },
        { header: 'Date', key: 'createdAt', width: 14 },
      ],
      rows: rows.map((r) => ({
        quotationId: r.quotationId,
        title: r.title,
        clientName: r.clientName,
        clientEmail: r.clientEmail,
        status: r.status,
        leadType: r.leadType,
        total: r.total,
        paidAmount: r.paidAmount || 0,
        developer: r.developerId?.name || '',
        createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '',
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getQuotationById = async (req, res, next) => {
  try {
    const q = await Quotation.findById(req.params.id)
      .populate('projectId', 'title slug')
      .populate('developerId', 'name email commissionRate')
      .populate('clientId', 'name email');
    if (!q) return sendError(res, 'Quotation not found', 404);
    sendSuccess(res, q, 'Quotation fetched');
  } catch (error) {
    next(error);
  }
};

const updateQuotation = async (req, res, next) => {
  try {
    const q = await Quotation.findById(req.params.id);
    if (!q) return sendError(res, 'Quotation not found', 404);
    if (['paid'].includes(q.status)) return sendError(res, 'Paid quotation cannot be edited', 400);

    const fields = [
      'title',
      'notes',
      'validUntil',
      'clientName',
      'clientEmail',
      'clientPhone',
      'clientCompany',
      'taxPercent',
      'commissionRate',
      'developerId',
      'projectId',
      'status',
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) q[f] = req.body[f];
    });

    if (req.body.items) {
      const totals = calcTotals(req.body.items, q.taxPercent);
      Object.assign(q, totals);
    }

    await q.save();
    sendSuccess(res, q, 'Quotation updated');
  } catch (error) {
    next(error);
  }
};

const sendQuotation = async (req, res, next) => {
  try {
    const q = await Quotation.findById(req.params.id);
    if (!q) return sendError(res, 'Quotation not found', 404);
    q.status = 'sent';
    await q.save();

    await sendEmail({
      to: q.clientEmail,
      subject: `Quotation ${q.quotationId} — ${q.title}`,
      text: `Hi ${q.clientName},\n\nQuotation ${q.quotationId} totaling ₹${q.total} is ready on SM Global Hub.\n\n— SM Global`,
    });

    sendSuccess(res, q, 'Quotation sent to client');
  } catch (error) {
    next(error);
  }
};

const downloadQuotationPdf = async (req, res, next) => {
  try {
    const q = await Quotation.findById(req.params.id).lean();
    if (!q) return sendError(res, 'Quotation not found', 404);
    if (req.user.role === 'client') {
      const owns =
        (q.clientId && String(q.clientId) === String(req.user._id)) ||
        q.clientEmail === req.user.email;
      if (!owns) return sendError(res, 'Forbidden', 403);
    }
    const buffer = await buildDocumentPdf({
      docType: 'Quotation',
      docId: q.quotationId,
      title: q.title,
      clientName: q.clientName,
      clientEmail: q.clientEmail,
      items: q.items,
      subtotal: q.subtotal,
      taxAmount: q.taxAmount,
      total: q.total,
      currency: q.currency,
      notes: q.notes,
      status: q.status,
    });
    sendPdf(res, buffer, `${q.quotationId}.pdf`);
  } catch (error) {
    next(error);
  }
};

const getClientQuotations = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 12);
    const filter = {
      $or: [{ clientId: req.user._id }, { clientEmail: req.user.email }],
      status: { $in: ['sent', 'accepted', 'rejected', 'paid', 'partially_paid'] },
    };
    if (req.query.status) filter.status = req.query.status;

    const [rows, total] = await Promise.all([
      Quotation.find(filter)
        .select(
          'quotationId title status total currency paidAmount milestones validUntil createdAt projectId leadType notes'
        )
        .populate(
          'projectId',
          'title slug deliveryAccessUrl deliveryZipUrl deliveryLicenseKey deliveryInstructions buyNowEnabled price'
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Quotation.countDocuments(filter),
    ]);

    sendPaginated(res, rows, buildPaginationMeta(total, page, limit), 'Client quotations fetched');
  } catch (error) {
    next(error);
  }
};

const respondToQuotation = async (req, res, next) => {
  try {
    const { action } = req.body;
    if (!['accept', 'reject'].includes(action)) {
      return sendError(res, 'action must be accept or reject', 400);
    }

    const q = await Quotation.findOne({
      _id: req.params.id,
      $or: [{ clientId: req.user._id }, { clientEmail: req.user.email }],
    });
    if (!q) return sendError(res, 'Quotation not found', 404);
    if (!['sent', 'accepted'].includes(q.status)) {
      return sendError(res, 'Quotation cannot be updated in current status', 400);
    }

    q.status = action === 'accept' ? 'accepted' : 'rejected';
    if (!q.clientId) q.clientId = req.user._id;
    await q.save();

    sendSuccess(res, q, `Quotation ${action}ed`);
  } catch (error) {
    next(error);
  }
};

const createPaymentForQuotation = async (req, res, next) => {
  try {
    const q = await Quotation.findOne({
      _id: req.params.id,
      $or: [{ clientId: req.user._id }, { clientEmail: req.user.email }],
    });
    if (!q) return sendError(res, 'Quotation not found', 404);
    if (!['sent', 'accepted', 'partially_paid'].includes(q.status)) {
      return sendError(res, 'Quotation is not payable in current status', 400);
    }

    if (q.status === 'sent') {
      q.status = 'accepted';
      await q.save();
    }

    // Ensure milestones exist (legacy quotations)
    if (!q.milestones || q.milestones.length === 0) {
      q.milestones = [
        { key: 'full', label: 'Full payment', amount: q.total, status: 'pending' },
      ];
      await q.save();
    }

    const milestoneId = req.body?.milestoneId;
    let milestone = milestoneId
      ? q.milestones.id(milestoneId)
      : q.milestones.find((m) => m.status === 'pending');

    if (!milestone) return sendError(res, 'No pending payment part left', 400);
    if (milestone.status === 'paid') return sendError(res, 'This payment part is already paid', 400);

    const payAmount = milestone.amount;
    if (payAmount <= 0) return sendError(res, 'Invalid milestone amount', 400);

    await Transaction.updateMany(
      { quotationId: q._id, status: 'created' },
      { $set: { status: 'failed' } }
    );

    const cfg = await require('../services/settings.service').getPaymentConfig({ force: true });
    const wantDemo = Boolean(req.body?.demoPay);
    const demoAllowed = cfg.allowDemoPay !== false && (cfg.isTestKey || cfg.provider === 'mock');

    if (wantDemo && !demoAllowed) {
      return sendError(res, 'Demo pay is disabled in settings', 403);
    }

    const rate = q.commissionRate ?? 30;
    let chargeAmount = payAmount;
    let platformCommission = q.developerId
      ? Math.round((payAmount * rate) / 100)
      : payAmount;
    let developerShare = q.developerId ? payAmount - platformCommission : 0;
    let couponMeta = {
      originalAmount: payAmount,
      discountAmount: 0,
      couponCode: undefined,
      couponId: undefined,
    };

    if (req.body?.couponCode) {
      const { findValidCoupon, computeCouponSplit } = require('../services/coupon.service');
      const { coupon, error } = await findValidCoupon({
        code: req.body.couponCode,
        projectId: q.projectId,
        developerIdOnQuote: q.developerId,
        leadType: q.leadType,
      });
      if (error) return sendError(res, error, 400);
      if (coupon.minOrderAmount > payAmount) {
        return sendError(res, `Minimum order ₹${coupon.minOrderAmount} for this coupon`, 400);
      }
      const split = await computeCouponSplit({
        originalAmount: payAmount,
        commissionRate: rate,
        hasDeveloper: Boolean(q.developerId),
        coupon,
      });
      chargeAmount = split.clientPays;
      platformCommission = split.platformCommission;
      developerShare = split.developerShare;
      couponMeta = {
        originalAmount: split.originalAmount,
        discountAmount: split.discount,
        couponCode: split.couponCode,
        couponId: split.couponId,
      };
    }

    // GST is not charged to customer; extract from paid amount and bear from shares
    const settingsForTax = await require('../services/settings.service').getOrCreateSettings();
    const taxPercent =
      Number(q.taxPercent) > 0
        ? Number(q.taxPercent)
        : Number(settingsForTax.billing?.defaultTaxPercent ?? 18) || 0;
    const { taxAmount: gstAmount } = extractInclusiveGst(chargeAmount, taxPercent);
    const taxSplitPreview = resolveTaxSplit({
      sellerGstin: settingsForTax.company?.gstin || settingsForTax.billing?.platformGstin || '',
      buyerGstin: q.clientGstin || '',
      sellerStateCode: settingsForTax.company?.stateCode,
      taxMode: settingsForTax.billing?.taxMode || 'auto',
      taxAmount: gstAmount,
    });
    const { platformGstBear, developerGstBear } = allocateGstBear({
      gstAmount,
      platformCommission,
      developerShare,
      hasDeveloper: Boolean(q.developerId),
    });

    let order;
    if (wantDemo && demoAllowed) {
      order = {
        mode: 'mock',
        orderId: `order_mock_${Date.now()}`,
        amount: chargeAmount,
        currency: q.currency || 'INR',
        keyId: null,
      };
    } else {
      order = await createPaymentOrder({
        amount: chargeAmount,
        currency: q.currency || 'INR',
        receipt: `${q.quotationId}-${milestone.key}`.slice(0, 40),
        notes: {
          quotationId: q.quotationId,
          milestoneKey: milestone.key,
          coupon: couponMeta.couponCode || '',
        },
      });
    }

    const txn = await Transaction.create({
      transactionId: generateBusinessId('TXN'),
      quotationId: q._id,
      clientId: req.user._id,
      developerId: q.developerId || undefined,
      amount: chargeAmount,
      originalAmount: couponMeta.originalAmount,
      discountAmount: couponMeta.discountAmount,
      couponCode: couponMeta.couponCode,
      couponId: couponMeta.couponId,
      currency: q.currency || 'INR',
      commissionRate: rate,
      platformCommission,
      developerShare,
      gstAmount,
      cgst: taxSplitPreview.cgst,
      sgst: taxSplitPreview.sgst,
      igst: taxSplitPreview.igst,
      taxPercent,
      platformGstBear,
      developerGstBear,
      milestoneKey: milestone.key,
      milestoneId: milestone._id,
      razorpayOrderId: order.orderId,
      paymentMode: order.mode,
      status: 'created',
      settlementStatus: q.developerId ? 'pending' : 'not_applicable',
    });

    sendSuccess(
      res,
      {
        transaction: txn,
        payment: {
          mode: order.mode,
          orderId: order.orderId,
          amount: order.amount,
          currency: order.currency,
          keyId: order.keyId,
          razorpayEnabled: await hasRazorpay(),
          allowDemoPay: demoAllowed,
          discount: couponMeta.discountAmount,
          originalAmount: couponMeta.originalAmount,
          couponCode: couponMeta.couponCode || null,
          milestone: {
            id: milestone._id,
            key: milestone.key,
            label: milestone.label,
            amount: milestone.amount,
          },
        },
      },
      order.mode === 'mock' ? 'Demo payment order created' : 'Payment order created'
    );
  } catch (error) {
    next(error);
  }
};

const confirmPayment = async (req, res, next) => {
  try {
    const { transactionId, razorpayPaymentId, razorpayOrderId, razorpaySignature, mockConfirm } =
      req.body;

    const txn = await Transaction.findOne({ transactionId });
    if (!txn) return sendError(res, 'Transaction not found', 404);
    if (txn.status === 'paid') return sendSuccess(res, txn, 'Already paid');

    if (txn.clientId && String(txn.clientId) !== String(req.user._id) && req.user.role === 'client') {
      return sendError(res, 'Not your transaction', 403);
    }

    if (txn.paymentMode === 'razorpay') {
      const ok = await verifyRazorpaySignature({
        orderId: razorpayOrderId || txn.razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
      });
      if (!ok) return sendError(res, 'Invalid payment signature', 400);
      txn.razorpayPaymentId = razorpayPaymentId;
      txn.razorpaySignature = razorpaySignature;
    } else if (!mockConfirm && txn.paymentMode === 'mock') {
      return sendError(res, 'mockConfirm required for demo payment', 400);
    }

    txn.status = 'paid';
    txn.paidAt = new Date();
    await txn.save();

    const { creditDeveloperHold } = require('../services/wallet.service');

    const q = await Quotation.findById(txn.quotationId);
    if (q) {
      // Mark milestone paid
      if (!q.milestones || q.milestones.length === 0) {
        q.milestones = [
          { key: 'full', label: 'Full payment', amount: q.total, status: 'pending' },
        ];
      }
      let milestone =
        (txn.milestoneId && q.milestones.id(txn.milestoneId)) ||
        q.milestones.find((m) => m.key === txn.milestoneKey) ||
        q.milestones.find((m) => m.status === 'pending');
      if (milestone) {
        milestone.status = 'paid';
        milestone.paidAt = new Date();
        milestone.transactionId = txn._id;
      }
      q.paidAmount = (q.paidAmount || 0) + (txn.amount || 0);
      const allPaid = q.milestones.every((m) => m.status === 'paid');
      q.status = allPaid ? 'paid' : 'partially_paid';
      await q.save();

      if (allPaid) {
        if (q.requirementId) {
          await Requirement.findByIdAndUpdate(q.requirementId, { status: 'won' });
        }
        if (q.customizationId) {
          await CustomizationRequest.findByIdAndUpdate(q.customizationId, { status: 'won' });
        }
      }

      const settingsDoc = await require('../services/settings.service').getOrCreateSettings();
      const billing = settingsDoc.billing || {};
      const company = settingsDoc.company || {};
      const taxPercent =
        Number(txn.taxPercent) > 0
          ? Number(txn.taxPercent)
          : Number(q.taxPercent) > 0
            ? Number(q.taxPercent)
            : Number(billing.defaultTaxPercent ?? 18) || 0;
      const sellerGstin = company.gstin || billing.platformGstin || '';
      const buyerGstin = q.clientGstin || '';

      // Customer paid txn.amount (final). GST extracted for invoice + share bearing.
      const paid = Math.round(Number(txn.amount) || 0);
      const { taxableValue, taxAmount } = extractInclusiveGst(paid, taxPercent);

      const split = resolveTaxSplit({
        sellerGstin,
        buyerGstin,
        sellerStateCode: company.stateCode || stateCodeFromGstin(sellerGstin),
        taxMode: billing.taxMode || 'auto',
        taxAmount,
      });

      if (!(txn.gstAmount > 0) && taxAmount > 0) {
        const bear = allocateGstBear({
          gstAmount: taxAmount,
          platformCommission: txn.platformCommission,
          developerShare: txn.developerShare,
          hasDeveloper: Boolean(txn.developerId),
        });
        txn.gstAmount = taxAmount;
        txn.cgst = split.cgst;
        txn.sgst = split.sgst;
        txn.igst = split.igst;
        txn.taxPercent = taxPercent;
        txn.platformGstBear = bear.platformGstBear;
        txn.developerGstBear = bear.developerGstBear;
        await txn.save();
      }

      if (txn.developerId && txn.developerShare > 0) {
        const holdMode = settingsDoc.payments?.holdStartMode || 'from_payment';
        const holdDays = settingsDoc.payments?.refundHoldDays ?? 14;
        let holdUntil;
        if (holdMode === 'from_delivery') {
          holdUntil = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000);
        } else {
          holdUntil = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000);
        }
        const creditAmt = Math.max(0, (txn.developerShare || 0) - (txn.developerGstBear || 0));
        if (creditAmt > 0) {
          await creditDeveloperHold({
            developerId: txn.developerId,
            amount: creditAmt,
            transactionId: txn._id,
            quotationId: q._id,
            projectId: q.projectId,
            note: `Share from ${txn.transactionId} (${milestone?.label || 'payment'})${
              txn.developerGstBear ? ` · GST bear ₹${txn.developerGstBear}` : ''
            }`,
            holdUntil,
          });
        }
      }

      if (txn.couponId) {
        await require('../models/Coupon').findByIdAndUpdate(txn.couponId, {
          $inc: { usedCount: 1 },
        });
      }

      const { rounded: payable, roundOff } = roundToInr(paid);
      const invoiceItems = scaleItemsToTaxable(
        q.items,
        taxableValue,
        q.title || 'Digital product / service'
      );

      const prefix = (company.invoicePrefix || 'SM').replace(/[^A-Za-z0-9]/g, '') || 'SM';
      const invoice = await Invoice.create({
        invoiceId: generateBusinessId(prefix),
        quotationId: q._id,
        transactionId: txn._id,
        clientId: txn.clientId,
        clientName: q.clientName,
        clientEmail: q.clientEmail,
        clientPhone: q.clientPhone || '',
        clientCompany: q.clientCompany || '',
        clientAddress: q.clientAddress || '',
        clientGstin: buyerGstin,
        title: `${q.title}${milestone ? ` · ${milestone.label}` : ''}${
          txn.couponCode ? ` · ${txn.couponCode}` : ''
        }`,
        items: invoiceItems,
        subtotal: taxableValue,
        taxAmount,
        total: payable,
        originalAmount: txn.originalAmount || payable + (txn.discountAmount || 0),
        discountAmount: txn.discountAmount || 0,
        couponCode: txn.couponCode || '',
        roundOff,
        currency: q.currency,
        gstin: sellerGstin,
        placeOfSupply: billing.placeOfSupply || company.stateName || split.placeHint || '',
        hsnSac: billing.defaultHsnSac || '998314',
        taxableValue,
        cgst: split.cgst,
        sgst: split.sgst,
        igst: split.igst,
        taxPercent,
        taxMode: split.mode,
        companySnapshot: {
          legalName: company.legalName || '',
          tradeName: company.tradeName || '',
          registeredAddress: company.registeredAddress || '',
          phone: company.phone || '',
          email: company.email || '',
          website: company.website || '',
          gstin: sellerGstin,
          pan: company.pan || '',
          stateCode: company.stateCode || stateCodeFromGstin(sellerGstin),
          stateName: company.stateName || '',
          bankName: company.bankName || '',
          accountName: company.accountName || '',
          accountNumber: company.accountNumber || '',
          accountType: company.accountType || 'Current',
          ifsc: company.ifsc || '',
          branch: company.branch || '',
          invoiceNotes: company.invoiceNotes || '',
          authorisedSignatoryLabel: company.authorisedSignatoryLabel || 'Authorised Signatory',
        },
        status: 'paid',
        paidAt: new Date(),
      });

      await sendEmail({
        to: q.clientEmail,
        subject: `Payment received · Tax Invoice ${invoice.invoiceId}`,
        text: `Hi ${q.clientName},\n\nPayment of ₹${payable} received${
          milestone ? ` (${milestone.label})` : ''
        }${txn.discountAmount ? ` (coupon saved ₹${txn.discountAmount})` : ''}. Tax Invoice ${
          invoice.invoiceId
        } is available to download in your dashboard.\n\n— ${
          company.tradeName || company.legalName || 'SM Global Hub'
        }`,
      });

      sendSuccess(res, { transaction: txn, invoice, quotation: q }, 'Payment confirmed');
      return;
    }

    sendSuccess(res, { transaction: txn }, 'Payment confirmed');
  } catch (error) {
    next(error);
  }
};

const listInvoices = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const { buildLeadSearchFilter, buildDateRangeFilter, mergeFilters } = require('../utils/queryHelpers');

    const parts = [];
    if (req.user.role === 'client') {
      parts.push({
        $or: [{ clientId: req.user._id }, { clientEmail: req.user.email }],
      });
    }
    if (req.query.status) parts.push({ status: req.query.status });
    parts.push(
      buildLeadSearchFilter(req.query.search, [
        'invoiceId',
        'title',
        'clientName',
        'clientEmail',
        'clientCompany',
        'couponCode',
      ])
    );
    parts.push(buildDateRangeFilter(req.query, 'createdAt'));
    const filter = mergeFilters(...parts);

    const [rows, total] = await Promise.all([
      Invoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Invoice.countDocuments(filter),
    ]);

    sendPaginated(res, rows, buildPaginationMeta(total, page, limit), 'Invoices fetched');
  } catch (error) {
    next(error);
  }
};

const exportInvoicesExcel = async (req, res, next) => {
  try {
    if (req.user.role === 'developer') {
      return sendError(res, 'Invoices are not available for developer accounts', 403);
    }
    const { sendExcel } = require('../utils/excelExport');
    const { MAX_EXPORT, buildLeadSearchFilter, buildDateRangeFilter, mergeFilters } = require('../utils/queryHelpers');

    const parts = [];
    if (req.user.role === 'client') {
      parts.push({
        $or: [{ clientId: req.user._id }, { clientEmail: req.user.email }],
      });
    }
    if (req.query.status) parts.push({ status: req.query.status });
    parts.push(
      buildLeadSearchFilter(req.query.search, [
        'invoiceId',
        'title',
        'clientName',
        'clientEmail',
        'clientCompany',
        'couponCode',
      ])
    );
    parts.push(buildDateRangeFilter(req.query, 'createdAt'));
    const filter = mergeFilters(...parts);

    const rows = await Invoice.find(filter).sort({ createdAt: -1 }).limit(MAX_EXPORT).lean();
    await sendExcel(res, {
      filename: `invoices-${Date.now()}.xlsx`,
      sheetName: 'Invoices',
      columns: [
        { header: 'Invoice ID', key: 'invoiceId', width: 16 },
        { header: 'Title', key: 'title', width: 36 },
        { header: 'Client', key: 'clientName', width: 20 },
        { header: 'Email', key: 'clientEmail', width: 28 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Taxable', key: 'taxableValue', width: 12 },
        { header: 'CGST', key: 'cgst', width: 10 },
        { header: 'SGST', key: 'sgst', width: 10 },
        { header: 'IGST', key: 'igst', width: 10 },
        { header: 'Discount', key: 'discountAmount', width: 10 },
        { header: 'Coupon', key: 'couponCode', width: 12 },
        { header: 'Total', key: 'total', width: 12 },
        { header: 'Tax %', key: 'taxPercent', width: 8 },
        { header: 'Date', key: 'createdAt', width: 14 },
      ],
      rows: rows.map((r) => ({
        invoiceId: r.invoiceId,
        title: r.title,
        clientName: r.clientName,
        clientEmail: r.clientEmail,
        status: r.status,
        taxableValue: r.taxableValue ?? r.subtotal,
        cgst: r.cgst || 0,
        sgst: r.sgst || 0,
        igst: r.igst || 0,
        discountAmount: r.discountAmount || 0,
        couponCode: r.couponCode || '',
        total: r.total,
        taxPercent: r.taxPercent || '',
        createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '',
      })),
    });
  } catch (error) {
    next(error);
  }
};

const downloadInvoicePdf = async (req, res, next) => {
  try {
    // Developers must not access invoices
    if (req.user.role === 'developer') {
      return sendError(res, 'Invoices are not available for developer accounts', 403);
    }

    const inv = await Invoice.findById(req.params.id).lean();
    if (!inv) return sendError(res, 'Invoice not found', 404);
    if (
      req.user.role === 'client' &&
      inv.clientId &&
      String(inv.clientId) !== String(req.user._id) &&
      inv.clientEmail !== req.user.email
    ) {
      return sendError(res, 'Forbidden', 403);
    }

    const settingsDoc = await require('../services/settings.service').getOrCreateSettings();
    const billing = settingsDoc.billing || {};
    const company = {
      ...(settingsDoc.company || {}),
      ...(inv.companySnapshot || {}),
      gstin:
        inv.gstin ||
        inv.companySnapshot?.gstin ||
        settingsDoc.company?.gstin ||
        billing.platformGstin ||
        '',
      stateCode:
        inv.companySnapshot?.stateCode ||
        settingsDoc.company?.stateCode ||
        stateCodeFromGstin(
          inv.gstin || settingsDoc.company?.gstin || billing.platformGstin || ''
        ),
    };

    let txn = null;
    if (inv.transactionId) {
      txn = await Transaction.findById(inv.transactionId)
        .select('discountAmount originalAmount couponCode amount')
        .lean();
    }

    const discountAmount = Number(inv.discountAmount || txn?.discountAmount || 0) || 0;
    const originalAmount =
      Number(inv.originalAmount || txn?.originalAmount || 0) ||
      Math.round(Number(inv.total || 0) + discountAmount);
    const couponCode = inv.couponCode || txn?.couponCode || '';

    // Prefer stored tax %; fall back to platform default so old invoices still show GST
    const taxPercent =
      Number(inv.taxPercent) > 0
        ? Number(inv.taxPercent)
        : Number(billing.defaultTaxPercent ?? 18) || 0;

    const buffer = await buildTaxInvoicePdf({
      invoiceId: inv.invoiceId,
      issuedAt: inv.issuedAt || inv.paidAt || inv.createdAt,
      title: inv.title,
      status: inv.status,
      company,
      client: {
        name: inv.clientName,
        email: inv.clientEmail,
        phone: inv.clientPhone,
        company: inv.clientCompany,
        address: inv.clientAddress,
        gstin: inv.clientGstin,
      },
      items: inv.items,
      hsnSac: inv.hsnSac || billing.defaultHsnSac || '998314',
      taxableValue: inv.taxableValue ?? inv.subtotal,
      taxPercent,
      cgst: inv.cgst,
      sgst: inv.sgst,
      igst: inv.igst,
      taxAmount: inv.taxAmount,
      roundOff: inv.roundOff || 0,
      total: inv.total,
      discountAmount,
      originalAmount,
      couponCode,
      taxMode: inv.taxMode || billing.taxMode || 'auto',
      currency: inv.currency,
      notes: company.invoiceNotes,
    });
    sendPdf(res, buffer, `${inv.invoiceId}.pdf`);
  } catch (error) {
    next(error);
  }
};

const listTransactions = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const { buildLeadSearchFilter, buildDateRangeFilter, mergeFilters } = require('../utils/queryHelpers');
    const filter = mergeFilters(
      req.query.status ? { status: req.query.status } : {},
      req.query.settlementStatus ? { settlementStatus: req.query.settlementStatus } : {},
      buildLeadSearchFilter(req.query.search, ['transactionId', 'couponCode']),
      buildDateRangeFilter(req.query, 'createdAt')
    );

    const [rows, total] = await Promise.all([
      Transaction.find(filter)
        .populate('quotationId', 'quotationId title')
        .populate('developerId', 'name email')
        .populate('clientId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    sendPaginated(res, rows, buildPaginationMeta(total, page, limit), 'Transactions fetched');
  } catch (error) {
    next(error);
  }
};

const exportTransactionsExcel = async (req, res, next) => {
  try {
    const { sendExcel } = require('../utils/excelExport');
    const { MAX_EXPORT, buildLeadSearchFilter, buildDateRangeFilter, mergeFilters } = require('../utils/queryHelpers');
    const filter = mergeFilters(
      req.query.status ? { status: req.query.status } : {},
      req.query.settlementStatus ? { settlementStatus: req.query.settlementStatus } : {},
      buildLeadSearchFilter(req.query.search, ['transactionId', 'couponCode']),
      buildDateRangeFilter(req.query, 'createdAt')
    );
    const rows = await Transaction.find(filter)
      .populate('quotationId', 'quotationId title')
      .populate('developerId', 'name email')
      .populate('clientId', 'name email')
      .sort({ createdAt: -1 })
      .limit(MAX_EXPORT)
      .lean();
    await sendExcel(res, {
      filename: `transactions-${Date.now()}.xlsx`,
      sheetName: 'Transactions',
      columns: [
        { header: 'Txn ID', key: 'transactionId', width: 16 },
        { header: 'Quotation', key: 'quotation', width: 16 },
        { header: 'Client', key: 'client', width: 22 },
        { header: 'Developer', key: 'developer', width: 22 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Discount', key: 'discountAmount', width: 10 },
        { header: 'Platform', key: 'platformCommission', width: 12 },
        { header: 'Dev share', key: 'developerShare', width: 12 },
        { header: 'GST', key: 'gstAmount', width: 10 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Settlement', key: 'settlementStatus', width: 12 },
        { header: 'Date', key: 'createdAt', width: 14 },
      ],
      rows: rows.map((r) => ({
        transactionId: r.transactionId,
        quotation: r.quotationId?.quotationId || '',
        client: r.clientId?.email || '',
        developer: r.developerId?.name || '',
        amount: r.amount,
        discountAmount: r.discountAmount || 0,
        platformCommission: r.platformCommission || 0,
        developerShare: r.developerShare || 0,
        gstAmount: r.gstAmount || 0,
        status: r.status,
        settlementStatus: r.settlementStatus,
        createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '',
      })),
    });
  } catch (error) {
    next(error);
  }
};

const createSettlement = async (req, res, next) => {
  try {
    const { developerId, transactionIds, notes } = req.body;
    if (!developerId || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return sendError(res, 'developerId and transactionIds required', 400);
    }

    const txns = await Transaction.find({
      _id: { $in: transactionIds },
      developerId,
      status: 'paid',
      settlementStatus: 'pending',
    });

    if (txns.length === 0) return sendError(res, 'No eligible transactions', 400);

    const amount = txns.reduce((s, t) => s + (t.developerShare || 0), 0);
    const settlement = await Settlement.create({
      settlementId: generateBusinessId('STL'),
      developerId,
      transactionIds: txns.map((t) => t._id),
      amount,
      notes,
      status: 'pending',
      createdBy: req.user._id,
    });

    await Transaction.updateMany(
      { _id: { $in: txns.map((t) => t._id) } },
      { $set: { settlementStatus: 'included' } }
    );

    sendSuccess(res, settlement, 'Settlement created', 201);
  } catch (error) {
    next(error);
  }
};

const updateSettlement = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const s = await Settlement.findById(req.params.id);
    if (!s) return sendError(res, 'Settlement not found', 404);

    if (status) s.status = status;
    if (notes !== undefined) s.notes = notes;
    if (status === 'paid') {
      s.paidAt = new Date();
      await Transaction.updateMany(
        { _id: { $in: s.transactionIds } },
        { $set: { settlementStatus: 'paid' } }
      );

      const developer = await User.findById(s.developerId).select('email name').lean();
      if (developer?.email) {
        await sendEmail({
          to: developer.email,
          subject: `Settlement paid ${s.settlementId}`,
          text: `Hi ${developer.name},\n\nSettlement ${s.settlementId} of ₹${s.amount} marked paid.\n\n— SM Global Hub`,
        });
      }
    }
    await s.save();
    sendSuccess(res, s, 'Settlement updated');
  } catch (error) {
    next(error);
  }
};

const listSettlements = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const { buildLeadSearchFilter, buildDateRangeFilter, mergeFilters } = require('../utils/queryHelpers');
    const parts = [];
    if (req.user.role === 'developer') parts.push({ developerId: req.user._id });
    if (req.query.status) parts.push({ status: req.query.status });
    if (req.query.developerId && ['admin', 'super_admin'].includes(req.user.role)) {
      parts.push({ developerId: req.query.developerId });
    }
    parts.push(buildLeadSearchFilter(req.query.search, ['settlementId', 'notes']));
    parts.push(buildDateRangeFilter(req.query, 'createdAt'));
    const filter = mergeFilters(...parts);

    const [rows, total] = await Promise.all([
      Settlement.find(filter)
        .populate('developerId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Settlement.countDocuments(filter),
    ]);

    sendPaginated(res, rows, buildPaginationMeta(total, page, limit), 'Settlements fetched');
  } catch (error) {
    next(error);
  }
};

const exportSettlementsExcel = async (req, res, next) => {
  try {
    const { sendExcel } = require('../utils/excelExport');
    const { MAX_EXPORT, buildLeadSearchFilter, buildDateRangeFilter, mergeFilters } = require('../utils/queryHelpers');
    const parts = [];
    if (req.user.role === 'developer') parts.push({ developerId: req.user._id });
    if (req.query.status) parts.push({ status: req.query.status });
    if (req.query.developerId && ['admin', 'super_admin'].includes(req.user.role)) {
      parts.push({ developerId: req.query.developerId });
    }
    parts.push(buildLeadSearchFilter(req.query.search, ['settlementId', 'notes']));
    parts.push(buildDateRangeFilter(req.query, 'createdAt'));
    const filter = mergeFilters(...parts);
    const rows = await Settlement.find(filter)
      .populate('developerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(MAX_EXPORT)
      .lean();
    await sendExcel(res, {
      filename: `settlements-${Date.now()}.xlsx`,
      sheetName: 'Settlements',
      columns: [
        { header: 'Settlement ID', key: 'settlementId', width: 16 },
        { header: 'Developer', key: 'developer', width: 22 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Amount', key: 'amount', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Notes', key: 'notes', width: 28 },
        { header: 'Date', key: 'createdAt', width: 14 },
      ],
      rows: rows.map((r) => ({
        settlementId: r.settlementId,
        developer: r.developerId?.name || '',
        email: r.developerId?.email || '',
        amount: r.amount,
        status: r.status,
        notes: r.notes || '',
        createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '',
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getDeveloperEarningsDetailed = async (req, res, next) => {
  try {
    const developerId = req.user._id;
    const { getWalletSummary } = require('../services/wallet.service');
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 8);

    const [paidTxns, pendingShare, settlements, wallet, txnTotal] = await Promise.all([
      Transaction.find({ developerId, status: 'paid' })
        .sort({ paidAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.aggregate([
        { $match: { developerId, status: 'paid', settlementStatus: 'pending' } },
        { $group: { _id: null, amount: { $sum: '$developerShare' } } },
      ]),
      Settlement.find({ developerId }).sort({ createdAt: -1 }).limit(10).lean(),
      getWalletSummary(developerId),
      Transaction.countDocuments({ developerId, status: 'paid' }),
    ]);

    const allShareAgg = await Transaction.aggregate([
      { $match: { developerId, status: 'paid' } },
      {
        $group: {
          _id: null,
          gross: { $sum: '$amount' },
          share: { $sum: '$developerShare' },
          commission: { $sum: '$platformCommission' },
        },
      },
    ]);
    const totals = allShareAgg[0] || {};
    const settled = settlements
      .filter((x) => x.status === 'paid')
      .reduce((s, x) => s + (x.amount || 0), 0);

    sendSuccess(
      res,
      {
        summary: {
          grossPaidOrders: totals.gross || 0,
          platformCommission: totals.commission || 0,
          developerShare: totals.share || 0,
          pendingSettlement: pendingShare[0]?.amount || 0,
          settledPaid: settled,
          availableBalance: wallet.availableBalance,
          holdBalance: wallet.holdBalance,
          reservedBalance: wallet.reservedBalance || 0,
          refundHoldDays: wallet.refundHoldDays,
        },
        recentSettlements: settlements,
        recentTransactions: paidTxns,
        transactionsPagination: buildPaginationMeta(txnTotal, page, limit),
      },
      'Earnings report'
    );
  } catch (error) {
    next(error);
  }
};

/** Admin marks quotation delivered → start refund hold clock for related wallet entries */
const markQuotationDelivered = async (req, res, next) => {
  try {
    const q = await Quotation.findById(req.params.id);
    if (!q) return sendError(res, 'Quotation not found', 404);
    if (!['paid', 'partially_paid'].includes(q.status)) {
      return sendError(res, 'Only paid / partially paid quotations can be marked delivered', 400);
    }

    q.deliveredAt = new Date();
    q.deliveredBy = req.user._id;
    await q.save();

    const settingsDoc = await require('../services/settings.service').getOrCreateSettings();
    const holdDays = settingsDoc.payments?.refundHoldDays ?? 14;
    const holdMode = settingsDoc.payments?.holdStartMode || 'from_payment';

    if (holdMode === 'from_delivery' && q.developerId) {
      const WalletLedger = require('../models/WalletLedger');
      const holdUntil = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000);
      await WalletLedger.updateMany(
        { quotationId: q._id, type: 'credit_hold', status: 'hold' },
        { $set: { holdUntil, note: 'Hold clock started at delivery' } }
      );
    }

    sendSuccess(res, q, 'Marked delivered');
  } catch (error) {
    next(error);
  }
};

/**
 * Partial/full refund — debits developer wallet (hold first, then available).
 * Platform absorbs remainder of refund beyond developer debit when needed.
 */
const refundTransaction = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    const txn = await Transaction.findById(req.params.id);
    if (!txn) return sendError(res, 'Transaction not found', 404);
    if (txn.status !== 'paid') return sendError(res, 'Only paid transactions can be refunded', 400);

    const maxRefund = (txn.amount || 0) - (txn.refundAmount || 0);
    const refundAmt = Math.min(maxRefund, Math.max(0, Number(amount) || maxRefund));
    if (refundAmt <= 0) return sendError(res, 'Nothing left to refund', 400);

    // Debit developer proportionally from their share
    if (txn.developerId && txn.developerShare > 0) {
      const shareRatio = txn.developerShare / (txn.amount || 1);
      const developerDebit = Math.min(
        txn.developerShare,
        Math.round(refundAmt * shareRatio)
      );
      if (developerDebit > 0) {
        const DeveloperWallet = require('../models/DeveloperWallet');
        const WalletLedger = require('../models/WalletLedger');
        const wallet = await require('../services/wallet.service').getOrCreateWallet(
          txn.developerId
        );
        let left = developerDebit;
        const fromHold = Math.min(wallet.holdBalance, left);
        wallet.holdBalance -= fromHold;
        left -= fromHold;
        const fromAvail = Math.min(wallet.availableBalance, left);
        wallet.availableBalance -= fromAvail;
        left -= fromAvail;
        await wallet.save();

        await WalletLedger.create({
          developerId: txn.developerId,
          type: 'refund_debit',
          amount: developerDebit - left,
          status: 'reversed',
          transactionId: txn._id,
          quotationId: txn.quotationId,
          note: reason || `Refund ${txn.transactionId}`,
        });

        // Also mark related hold entries reduced conceptually via ledger
        await WalletLedger.updateMany(
          { transactionId: txn._id, type: 'credit_hold', status: 'hold' },
          { $set: { note: `Adjusted after refund ${refundAmt}` } }
        );
      }
    }

    txn.refundAmount = (txn.refundAmount || 0) + refundAmt;
    txn.refundReason = reason || txn.refundReason;
    txn.refundedAt = new Date();
    if (txn.refundAmount >= txn.amount) txn.status = 'refunded';
    await txn.save();

    sendSuccess(res, txn, 'Refund recorded');
  } catch (error) {
    next(error);
  }
};

/**
 * Ready-product purchase: create a buy_now quotation at fixed project price.
 */
const buyNowForProject = async (req, res, next) => {
  try {
    const Project = require('../models/Project');
    const project = await Project.findOne({
      slug: req.params.slug,
      status: { $in: ['published', 'featured'] },
    });
    if (!project) return sendError(res, 'Project not found', 404);
    if (!project.buyNowEnabled || !(project.price?.amount > 0)) {
      return sendError(res, 'Buy Now is not available for this project', 400);
    }

    const amount = Math.round(Number(project.price.amount));
    const settingsDoc = await require('../services/settings.service').getOrCreateSettings();
    const taxPercent = Number(settingsDoc.billing?.defaultTaxPercent ?? 18) || 0;
    const items = [
      {
        description: `${project.title} — ready license / delivery`,
        quantity: 1,
        unitAmount: amount,
        amount,
      },
    ];
    const totals = calcTotals(items, taxPercent);

    // Reuse open unpaid buy_now quote for same client+project
    let existing = await Quotation.findOne({
      clientId: req.user._id,
      projectId: project._id,
      leadType: 'buy_now',
      status: { $in: ['sent', 'accepted'] },
    }).sort({ createdAt: -1 });

    if (existing && existing.total === totals.total) {
      return sendSuccess(res, existing, 'Continue checkout for this product');
    }

    const q = await Quotation.create({
      quotationId: generateBusinessId('QT'),
      leadType: 'buy_now',
      projectId: project._id,
      developerId: project.developerId || undefined,
      clientId: req.user._id,
      clientName: req.user.name || 'Client',
      clientEmail: req.user.email,
      clientPhone: req.user.phone || '',
      clientCompany: req.user.profile?.company || '',
      clientAddress: req.body?.clientAddress || '',
      clientGstin: req.body?.clientGstin
        ? String(req.body.clientGstin).trim().toUpperCase()
        : '',
      title: `Buy Now — ${project.title}`,
      items,
      ...totals,
      taxPercent,
      milestones: [
        { key: 'full', label: 'Full payment', amount: totals.total, status: 'pending' },
      ],
      status: 'sent',
      commissionRate: 30,
      notes: project.deliveryAccessUrl
        ? `Delivery access will be available after payment.`
        : `After payment our team will share delivery / access details.`,
    });

    sendSuccess(res, q, 'Buy Now quotation created — proceed to pay', 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuotation,
  listQuotations,
  exportQuotationsExcel,
  getQuotationById,
  updateQuotation,
  sendQuotation,
  downloadQuotationPdf,
  getClientQuotations,
  respondToQuotation,
  createPaymentForQuotation,
  confirmPayment,
  listInvoices,
  exportInvoicesExcel,
  buyNowForProject,
  downloadInvoicePdf,
  listTransactions,
  exportTransactionsExcel,
  createSettlement,
  updateSettlement,
  listSettlements,
  exportSettlementsExcel,
  getDeveloperEarningsDetailed,
  markQuotationDelivered,
  refundTransaction,
};
