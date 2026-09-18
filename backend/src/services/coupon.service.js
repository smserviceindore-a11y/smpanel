const Coupon = require('../models/Coupon');
const Project = require('../models/Project');
const { getOrCreateSettings } = require('./settings.service');

const overlapIds = (a = [], b = []) => {
  const setB = new Set(b.map(String));
  return a.map(String).filter((id) => setB.has(id));
};

const validateProjectScope = ({ projectScope, includeProjectIds = [], excludeProjectIds = [] }) => {
  if (projectScope === 'include' && includeProjectIds.length === 0) {
    return 'Include mode requires at least one project';
  }
  if (projectScope === 'exclude' && excludeProjectIds.length === 0) {
    return 'Exclude mode requires at least one project';
  }
  const both = overlapIds(includeProjectIds, excludeProjectIds);
  if (both.length > 0) {
    return `Same project(s) cannot be in both Include and Exclude (${both.length} overlap). Fix selection.`;
  }
  return null;
};

const projectAllowed = (coupon, projectId) => {
  if (!projectId) {
    // No project on quotation: only "all" scope admin coupons
    return coupon.projectScope === 'all';
  }
  const pid = String(projectId);
  if (coupon.projectScope === 'include') {
    return (coupon.includeProjectIds || []).some((id) => String(id) === pid);
  }
  if (coupon.projectScope === 'exclude') {
    return !(coupon.excludeProjectIds || []).some((id) => String(id) === pid);
  }
  return true;
};

/**
 * Compute client pay + platform/developer shares after coupon.
 * commissionRate = platform % of ORIGINAL (pre-discount) amount for baseline.
 */
const computeCouponSplit = async ({
  originalAmount,
  commissionRate = 30,
  hasDeveloper,
  coupon,
}) => {
  const amount = Math.max(0, Number(originalAmount) || 0);
  let discount = 0;
  if (coupon.discountType === 'percent') {
    discount = Math.round((amount * Number(coupon.discountValue)) / 100);
  } else {
    discount = Math.min(amount, Math.round(Number(coupon.discountValue) || 0));
  }
  discount = Math.min(amount, Math.max(0, discount));
  const clientPays = amount - discount;

  const rate = Number(commissionRate) || 30;
  // Baseline shares on original amount
  let platformShare = hasDeveloper ? Math.round((amount * rate) / 100) : amount;
  let developerShare = hasDeveloper ? amount - platformShare : 0;

  if (discount > 0) {
    if (coupon.creatorRole === 'developer') {
      // Entire discount from developer share; platform unchanged
      developerShare = Math.max(0, developerShare - discount);
      // If developer share < discount, clamp — platform may absorb overflow only if needed
      const sum = platformShare + developerShare;
      if (sum !== clientPays && hasDeveloper) {
        developerShare = Math.max(0, clientPays - platformShare);
      }
    } else {
      // Admin / super_admin coupon — split discount burden
      const settings = await getOrCreateSettings();
      let adminBear = settings.payments?.couponAdminBearPercent ?? 80;
      let devBear = settings.payments?.couponDeveloperBearPercent ?? 20;
      if (adminBear + devBear !== 100) {
        const t = adminBear + devBear || 100;
        adminBear = Math.round((adminBear / t) * 100);
        devBear = 100 - adminBear;
      }
      if (!hasDeveloper) {
        platformShare = clientPays;
        developerShare = 0;
      } else {
        const platformCut = Math.round((discount * adminBear) / 100);
        const developerCut = discount - platformCut;
        platformShare = Math.max(0, platformShare - platformCut);
        developerShare = Math.max(0, developerShare - developerCut);
        // Fix rounding so shares = clientPays
        const diff = clientPays - (platformShare + developerShare);
        if (diff !== 0) developerShare = Math.max(0, developerShare + diff);
      }
    }
  } else if (!hasDeveloper) {
    platformShare = clientPays;
    developerShare = 0;
  }

  return {
    originalAmount: amount,
    discount,
    clientPays,
    platformCommission: platformShare,
    developerShare,
    couponCode: coupon.code,
    couponId: coupon._id,
    creatorRole: coupon.creatorRole,
  };
};

const findValidCoupon = async ({ code, projectId, developerIdOnQuote, leadType }) => {
  if (!code) return { error: 'Coupon code required' };

  // Coupons apply only to ready-product Buy Now purchases
  if (leadType && leadType !== 'buy_now') {
    return { error: 'Coupons only apply to ready Buy Now purchases, not customized quotes' };
  }
  if (!leadType) {
    return { error: 'Coupons only apply to ready Buy Now purchases, not customized quotes' };
  }

  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() });
  if (!coupon || !coupon.isActive) return { error: 'Invalid or inactive coupon' };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { error: 'Coupon expired' };
  }
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { error: 'Coupon usage limit reached' };
  }
  if (!projectAllowed(coupon, projectId)) {
    return { error: 'Coupon not valid for this project' };
  }
  // Developer coupons only on their projects
  if (coupon.creatorRole === 'developer') {
    if (!developerIdOnQuote || String(coupon.developerId) !== String(developerIdOnQuote)) {
      return {
        error:
          'This seller coupon only works on that developer’s Buy Now products — not company/catalog listings. Use a platform coupon instead.',
      };
    }
    if (projectId) {
      const project = await Project.findById(projectId).select('developerId ownerType').lean();
      if (!project || String(project.developerId) !== String(coupon.developerId)) {
        return {
          error:
            'This seller coupon only works on that developer’s products. Company Buy Now needs a platform (Admin) coupon.',
        };
      }
    }
  }
  return { coupon };
};

module.exports = {
  overlapIds,
  validateProjectScope,
  projectAllowed,
  computeCouponSplit,
  findValidCoupon,
};
