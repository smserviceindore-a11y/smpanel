const User = require('../models/User');
const Project = require('../models/Project');
const Quotation = require('../models/Quotation');
const Transaction = require('../models/Transaction');
const Requirement = require('../models/Requirement');
const CustomizationRequest = require('../models/CustomizationRequest');
const SupportTicket = require('../models/SupportTicket');
const FollowUp = require('../models/FollowUp');
const { sendSuccess, sendPaginated, sendError } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { publicUser } = require('./auth.controller');
const { canViewRole, canCreateRole, VIEWABLE_ROLES, CREATABLE_ROLES } = require('../middleware/role.middleware');
const { writeAuditLog } = require('../utils/auditLog');

const listDirectoryUsers = async (req, res, next) => {
  try {
    const actor = req.user;
    const allowed = VIEWABLE_ROLES[actor.role] || [];
    if (!allowed.length) return sendError(res, 'Access denied', 403);

    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const filter = { role: { $in: allowed } };

    if (req.query.role) {
      if (!allowed.includes(req.query.role)) {
        return sendError(res, 'You cannot list this role', 403);
      }
      filter.role = req.query.role;
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.verificationStatus) filter.verificationStatus = req.query.verificationStatus;
    if (req.query.search) {
      const { escapeRegex } = require('../utils/excelExport');
      const q = escapeRegex(String(req.query.search).trim());
      filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
    }

    const [users, total, counts] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password').lean(),
      User.countDocuments(filter),
      User.aggregate([
        { $match: { role: { $in: allowed } } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
    ]);

    const byRole = Object.fromEntries(allowed.map((r) => [r, 0]));
    counts.forEach((c) => {
      byRole[c._id] = c.count;
    });

    sendPaginated(
      res,
      users.map(publicUser),
      {
        ...buildPaginationMeta(total, page, limit),
        byRole,
        creatableRoles: CREATABLE_ROLES[actor.role] || [],
      },
      'Users fetched'
    );
  } catch (error) {
    next(error);
  }
};

const createDirectoryUser = async (req, res, next) => {
  try {
    const actor = req.user;
    if (!['admin', 'super_admin'].includes(actor.role)) {
      return sendError(res, 'Only Admin or Master Admin can create users', 403);
    }

    const { name, email, phone, password, role } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
      return sendError(res, 'Name, email and password required', 400);
    }
    if (!canCreateRole(actor.role, role)) {
      return sendError(res, `You cannot create a user with role: ${role}`, 403);
    }

    const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (exists) return sendError(res, 'Email already exists', 409);

    const user = await User.create({
      name: name.trim(),
      email: String(email).toLowerCase().trim(),
      phone: phone || '',
      password,
      role,
      status: 'active',
      verificationStatus: role === 'developer' ? 'pending' : 'verified',
    });

    await writeAuditLog({
      actorId: actor._id,
      action: 'user.create',
      entityType: 'User',
      entityId: user._id,
      meta: { role },
      ip: req.ip,
    });

    sendSuccess(res, publicUser(user), 'User created', 201);
  } catch (error) {
    next(error);
  }
};

