const SupportTicket = require('../models/SupportTicket');
const generateBusinessId = require('../utils/generateBusinessId');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { writeAuditLog } = require('../utils/auditLog');

const createTicket = async (req, res, next) => {
  try {
    const { subject, body, category, relatedProjectId, relatedQuotationId } = req.body;
    if (!subject?.trim() || !body?.trim()) {
      return sendError(res, 'Subject and message required', 400);
    }
    const ticket = await SupportTicket.create({
      ticketId: generateBusinessId('TKT'),
      userId: req.user._id,
      subject: subject.trim(),
      category: category || 'other',
      relatedProjectId,
      relatedQuotationId,
      messages: [{ senderId: req.user._id, body: body.trim() }],
    });
    sendSuccess(res, ticket, 'Support ticket created', 201);
  } catch (error) {
    next(error);
  }
};

const listMyTickets = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const filter = { userId: req.user._id };
    if (req.query.status) filter.status = req.query.status;
    const [rows, total] = await Promise.all([
      SupportTicket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SupportTicket.countDocuments(filter),
    ]);
    sendPaginated(res, rows, buildPaginationMeta(total, page, limit), 'Tickets fetched');
  } catch (error) {
    next(error);
  }
};

const getMyTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
      .populate('messages.senderId', 'name role')
      .lean();
    if (!ticket) return sendError(res, 'Ticket not found', 404);
    sendSuccess(res, ticket, 'Ticket fetched');
  } catch (error) {
    next(error);
  }
};

const replyMyTicket = async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) return sendError(res, 'Message required', 400);
    const ticket = await SupportTicket.findOne({ _id: req.params.id, userId: req.user._id });
    if (!ticket) return sendError(res, 'Ticket not found', 404);
    if (['closed'].includes(ticket.status)) {
      return sendError(res, 'Ticket is closed', 400);
    }
    ticket.messages.push({ senderId: req.user._id, body: body.trim() });
    if (ticket.status === 'resolved') ticket.status = 'open';
    await ticket.save();
    sendSuccess(res, ticket, 'Reply added');
  } catch (error) {
    next(error);
  }
};

const listAdminTickets = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const [rows, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('userId', 'name email role')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicket.countDocuments(filter),
    ]);
    sendPaginated(res, rows, buildPaginationMeta(total, page, limit), 'Tickets fetched');
  } catch (error) {
    next(error);
  }
};

const getAdminTicket = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('userId', 'name email role')
      .populate('messages.senderId', 'name role')
      .lean();
    if (!ticket) return sendError(res, 'Ticket not found', 404);
    sendSuccess(res, ticket, 'Ticket fetched');
  } catch (error) {
    next(error);
  }
};

const updateAdminTicket = async (req, res, next) => {
  try {
    const { status, body, priority } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return sendError(res, 'Ticket not found', 404);

    if (status && ['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      ticket.status = status;
    }
    if (priority && ['low', 'normal', 'high'].includes(priority)) {
      ticket.priority = priority;
    }
    if (body?.trim()) {
      ticket.messages.push({ senderId: req.user._id, body: body.trim() });
    }
    await ticket.save();
    await writeAuditLog({
      actorId: req.user._id,
      action: 'ticket.update',
      entityType: 'SupportTicket',
      entityId: ticket._id,
      meta: { status: ticket.status },
      ip: req.ip,
    });
    sendSuccess(res, ticket, 'Ticket updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTicket,
  listMyTickets,
  getMyTicket,
  replyMyTicket,
  listAdminTickets,
  getAdminTicket,
  updateAdminTicket,
};
