const Review = require('../models/Review');
const Project = require('../models/Project');
const Quotation = require('../models/Quotation');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { writeAuditLog } = require('../utils/auditLog');

const refreshProjectRating = async (projectId) => {
  const agg = await Review.aggregate([
    { $match: { projectId, status: 'approved' } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avg = agg[0]?.avg || 0;
  const count = agg[0]?.count || 0;
  await Project.findByIdAndUpdate(projectId, {
    ratingAvg: Math.round(avg * 10) / 10,
    ratingCount: count,
  });
};

const createReview = async (req, res, next) => {
  try {
    const { projectId, rating, comment, quotationId } = req.body;
    if (!projectId || !rating) return sendError(res, 'projectId and rating required', 400);
    const r = Number(rating);
    if (r < 1 || r > 5) return sendError(res, 'Rating must be 1–5', 400);

    const paid = await Quotation.findOne({
      clientId: req.user._id,
      projectId,
      status: { $in: ['paid', 'partially_paid'] },
      ...(quotationId ? { _id: quotationId } : {}),
    });
    if (!paid) {
      return sendError(res, 'You can review only after a paid purchase of this project', 403);
    }

    const existing = await Review.findOne({ projectId, clientId: req.user._id });
    if (existing) return sendError(res, 'You already reviewed this project', 400);

    const doc = await Review.create({
      projectId,
      clientId: req.user._id,
      quotationId: paid._id,
      rating: r,
      comment: comment || '',
      status: 'pending',
    });

    sendSuccess(res, doc, 'Review submitted for moderation', 201);
  } catch (error) {
    next(error);
  }
};

const listProjectReviews = async (req, res, next) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug }).select('_id ratingAvg ratingCount');
    if (!project) return sendError(res, 'Project not found', 404);
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 10);
    const [rows, total] = await Promise.all([
      Review.find({ projectId: project._id, status: 'approved' })
        .populate('clientId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ projectId: project._id, status: 'approved' }),
    ]);
    sendSuccess(
      res,
      {
        reviews: rows,
        ratingAvg: project.ratingAvg,
        ratingCount: project.ratingCount,
        pagination: buildPaginationMeta(total, page, limit),
      },
      'Reviews fetched'
    );
  } catch (error) {
    next(error);
  }
};

const listAdminReviews = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const [rows, total] = await Promise.all([
      Review.find(filter)
        .populate('projectId', 'title slug')
        .populate('clientId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);
    sendPaginated(res, rows, buildPaginationMeta(total, page, limit), 'Reviews fetched');
  } catch (error) {
    next(error);
  }
};

const moderateReview = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'hidden', 'pending'].includes(status)) {
      return sendError(res, 'Invalid status', 400);
    }
    const doc = await Review.findById(req.params.id);
    if (!doc) return sendError(res, 'Review not found', 404);
    doc.status = status;
    doc.moderatedBy = req.user._id;
    doc.moderatedAt = new Date();
    await doc.save();
    await refreshProjectRating(doc.projectId);
    await writeAuditLog({
      actorId: req.user._id,
      action: 'review.moderate',
      entityType: 'Review',
      entityId: doc._id,
      meta: { status },
      ip: req.ip,
    });
    sendSuccess(res, doc, 'Review updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  listProjectReviews,
  listAdminReviews,
  moderateReview,
};