const updateDirectoryUser = async (req, res, next) => {
  try {
    const actor = req.user;
    if (!['admin', 'super_admin'].includes(actor.role)) {
      return sendError(res, 'Only Admin or Master Admin can update users', 403);
    }

    const user = await User.findById(req.params.id).select('+password');
    if (!user) return sendError(res, 'User not found', 404);

    if (!canViewRole(actor.role, user.role) && actor.role !== 'super_admin') {
      return sendError(res, 'You cannot manage this user', 403);
    }
    if (user.role === 'super_admin' && actor.role !== 'super_admin') {
      return sendError(res, 'Only Master Admin can manage Master Admins', 403);
    }
    if (
      user.role === 'super_admin' &&
      actor.role === 'super_admin' &&
      String(actor._id) !== String(user._id) &&
      req.body.role &&
      req.body.role !== 'super_admin'
    ) {
      // demoting another master — allow only by master
    }
    if (user.role === 'admin' && actor.role === 'admin' && String(actor._id) !== String(user._id)) {
      return sendError(res, 'Admins cannot manage other admins', 403);
    }

    const { name, email, phone, password, status, verificationStatus, commissionRate, profile } =
      req.body;

    if (name !== undefined) user.name = String(name).trim();
    if (email !== undefined) {
      const nextEmail = String(email).toLowerCase().trim();
      const clash = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
      if (clash) return sendError(res, 'Email already in use', 409);
      user.email = nextEmail;
    }
    if (phone !== undefined) user.phone = phone;
    if (password) user.password = password;
    if (status) user.status = status;
    if (verificationStatus) user.verificationStatus = verificationStatus;
    if (commissionRate !== undefined && actor.role === 'super_admin') {
      user.commissionRate = Number(commissionRate);
    }
    if (profile && typeof profile === 'object') {
      user.profile = { ...(user.profile?.toObject?.() || user.profile || {}), ...profile };
    }

    // Role change: only master admin, and only to creatable roles
    if (req.body.role && actor.role === 'super_admin') {
      if (!canCreateRole('super_admin', req.body.role)) {
        return sendError(res, 'Invalid role', 400);
      }
      if (String(user._id) === String(actor._id) && req.body.role !== 'super_admin') {
        return sendError(res, 'Cannot demote your own Master Admin account', 400);
      }
      user.role = req.body.role;
    }

    await user.save();
    await writeAuditLog({
      actorId: actor._id,
      action: 'user.update',
      entityType: 'User',
      entityId: user._id,
      meta: { fields: Object.keys(req.body) },
      ip: req.ip,
    });

    sendSuccess(res, publicUser(user), 'User updated');
  } catch (error) {
    next(error);
  }
};

