const PlatformSettings = require('../models/PlatformSettings');
const { applyCloudinaryConfig } = require('../config/cloudinary');
const { stateCodeFromGstin } = require('../utils/gst');

let cache = null;
let cacheAt = 0;
let cloudinaryCache = null;
let cloudinaryCacheAt = 0;
let smtpCache = null;
let smtpCacheAt = 0;
const TTL_MS = 30_000;

const maskSecret = (secret = '') => {
  if (!secret) return '';
  if (secret.length <= 4) return '****';
  return `${'*'.repeat(Math.min(12, secret.length - 4))}${secret.slice(-4)}`;
};

const paymentsDefaultsFromEnv = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  const isTest = String(keyId).startsWith('rzp_test_') || !keyId;
  return {
    provider: keyId ? 'razorpay' : 'mock',
    testMode: isTest,
    testKeyId: isTest ? keyId : '',
    testKeySecret: isTest ? keySecret : '',
    liveKeyId: !isTest ? keyId : '',
    liveKeySecret: !isTest ? keySecret : '',
    razorpayKeyId: keyId,
    razorpayKeySecret: keySecret,
    enabled: true,
    allowDemoPay: true,
  };
};

const cloudinaryDefaultsFromEnv = () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  apiKey: process.env.CLOUDINARY_API_KEY || '',
  apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  enabled: true,
});

const smtpDefaultsFromEnv = () => ({
  enabled: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
  host: process.env.SMTP_HOST || '',
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  fromName: process.env.MAIL_FROM_NAME || 'SM Global Hub',
  fromEmail: process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER || '',
});

/** Resolve active Razorpay key pair from testMode */
const resolveActiveKeys = (p = {}) => {
  const testMode = p.testMode !== false;
  let keyId = '';
  let keySecret = '';
  if (testMode) {
    keyId = (p.testKeyId || p.razorpayKeyId || process.env.RAZORPAY_KEY_ID || '').trim();
    keySecret = (p.testKeySecret || p.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || '').trim();
  } else {
    keyId = (p.liveKeyId || '').trim();
    keySecret = (p.liveKeySecret || '').trim();
    // Soft fallback if live empty but legacy live key stored in razorpay*
    if (!keyId && String(p.razorpayKeyId || '').startsWith('rzp_live_')) {
      keyId = String(p.razorpayKeyId).trim();
      keySecret = String(p.razorpayKeySecret || '').trim();
    }
  }
  return { testMode, keyId, keySecret };
};

const migrateLegacyKeys = (doc) => {
  const p = doc.payments?.toObject?.() || doc.payments || {};
  let dirty = false;
  if (!p.testKeyId && !p.liveKeyId && p.razorpayKeyId) {
    if (String(p.razorpayKeyId).startsWith('rzp_live_')) {
      p.liveKeyId = p.razorpayKeyId;
      p.liveKeySecret = p.razorpayKeySecret || '';
      p.testMode = false;
    } else {
      p.testKeyId = p.razorpayKeyId;
      p.testKeySecret = p.razorpayKeySecret || '';
      p.testMode = true;
    }
    dirty = true;
  }
  if (p.testMode === undefined) {
    p.testMode = true;
    dirty = true;
  }
  if (dirty) {
    doc.payments = p;
  }
  return dirty;
};

const getOrCreateSettings = async () => {
  let doc = await PlatformSettings.findOne({ key: 'default' });
  if (!doc) {
    try {
      doc = await PlatformSettings.create({
        key: 'default',
        payments: paymentsDefaultsFromEnv(),
        cloudinary: cloudinaryDefaultsFromEnv(),
        smtp: smtpDefaultsFromEnv(),
      });
    } catch (e) {
      doc = await PlatformSettings.findOne({ key: 'default' });
      if (!doc) throw e;
    }
  } else {
    let dirty = migrateLegacyKeys(doc);
    if (
      !doc.payments?.testKeyId &&
      !doc.payments?.razorpayKeyId &&
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET
    ) {
      doc.payments = {
        ...(doc.payments?.toObject?.() || doc.payments || {}),
        ...paymentsDefaultsFromEnv(),
        provider: 'razorpay',
        enabled: true,
      };
      dirty = true;
    }
    if (
      !doc.cloudinary?.cloudName &&
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY
    ) {
      doc.cloudinary = {
        ...(doc.cloudinary?.toObject?.() || doc.cloudinary || {}),
        ...cloudinaryDefaultsFromEnv(),
      };
      dirty = true;
    }
    if (!doc.smtp?.host && process.env.SMTP_HOST) {
      doc.smtp = {
        ...(doc.smtp?.toObject?.() || doc.smtp || {}),
        ...smtpDefaultsFromEnv(),
      };
      dirty = true;
    }
    // Sync billing.platformGstin ↔ company.gstin
    if (doc.company?.gstin && !doc.billing?.platformGstin) {
      doc.billing = {
        ...(doc.billing?.toObject?.() || doc.billing || {}),
        platformGstin: doc.company.gstin,
      };
      dirty = true;
    }
    if (dirty) await doc.save();
  }
  return doc;
};

