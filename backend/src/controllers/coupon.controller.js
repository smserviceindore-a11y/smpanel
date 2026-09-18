const Coupon = require('../models/Coupon');
const Project = require('../models/Project');
const { sendSuccess, sendPaginated, sendError } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const {
  validateProjectScope,
  findValidCoupon,
  computeCouponSplit,
} = require('../services/coupon.service');

const normalizeIds = (arr) =>
  Array.isArray(arr) ? [...new Set(arr.map(String).filter(Boolean))] : [];

const createCoupon = async (req, res, next) => {
  try {
    const role = req.user.role;
    if (!['developer', 'admin', 'super_admin'].includes(role)) {
      return sendError(res, 'Not allowed to create coupons', 403);
    }

    const {
      code,
      discountType,
      discountValue,
      projectScope = 'all',
      includeProjectIds = [],
      excludeProjectIds = [],
      maxUses = 0,
      minOrderAmount = 0,
      expiresAt,
      description,
      isActive = true,
    } = req.body;

    if (!code || !String(code).trim()) return sendError(res, 'Coupon code required', 400);
    const value = Number(discountValue);
    if (!value || value <= 0) return sendError(res, 'Valid discountValue required', 400);

    let type = discountType;
    if (role === 'developer') {
      type = 'percent';
      if (value > 100) return sendError(res, 'Developer coupons max 100%', 400);
    } else {
      if (!['percent', 'fixed'].includes(type)) {
        return sendError(res, 'discountType must be percent or fixed', 400);
      }
      if (type === 'percent' && value > 100) return sendError(res, 'Percent max 100', 400);
    }

    const include = normalizeIds(includeProjectIds);
    const exclude = normalizeIds(excludeProjectIds);
    const scopeErr = validateProjectScope({
      projectScope,
      includeProjectIds: include,
      excludeProjectIds: exclude,
    });
    if (scopeErr) return sendError(res, scopeErr, 400);

    // Developers can only target their own projects
    if (role === 'developer') {
      if (include.length || exclude.length) {
        const ids = [...include, ...exclude];
        const owned = await Project.countDocuments({
          _id: { $in: ids },
          developerId: req.user._id,
        });
        if (owned !== ids.length) {
          return sendError(res, 'You can only include/exclude your own projects', 403);
        }
      }
    }

    const coupon = await Coupon.create({
      code: String(code).trim().toUpperCase(),
      createdBy: req.user._id,
      creatorRole: role,
      discountType: type,
      discountValue: value,
      projectScope: ['all', 'include', 'exclude'].includes(projectScope) ? projectScope : 'all',
      includeProjectIds: include,
      excludeProjectIds: exclude,
      developerId: role === 'developer' ? req.user._id : undefined,
      maxUses: Math.max(0, Number(maxUses) || 0),
      minOrderAmount: Math.max(0, Number(minOrderAmount) || 0),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      description,
      isActive: Boolean(isActive),
    });

    sendSuccess(res, coupon, 'Coupon created', 201);
  } catch (error) {
    if (error.code === 11000) return sendError(res, 'Coupon code already exists', 400);
    next(error);
  }
};

const listCoupons = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const filter = {};
    if (req.user.role === 'developer') {
      filter.createdBy = req.user._id;
    } else if (req.query.createdBy) {
      filter.createdBy = req.query.createdBy;
    }
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      filter.code = new RegExp(String(req.query.search).trim(), 'i');
    }

    const [rows, total] = await Promise.all([
      Coupon.find(filter)
        .populate('createdBy', 'name email role')
        .populate('includeProjectIds', 'title slug')
        .populate('excludeProjectIds', 'title slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Coupon.countDocuments(filter),
    ]);

    sendPaginated(res, rows, buildPaginationMeta(total, page, limit), 'Coupons fetched');
  } catch (error) {
    next(error);
  }
};

const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return sendError(res, 'Coupon not found', 404);

    if (req.user.role === 'developer' && String(coupon.createdBy) !== String(req.user._id)) {
      return sendError(res, 'Not your coupon', 403);
    }

    const {
      isActive,
      maxUses,
      minOrderAmount,
      expiresAt,
      description,
      projectScope,
      includeProjectIds,
      excludeProjectIds,
      discountValue,
    } = req.body;

    if (isActive !== undefined) coupon.isActive = Boolean(isActive);
    if (maxUses !== undefined) coupon.maxUses = Math.max(0, Number(maxUses) || 0);
    if (minOrderAmount !== undefined) coupon.minOrderAmount = Math.max(0, Number(minOrderAmount) || 0);
    if (expiresAt !== undefined) coupon.expiresAt = expiresAt ? new Date(expiresAt) : undefined;
    if (description !== undefined) coupon.description = description;

    if (discountValue !== undefined) {
      const v = Number(discountValue);
      if (!v || v <= 0) return sendError(res, 'Invalid discountValue', 400);
      if (coupon.discountType === 'percent' && v > 100) return sendError(res, 'Percent max 100', 400);
      if (coupon.creatorRole === 'developer' && coupon.discountType !== 'percent') {
        return sendError(res, 'Developer coupons must stay percent', 400);
      }
      coupon.discountValue = v;
    }

    if (projectScope || includeProjectIds || excludeProjectIds) {
      const include = includeProjectIds
        ? normalizeIds(includeProjectIds)
        : (coupon.includeProjectIds || []).map(String);
      const exclude = excludeProjectIds
        ? normalizeIds(excludeProjectIds)
        : (coupon.excludeProjectIds || []).map(String);
      const scope = projectScope || coupon.projectScope;
      const scopeErr = validateProjectScope({
        projectScope: scope,
        includeProjectIds: include,
        excludeProjectIds: exclude,
      });
      if (scopeErr) return sendError(res, scopeErr, 400);
      coupon.projectScope = scope;
      coupon.includeProjectIds = include;
      coupon.excludeProjectIds = exclude;
    }

    await coupon.save();
    sendSuccess(res, coupon, 'Coupon updated');
  } catch (error) {
    next(error);
  }
};

/** Preview coupon for client checkout */
const previewCoupon = async (req, res, next) => {
  try {
    const { code, quotationId, amount } = req.body;
    const Quotation = require('../models/Quotation');
    let q = null;
    if (quotationId) {
      q = await Quotation.findById(quotationId);
      if (!q) return sendError(res, 'Quotation not found', 404);
    }

    const originalAmount = Number(amount) || q?.total || 0;
    const { coupon, error } = await findValidCoupon({
      code,
      projectId: q?.projectId,
      developerIdOnQuote: q?.developerId,
      leadType: q?.leadType || req.body?.leadType,
    });
    if (error) return sendError(res, error, 400);
    if (coupon.minOrderAmount > originalAmount) {
      return sendError(res, `Minimum order ₹${coupon.minOrderAmount} required`, 400);
    }

    const split = await computeCouponSplit({
      originalAmount,
      commissionRate: q?.commissionRate ?? 30,
      hasDeveloper: Boolean(q?.developerId),
      coupon,
    });

    // Client only sees discount + pay amount (not platform/dev split)
    sendSuccess(
      res,
      {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        originalAmount: split.originalAmount,
        discount: split.discount,
        clientPays: split.clientPays,
        description: coupon.description || '',
      },
      'Coupon applicable'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCoupon,
  listCoupons,
  updateCoupon,
  previewCoupon,
};