const getDirectoryUserDetail = async (req, res, next) => {
  try {
    const actor = req.user;
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) return sendError(res, 'User not found', 404);
    if (!canViewRole(actor.role, user.role)) {
      return sendError(res, 'You cannot view this user', 403);
    }

    const base = { user: publicUser(user) };

    if (user.role === 'developer') {
      const projects = await Project.find({ developerId: user._id })
        .select('title slug status featured price buyNowEnabled ratingAvg ratingCount createdAt ownerType')
        .sort({ createdAt: -1 })
        .lean();

      const projectIds = projects.map((p) => p._id);
      const paidTx = await Transaction.find({
        developerId: user._id,
        status: 'paid',
      })
        .populate({
          path: 'quotationId',
          select: 'quotationId title projectId clientId clientName total leadType',
          populate: { path: 'projectId', select: 'title slug' },
        })
        .populate('clientId', 'name email')
        .sort({ paidAt: -1 })
        .lean();

      let grossSales = 0;
      let platformCommission = 0;
      let developerShare = 0;
      const salesByProject = {};
      const buyers = {};

      paidTx.forEach((t) => {
        grossSales += Number(t.amount) || 0;
        platformCommission += Number(t.platformCommission) || 0;
        developerShare += Number(t.developerShare) || 0;
        const pid = String(t.quotationId?.projectId?._id || t.quotationId?.projectId || '');
        if (pid) {
          if (!salesByProject[pid]) {
            salesByProject[pid] = {
              projectId: pid,
              title: t.quotationId?.projectId?.title || 'Project',
              slug: t.quotationId?.projectId?.slug,
              orders: 0,
              gross: 0,
              platform: 0,
              developer: 0,
            };
          }
          salesByProject[pid].orders += 1;
          salesByProject[pid].gross += Number(t.amount) || 0;
          salesByProject[pid].platform += Number(t.platformCommission) || 0;
          salesByProject[pid].developer += Number(t.developerShare) || 0;
        }
        const cid = String(t.clientId?._id || t.clientId || '');
        if (cid) {
          if (!buyers[cid]) {
            buyers[cid] = {
              clientId: cid,
              name: t.clientId?.name || t.quotationId?.clientName || 'Client',
              email: t.clientId?.email || '',
              orders: 0,
              spent: 0,
            };
          }
          buyers[cid].orders += 1;
          buyers[cid].spent += Number(t.amount) || 0;
        }
      });

      const monthly = {};
      paidTx.forEach((t) => {
        const d = t.paidAt || t.createdAt;
        if (!d) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthly[key] = (monthly[key] || 0) + (Number(t.amount) || 0);
      });

      return sendSuccess(res, {
        ...base,
        kind: 'developer',
        projects,
        sales: {
          orders: paidTx.length,
          grossSales,
          platformCommission,
          developerShare,
          byProject: Object.values(salesByProject),
          buyers: Object.values(buyers),
          recentTransactions: paidTx.slice(0, 20),
          monthlyChart: Object.entries(monthly)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, amount]) => ({ month, amount })),
        },
        canEditCredentials: ['admin', 'super_admin'].includes(actor.role),
      });
    }

    if (user.role === 'client') {
      const [requirements, customizations, quotations, paidTx, tickets, followUps] =
        await Promise.all([
          Requirement.find({
            $or: [{ clientId: user._id }, { email: user.email }],
          })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean(),
          CustomizationRequest.find({
            $or: [{ clientId: user._id }, { email: user.email }],
          })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean(),
          Quotation.find({ clientId: user._id })
            .populate('projectId', 'title slug')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean(),
          Transaction.find({ clientId: user._id, status: 'paid' })
            .populate({
              path: 'quotationId',
              select: 'quotationId title projectId leadType',
              populate: { path: 'projectId', select: 'title slug' },
            })
            .sort({ paidAt: -1 })
            .lean(),
          SupportTicket.find({ userId: user._id }).sort({ updatedAt: -1 }).limit(20).lean(),
          FollowUp.find({ subjectUserId: user._id })
            .populate('agentId', 'name email')
            .sort({ createdAt: -1 })
            .limit(30)
            .lean(),
        ]);

      const spent = paidTx.reduce((s, t) => s + (Number(t.amount) || 0), 0);
      const monthly = {};
      paidTx.forEach((t) => {
        const d = t.paidAt || t.createdAt;
        if (!d) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthly[key] = (monthly[key] || 0) + (Number(t.amount) || 0);
      });

      return sendSuccess(res, {
        ...base,
        kind: 'client',
        stats: {
          requirements: requirements.length,
          customizations: customizations.length,
          quotations: quotations.length,
          paidOrders: paidTx.length,
          totalSpent: spent,
          openTickets: tickets.filter((t) => ['open', 'in_progress'].includes(t.status)).length,
        },
        requirements,
        customizations,
        quotations,
        purchases: paidTx,
        tickets,
        followUps,
        charts: {
          monthlySpend: Object.entries(monthly)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, amount]) => ({ month, amount })),
        },
        canEditCredentials: ['admin', 'super_admin'].includes(actor.role),
      });
    }

    // Staff roles (admin / super_admin / support_agent)
    const [followUpsCreated, ticketsHandled] = await Promise.all([
      FollowUp.countDocuments({ agentId: user._id }),
      SupportTicket.countDocuments({
        'messages.senderId': user._id,
      }),
    ]);

    return sendSuccess(res, {
      ...base,
      kind: 'staff',
      stats: {
        followUpsCreated,
        ticketsTouched: ticketsHandled,
      },
      canEditCredentials:
        actor.role === 'super_admin' ||
        (actor.role === 'admin' && ['support_agent', 'developer', 'client'].includes(user.role)),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listDirectoryUsers,
  createDirectoryUser,
  updateDirectoryUser,
  getDirectoryUserDetail,
};
