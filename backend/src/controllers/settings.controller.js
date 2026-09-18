const {
  getOrCreateSettings,
  clearPaymentCache,
  clearCloudinaryCache,
  clearSmtpCache,
  publicSettingsView,
  getCloudinaryConfig,
} = require('../services/settings.service');
const { sendSuccess } = require('../utils/apiResponse');
const { stateCodeFromGstin } = require('../utils/gst');
const { writeAuditLog } = require('../utils/auditLog');

const getSettings = async (req, res, next) => {
  try {
    const doc = await getOrCreateSettings();
    sendSuccess(res, publicSettingsView(doc), 'Settings fetched');
  } catch (error) {
    next(error);
  }
};

const normalizeCouponSplit = (payments, couponAdminBearPercent, couponDeveloperBearPercent) => {
  if (couponAdminBearPercent === undefined && couponDeveloperBearPercent === undefined) return;
  let a =
    couponAdminBearPercent !== undefined
      ? Number(couponAdminBearPercent)
      : payments.couponAdminBearPercent ?? 80;
  let d =
    couponDeveloperBearPercent !== undefined
      ? Number(couponDeveloperBearPercent)
      : payments.couponDeveloperBearPercent ?? 20;
  if (!Number.isFinite(a)) a = 80;
  if (!Number.isFinite(d)) d = 20;
  const t = a + d;
  if (t <= 0) {
    a = 80;
    d = 20;
  } else if (t !== 100) {
    a = Math.round((a / t) * 100);
    d = 100 - a;
  }
  payments.couponAdminBearPercent = a;
  payments.couponDeveloperBearPercent = d;
};

const updatePaymentSettings = async (req, res, next) => {
  try {
    const {
      razorpayKeyId,
      razorpayKeySecret,
      testMode,
      testKeyId,
      testKeySecret,
      liveKeyId,
      liveKeySecret,
      enabled,
      provider,
      allowDemoPay,
      refundHoldDays,
      holdStartMode,
      couponAdminBearPercent,
      couponDeveloperBearPercent,
      maxPayoutRequestsPerDay,
      maxPayoutAmount,
    } = req.body;

    const doc = await getOrCreateSettings();
    const payments = {
      ...(doc.payments?.toObject?.() || doc.payments || {}),
    };

    if (testMode !== undefined) payments.testMode = Boolean(testMode);

    if (testKeyId !== undefined) payments.testKeyId = String(testKeyId).trim();
    if (testKeySecret !== undefined && String(testKeySecret).trim() !== '') {
      payments.testKeySecret = String(testKeySecret).trim();
    }
    if (liveKeyId !== undefined) payments.liveKeyId = String(liveKeyId).trim();
    if (liveKeySecret !== undefined && String(liveKeySecret).trim() !== '') {
      payments.liveKeySecret = String(liveKeySecret).trim();
    }

    // Legacy single-key fields → route into test or live based on testMode / prefix
    if (razorpayKeyId !== undefined) {
      const kid = String(razorpayKeyId).trim();
      payments.razorpayKeyId = kid;
      const intoTest =
        payments.testMode !== false || kid.startsWith('rzp_test_') || !kid.startsWith('rzp_live_');
      if (intoTest) payments.testKeyId = kid;
      else payments.liveKeyId = kid;
    }
    if (razorpayKeySecret !== undefined && String(razorpayKeySecret).trim() !== '') {
      const sec = String(razorpayKeySecret).trim();
      payments.razorpayKeySecret = sec;
      if (payments.testMode !== false) payments.testKeySecret = sec;
      else payments.liveKeySecret = sec;
    }

    if (enabled !== undefined) payments.enabled = Boolean(enabled);
    if (allowDemoPay !== undefined) payments.allowDemoPay = Boolean(allowDemoPay);
    if (refundHoldDays !== undefined) {
      payments.refundHoldDays = Math.min(90, Math.max(0, Number(refundHoldDays) || 0));
    }
    if (holdStartMode && ['from_payment', 'from_delivery'].includes(holdStartMode)) {
      payments.holdStartMode = holdStartMode;
    }
    normalizeCouponSplit(payments, couponAdminBearPercent, couponDeveloperBearPercent);
    if (maxPayoutRequestsPerDay !== undefined) {
      payments.maxPayoutRequestsPerDay = Math.min(
        50,
        Math.max(1, Number(maxPayoutRequestsPerDay) || 3)
      );
    }
    if (maxPayoutAmount !== undefined) {
      payments.maxPayoutAmount = Math.max(0, Number(maxPayoutAmount) || 0);
    }
    if (provider && ['razorpay', 'mock'].includes(provider)) {
      payments.provider = provider;
    }

    const activeId = payments.testMode !== false ? payments.testKeyId : payments.liveKeyId;
    const activeSecret =
      payments.testMode !== false ? payments.testKeySecret : payments.liveKeySecret;
    if (payments.enabled !== false && activeId && activeSecret) {
      payments.provider = payments.provider || 'razorpay';
    }

    doc.payments = payments;
    doc.updatedBy = req.user._id;
    await doc.save();
    clearPaymentCache();

    await writeAuditLog({
      actorId: req.user._id,
      action: 'settings.payments',
      entityType: 'PlatformSettings',
      entityId: doc._id,
      meta: { testMode: payments.testMode, enabled: payments.enabled },
      ip: req.ip,
    });

    sendSuccess(res, publicSettingsView(doc), 'Payment settings updated');
  } catch (error) {
    next(error);
  }
};

