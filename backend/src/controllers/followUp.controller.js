const FollowUp = require('../models/FollowUp');
const User = require('../models/User');
const { sendSuccess, sendPaginated, sendError } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { canViewRole } = require('../middleware/role.middleware');
const { writeAuditLog } = require('../utils/auditLog');

const listFollowUps = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const filter = {};
    if (req.query.subjectUserId) filter.subjectUserId = req.query.subjectUserId;
    if (req.query.agentId) filter.agentId = req.query.agentId;
    if (req.query.upcoming === '1') {
      filter.nextFollowUpAt = { $gte: new Date() };
      filter.reminderDone = false;
    }
    if (req.query.overdue === '1') {
      filter.nextFollowUpAt = { $lt: new Date() };
      filter.reminderDone = false;
    }
    // Support agents see all CRM follow-ups (team shared) — or only own if ?mine=1
    if (req.query.mine === '1' || req.user.role === 'support_agent') {
      if (req.query.mine === '1') filter.agentId = req.user._id;
    }

    const [rows, total] = await Promise.all([
      FollowUp.find(filter)
        .populate('agentId', 'name email role')
        .populate('subjectUserId', 'name email role phone')
        .sort({ nextFollowUpAt: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FollowUp.countDocuments(filter),
    ]);

    sendPaginated(res, rows, buildPaginationMeta(total, page, limit), 'Follow-ups fetched');
  } catch (error) {
    next(error);
  }
};

const createFollowUp = async (req, res, next) => {
  try {
    const {
      subjectUserId,
      channel,
      notes,
      nextFollowUpAt,
      relatedRequirementId,
      relatedCustomizationId,
      relatedTicketId,
      relatedProjectId,
    } = req.body;

    if (!subjectUserId || !notes?.trim()) {
      return sendError(res, 'subjectUserId and notes required', 400);
    }

    const subject = await User.findById(subjectUserId).select('role name');
    if (!subject) return sendError(res, 'Subject user not found', 404);
    if (!canViewRole(req.user.role, subject.role) && !['developer', 'client'].includes(subject.role)) {
      return sendError(res, 'Cannot create follow-up for this user', 403);
    }
    if (!['developer', 'client'].includes(subject.role)) {
      return sendError(res, 'Follow-ups are for clients and developers only', 400);
    }

    const doc = await FollowUp.create({
      agentId: req.user._id,
      subjectUserId,
      channel: channel || 'call',
      notes: notes.trim(),
      nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : undefined,
      relatedRequirementId,
      relatedCustomizationId,
      relatedTicketId,
      relatedProjectId,
    });

    await writeAuditLog({
      actorId: req.user._id,
      action: 'followup.create',
      entityType: 'FollowUp',
      entityId: doc._id,
      meta: { subjectUserId, channel: doc.channel },
      ip: req.ip,
    });

    sendSuccess(res, doc, 'Follow-up saved', 201);
  } catch (error) {
    next(error);
  }
};

const updateFollowUp = async (req, res, next) => {
  try {
    const doc = await FollowUp.findById(req.params.id);
    if (!doc) return sendError(res, 'Follow-up not found', 404);

    if (
      req.user.role === 'support_agent' &&
      String(doc.agentId) !== String(req.user._id) &&
      req.body.notes
    ) {
      // agents can still mark reminder done on shared board
    }

    const { notes, channel, nextFollowUpAt, reminderDone } = req.body;
    if (notes !== undefined) doc.notes = String(notes).trim();
    if (channel) doc.channel = channel;
    if (nextFollowUpAt !== undefined) {
      doc.nextFollowUpAt = nextFollowUpAt ? new Date(nextFollowUpAt) : undefined;
    }
    if (reminderDone !== undefined) doc.reminderDone = Boolean(reminderDone);

    await doc.save();
    sendSuccess(res, doc, 'Follow-up updated');
  } catch (error) {
    next(error);
  }
};

const followUpReport = async (req, res, next) => {
  try {
    const match = {};
    if (req.user.role === 'support_agent' && req.query.all !== '1') {
      match.agentId = req.user._id;
    }
    if (req.query.agentId && ['admin', 'super_admin'].includes(req.user.role)) {
      match.agentId = req.query.agentId;
    }

    const [byChannel, byAgent, upcoming, overdue, total] = await Promise.all([
      FollowUp.aggregate([
        { $match: match },
        { $group: { _id: '$channel', count: { $sum: 1 } } },
      ]),
      FollowUp.aggregate([
        { $match: match },
        { $group: { _id: '$agentId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      FollowUp.countDocuments({
        ...match,
        reminderDone: false,
        nextFollowUpAt: { $gte: new Date() },
      }),
      FollowUp.countDocuments({
        ...match,
        reminderDone: false,
        nextFollowUpAt: { $lt: new Date() },
      }),
      FollowUp.countDocuments(match),
    ]);

    const agentIds = byAgent.map((a) => a._id).filter(Boolean);
    const agents = await User.find({ _id: { $in: agentIds } }).select('name email').lean();
    const agentMap = Object.fromEntries(agents.map((a) => [String(a._id), a]));

    sendSuccess(
      res,
      {
        total,
        upcoming,
        overdue,
        byChannel: byChannel.map((c) => ({ channel: c._id, count: c.count })),
        byAgent: byAgent.map((a) => ({
          agentId: a._id,
          name: agentMap[String(a._id)]?.name || 'Agent',
          count: a.count,
        })),
      },
      'Follow-up report'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listFollowUps,
  createFollowUp,
  updateFollowUp,
  followUpReport,
};