const getPaymentConfig = async ({ force = false } = {}) => {
  const now = Date.now();
  if (!force && cache && now - cacheAt < TTL_MS) return cache;

  const doc = await getOrCreateSettings();
  const p = doc.payments || {};
  const { testMode, keyId, keySecret } = resolveActiveKeys(p);
  const enabled = p.enabled !== false;
  const hasKeys = Boolean(keyId && keySecret);
  const useRazorpay = enabled && hasKeys && (p.provider === 'razorpay' || !p.provider);

  cache = {
    provider: useRazorpay ? 'razorpay' : 'mock',
    keyId: useRazorpay ? keyId : '',
    keySecret: useRazorpay ? keySecret : '',
    enabled,
    hasKeys,
    allowDemoPay: p.allowDemoPay !== false,
    testMode,
    isTestKey: testMode || String(keyId).startsWith('rzp_test_'),
    maxPayoutRequestsPerDay: p.maxPayoutRequestsPerDay ?? 3,
    maxPayoutAmount: p.maxPayoutAmount ?? 500000,
  };
  cacheAt = now;
  return cache;
};

const getCloudinaryConfig = async ({ force = false } = {}) => {
  const now = Date.now();
  if (!force && cloudinaryCache && now - cloudinaryCacheAt < TTL_MS) {
    return cloudinaryCache;
  }

  const doc = await getOrCreateSettings();
  const c = doc.cloudinary || {};
  const cloudName = (c.cloudName || process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const apiKey = (c.apiKey || process.env.CLOUDINARY_API_KEY || '').trim();
  const apiSecret = (c.apiSecret || process.env.CLOUDINARY_API_SECRET || '').trim();
  const enabled = c.enabled !== false;
  const configured = Boolean(enabled && cloudName && apiKey && apiSecret);

  applyCloudinaryConfig({ cloudName, apiKey, apiSecret });

  cloudinaryCache = {
    cloudName: configured ? cloudName : '',
    apiKey: configured ? apiKey : '',
    apiSecret: configured ? apiSecret : '',
    enabled,
    configured,
  };
  cloudinaryCacheAt = now;
  return cloudinaryCache;
};

const getSmtpConfig = async ({ force = false } = {}) => {
  const now = Date.now();
  if (!force && smtpCache && now - smtpCacheAt < TTL_MS) return smtpCache;

  const doc = await getOrCreateSettings();
  const s = doc.smtp || {};
  const host = (s.host || process.env.SMTP_HOST || '').trim();
  const user = (s.user || process.env.SMTP_USER || '').trim();
  const pass = (s.pass || process.env.SMTP_PASS || '').trim();
  const port = Number(s.port || process.env.SMTP_PORT || 587);
  const secure =
    s.secure !== undefined ? Boolean(s.secure) : process.env.SMTP_SECURE === 'true';
  const enabled = s.enabled !== false && Boolean(host && user);
  const fromName = s.fromName || process.env.MAIL_FROM_NAME || 'SM Global Hub';
  const fromEmail = (s.fromEmail || process.env.MAIL_FROM_EMAIL || user || '').trim();

  smtpCache = {
    enabled,
    configured: Boolean(host && user && pass),
    host,
    port,
    secure,
    user,
    pass,
    fromName,
    fromEmail,
    from: fromEmail ? `${fromName} <${fromEmail}>` : `${fromName} <noreply@smglobalhub.local>`,
  };
  smtpCacheAt = now;
  return smtpCache;
};

const clearPaymentCache = () => {
  cache = null;
  cacheAt = 0;
};

const clearCloudinaryCache = () => {
  cloudinaryCache = null;
  cloudinaryCacheAt = 0;
};

const clearSmtpCache = () => {
  smtpCache = null;
  smtpCacheAt = 0;
  try {
    require('../utils/mailer').clearMailerCache();
  } catch {
    /* ignore circular during boot */
  }
};

const publicSettingsView = (doc) => {
  const p = doc.payments || {};
  const { testMode, keyId, keySecret } = resolveActiveKeys(p);
  const hasActive = Boolean(keyId && keySecret);
  const company = doc.company || {};
  const smtp = doc.smtp || {};

  return {
    payments: {
      provider: p.provider || 'razorpay',
      enabled: p.enabled !== false,
      allowDemoPay: p.allowDemoPay !== false,
      refundHoldDays: p.refundHoldDays ?? 14,
      holdStartMode: p.holdStartMode || 'from_payment',
      couponAdminBearPercent: p.couponAdminBearPercent ?? 80,
      couponDeveloperBearPercent: p.couponDeveloperBearPercent ?? 20,
      testMode,
      testKeyId: p.testKeyId || '',
      testKeySecretMasked: maskSecret(p.testKeySecret || ''),
      hasTestSecret: Boolean(p.testKeySecret),
      liveKeyId: p.liveKeyId || '',
      liveKeySecretMasked: maskSecret(p.liveKeySecret || ''),
      hasLiveSecret: Boolean(p.liveKeySecret),
      /** Active key shown for convenience */
      razorpayKeyId: keyId,
      razorpayKeySecretMasked: maskSecret(keySecret),
      hasSecret: hasActive,
      isTestKey: testMode || String(keyId).startsWith('rzp_test_'),
      maxPayoutRequestsPerDay: p.maxPayoutRequestsPerDay ?? 3,
      maxPayoutAmount: p.maxPayoutAmount ?? 500000,
      mode: p.enabled !== false && hasActive ? 'razorpay' : 'mock',
    },
    smtp: {
      enabled: smtp.enabled !== false,
      host: smtp.host || '',
      port: smtp.port ?? 587,
      secure: Boolean(smtp.secure),
      user: smtp.user || '',
      passMasked: maskSecret(smtp.pass || ''),
      hasPass: Boolean(smtp.pass),
      fromName: smtp.fromName || 'SM Global Hub',
      fromEmail: smtp.fromEmail || '',
      configured: Boolean(smtp.host && smtp.user && smtp.pass),
    },
    company: {
      legalName: company.legalName || '',
      tradeName: company.tradeName || '',
      registeredAddress: company.registeredAddress || '',
      phone: company.phone || '',
      email: company.email || '',
      website: company.website || '',
      gstin: company.gstin || doc.billing?.platformGstin || '',
      pan: company.pan || '',
      stateCode: company.stateCode || stateCodeFromGstin(company.gstin || doc.billing?.platformGstin),
      stateName: company.stateName || '',
      bankName: company.bankName || '',
      accountName: company.accountName || '',
      accountNumber: company.accountNumber || '',
      accountType: company.accountType || 'Current',
      ifsc: company.ifsc || '',
      branch: company.branch || '',
      invoicePrefix: company.invoicePrefix || 'SM',
      invoiceNotes: company.invoiceNotes || '',
      authorisedSignatoryLabel: company.authorisedSignatoryLabel || 'Authorised Signatory',
    },
    cloudinary: (() => {
      const cloudName =
        doc.cloudinary?.cloudName || process.env.CLOUDINARY_CLOUD_NAME || '';
      const apiKey = doc.cloudinary?.apiKey || process.env.CLOUDINARY_API_KEY || '';
      const apiSecret =
        doc.cloudinary?.apiSecret || process.env.CLOUDINARY_API_SECRET || '';
      const enabled = doc.cloudinary?.enabled !== false;
      return {
        enabled,
        cloudName: doc.cloudinary?.cloudName || '',
        apiKey: doc.cloudinary?.apiKey || '',
        apiSecretMasked: maskSecret(doc.cloudinary?.apiSecret || apiSecret),
        hasSecret: Boolean(doc.cloudinary?.apiSecret || apiSecret),
        configured: Boolean(enabled && cloudName && apiKey && apiSecret),
      };
    })(),
    billing: {
      platformGstin: doc.billing?.platformGstin || company.gstin || '',
      defaultTaxPercent: doc.billing?.defaultTaxPercent ?? 18,
      defaultHsnSac: doc.billing?.defaultHsnSac || '998314',
      placeOfSupply: doc.billing?.placeOfSupply || company.stateName || '',
      taxMode: doc.billing?.taxMode || 'auto',
    },
    updatedAt: doc.updatedAt,
  };
};

module.exports = {
  getOrCreateSettings,
  getPaymentConfig,
  getCloudinaryConfig,
  getSmtpConfig,
  clearPaymentCache,
  clearCloudinaryCache,
  clearSmtpCache,
  publicSettingsView,
  maskSecret,
  resolveActiveKeys,
};