const updateCloudinarySettings = async (req, res, next) => {
  try {
    const { cloudName, apiKey, apiSecret, enabled } = req.body;
    const doc = await getOrCreateSettings();
    const cloudinary = {
      ...(doc.cloudinary?.toObject?.() || doc.cloudinary || {}),
    };

    if (cloudName !== undefined) cloudinary.cloudName = String(cloudName).trim();
    if (apiKey !== undefined) cloudinary.apiKey = String(apiKey).trim();
    if (apiSecret !== undefined && String(apiSecret).trim() !== '') {
      cloudinary.apiSecret = String(apiSecret).trim();
    }
    if (enabled !== undefined) cloudinary.enabled = Boolean(enabled);

    doc.cloudinary = cloudinary;
    doc.updatedBy = req.user._id;
    await doc.save();
    clearCloudinaryCache();
    await getCloudinaryConfig({ force: true });

    sendSuccess(res, publicSettingsView(doc), 'Cloudinary settings updated');
  } catch (error) {
    next(error);
  }
};

const updateSmtpSettings = async (req, res, next) => {
  try {
    const { enabled, host, port, secure, user, pass, fromName, fromEmail } = req.body;
    const doc = await getOrCreateSettings();
    const smtp = { ...(doc.smtp?.toObject?.() || doc.smtp || {}) };

    if (enabled !== undefined) smtp.enabled = Boolean(enabled);
    if (host !== undefined) smtp.host = String(host).trim();
    if (port !== undefined) smtp.port = Number(port) || 587;
    if (secure !== undefined) smtp.secure = Boolean(secure);
    if (user !== undefined) smtp.user = String(user).trim();
    if (pass !== undefined && String(pass).trim() !== '') {
      smtp.pass = String(pass).trim();
    }
    if (fromName !== undefined) smtp.fromName = String(fromName).trim();
    if (fromEmail !== undefined) smtp.fromEmail = String(fromEmail).trim();

    doc.smtp = smtp;
    doc.updatedBy = req.user._id;
    await doc.save();
    clearSmtpCache();

    await writeAuditLog({
      actorId: req.user._id,
      action: 'settings.smtp',
      entityType: 'PlatformSettings',
      entityId: doc._id,
      meta: { host: smtp.host, enabled: smtp.enabled },
      ip: req.ip,
    });

    sendSuccess(res, publicSettingsView(doc), 'Email / SMTP settings updated');
  } catch (error) {
    next(error);
  }
};

const updateCompanySettings = async (req, res, next) => {
  try {
    const body = req.body || {};
    const doc = await getOrCreateSettings();
    const company = { ...(doc.company?.toObject?.() || doc.company || {}) };
    const fields = [
      'legalName',
      'tradeName',
      'registeredAddress',
      'phone',
      'email',
      'website',
      'gstin',
      'pan',
      'stateCode',
      'stateName',
      'bankName',
      'accountName',
      'accountNumber',
      'accountType',
      'ifsc',
      'branch',
      'invoicePrefix',
      'invoiceNotes',
      'authorisedSignatoryLabel',
    ];
    for (const f of fields) {
      if (body[f] !== undefined) company[f] = String(body[f] ?? '').trim();
    }
    if (company.gstin) {
      const sc = stateCodeFromGstin(company.gstin);
      if (sc && !body.stateCode) company.stateCode = sc;
    }

    doc.company = company;
    // Keep billing GSTIN in sync
    const billing = { ...(doc.billing?.toObject?.() || doc.billing || {}) };
    if (company.gstin) billing.platformGstin = company.gstin;
    if (company.stateName && !billing.placeOfSupply) billing.placeOfSupply = company.stateName;
    doc.billing = billing;
    doc.updatedBy = req.user._id;
    await doc.save();

    await writeAuditLog({
      actorId: req.user._id,
      action: 'settings.company',
      entityType: 'PlatformSettings',
      entityId: doc._id,
      meta: { legalName: company.legalName, gstin: company.gstin },
      ip: req.ip,
    });

    sendSuccess(res, publicSettingsView(doc), 'Company / invoice settings updated');
  } catch (error) {
    next(error);
  }
};

const updateBillingSettings = async (req, res, next) => {
  try {
    const { platformGstin, defaultTaxPercent, defaultHsnSac, placeOfSupply, taxMode } = req.body;
    const doc = await getOrCreateSettings();
    const billing = { ...(doc.billing?.toObject?.() || doc.billing || {}) };
    if (platformGstin !== undefined) billing.platformGstin = String(platformGstin).trim();
    if (defaultTaxPercent !== undefined) {
      billing.defaultTaxPercent = Math.min(40, Math.max(0, Number(defaultTaxPercent) || 0));
    }
    if (defaultHsnSac !== undefined) billing.defaultHsnSac = String(defaultHsnSac).trim();
    if (placeOfSupply !== undefined) billing.placeOfSupply = String(placeOfSupply).trim();
    if (taxMode && ['auto', 'same_state', 'interstate'].includes(taxMode)) {
      billing.taxMode = taxMode;
    }
    doc.billing = billing;

    if (billing.platformGstin) {
      const company = { ...(doc.company?.toObject?.() || doc.company || {}) };
      company.gstin = billing.platformGstin;
      const sc = stateCodeFromGstin(billing.platformGstin);
      if (sc) company.stateCode = sc;
      doc.company = company;
    }

    doc.updatedBy = req.user._id;
    await doc.save();
    await writeAuditLog({
      actorId: req.user._id,
      action: 'settings.billing',
      entityType: 'PlatformSettings',
      entityId: doc._id,
      meta: { defaultTaxPercent: billing.defaultTaxPercent, taxMode: billing.taxMode },
      ip: req.ip,
    });
    sendSuccess(res, publicSettingsView(doc), 'Billing settings updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updatePaymentSettings,
  updateCloudinarySettings,
  updateSmtpSettings,
  updateCompanySettings,
  updateBillingSettings,
};
