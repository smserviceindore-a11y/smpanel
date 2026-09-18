const ChatSession = require('../models/ChatSession');
const { sendSuccess, sendPaginated, sendError } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const generateBusinessId = require('../utils/generateBusinessId');
const { welcomeMessage, maybeBuildAutoReply } = require('../utils/chatAutoReply');

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());
const phoneOk = (p) => String(p || '').replace(/\D/g, '').length >= 10;

const publicSession = (session) => ({
  id: session._id,
  chatId: session.chatId,
  accessToken: session.accessToken,
  visitorName: session.visitorName,
  visitorEmail: session.visitorEmail,
  visitorPhone: session.visitorPhone,
  status: session.status,
  messages: (session.messages || []).map((m) => ({
    id: m._id,
    sender: m.sender,
    senderName: m.senderName,
    body: m.body,
    createdAt: m.createdAt,
  })),
  updatedAt: session.updatedAt,
});

const findByAccess = async (id, token) => {
  if (!id || !token) return null;
  return ChatSession.findOne({ _id: id, accessToken: String(token) });
};

/** POST /api/chat/start — guest or logged-in */
const startChat = async (req, res, next) => {
  try {
    const name = String(req.body.name || req.user?.name || '').trim();
    const email = String(req.body.email || req.user?.email || '')
      .trim()
      .toLowerCase();
    const phone = String(req.body.phone || req.user?.phone || '').trim();
    const firstMessage = String(req.body.message || '').trim();

    if (!name) return sendError(res, 'Name is required', 400);
    if (!emailOk(email)) return sendError(res, 'Valid email is required', 400);
    if (!phoneOk(phone)) return sendError(res, 'Valid phone number is required (min 10 digits)', 400);

    const session = await ChatSession.create({
      chatId: generateBusinessId('CH'),
      visitorName: name,
      visitorEmail: email,
      visitorPhone: phone,
      userId: req.user?._id || undefined,
      status: 'open',
      messages: [],
      autoReplyCount: 0,
      humanReplied: false,
    });

    const welcome = welcomeMessage(name);
    session.messages.push({
      sender: 'team',
      senderName: welcome.senderName,
      body: welcome.body,
    });
    session.autoReplyCount = 1;
    session.lastTeamAt = new Date();

    if (firstMessage) {
      session.messages.push({
        sender: 'visitor',
        senderName: name,
        body: firstMessage,
      });
      session.lastVisitorAt = new Date();
      const auto = maybeBuildAutoReply(session, firstMessage);
      if (auto) {
        session.messages.push({
          sender: 'team',
          senderName: auto.senderName,
          body: auto.body,
        });
        session.lastTeamAt = new Date();
      }
      session.status = 'active';
    }

    await session.save();
    sendSuccess(res, publicSession(session), 'Chat started', 201);
  } catch (error) {
    next(error);
  }
};

/** GET /api/chat/:id?token= */
const getChat = async (req, res, next) => {
  try {
    const session = await findByAccess(req.params.id, req.query.token || req.headers['x-chat-token']);
    if (!session) return sendError(res, 'Chat not found', 404);
    sendSuccess(res, publicSession(session), 'Chat fetched');
  } catch (error) {
    next(error);
  }
};

/** POST /api/chat/:id/messages  { token, body } */
const postVisitorMessage = async (req, res, next) => {
  try {
    const token = req.body.token || req.headers['x-chat-token'];
    const body = String(req.body.body || '').trim();
    if (!body) return sendError(res, 'Message is required', 400);

    const session = await findByAccess(req.params.id, token);
    if (!session) return sendError(res, 'Chat not found', 404);
    if (session.status === 'closed') return sendError(res, 'This chat is closed', 400);

    session.messages.push({
      sender: 'visitor',
      senderName: session.visitorName,
      body,
    });
    session.lastVisitorAt = new Date();
    session.status = 'waiting';

    // Max 2 predefined replies; stop completely after a human staff reply
    const auto = maybeBuildAutoReply(session, body);
    if (auto) {
      session.messages.push({
        sender: 'team',
        senderName: auto.senderName,
        body: auto.body,
      });
      session.lastTeamAt = new Date();
      session.status = 'active';
    }

    await session.save();
    sendSuccess(res, publicSession(session), 'Message sent');
  } catch (error) {
    next(error);
  }
};

/** Staff: list chats */
const listStaffChats = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const q = String(req.query.search).trim();
      filter.$or = [
        { visitorName: new RegExp(q, 'i') },
        { visitorEmail: new RegExp(q, 'i') },
        { visitorPhone: new RegExp(q, 'i') },
        { chatId: new RegExp(q, 'i') },
      ];
    }

    const [rows, total] = await Promise.all([
      ChatSession.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-accessToken')
        .lean(),
      ChatSession.countDocuments(filter),
    ]);

    const data = rows.map((s) => ({
      ...s,
      id: s._id,
      lastMessage: s.messages?.[s.messages.length - 1] || null,
      messageCount: s.messages?.length || 0,
    }));

    sendPaginated(res, data, buildPaginationMeta(total, page, limit), 'Live chats');
  } catch (error) {
    next(error);
  }
};

const getStaffChat = async (req, res, next) => {
  try {
    const session = await ChatSession.findById(req.params.id).lean();
    if (!session) return sendError(res, 'Chat not found', 404);
    sendSuccess(
      res,
      {
        ...session,
        id: session._id,
        accessToken: undefined,
      },
      'Chat detail'
    );
  } catch (error) {
    next(error);
  }
};

const replyStaffChat = async (req, res, next) => {
  try {
    const body = String(req.body.body || '').trim();
    if (!body) return sendError(res, 'Message is required', 400);

    const session = await ChatSession.findById(req.params.id);
    if (!session) return sendError(res, 'Chat not found', 404);

    session.messages.push({
      sender: 'team',
      senderName: req.user?.name || 'Support Team',
      body,
    });
    session.humanReplied = true;
    session.lastTeamAt = new Date();
    session.status = 'active';
    session.assignedTo = req.user?._id;
    await session.save();

    sendSuccess(res, publicSession(session), 'Reply sent');
  } catch (error) {
    next(error);
  }
};

const updateStaffChat = async (req, res, next) => {
  try {
    const session = await ChatSession.findById(req.params.id);
    if (!session) return sendError(res, 'Chat not found', 404);
    if (req.body.status && ['open', 'waiting', 'active', 'closed'].includes(req.body.status)) {
      session.status = req.body.status;
    }
    await session.save();
    sendSuccess(res, { id: session._id, status: session.status }, 'Chat updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startChat,
  getChat,
  postVisitorMessage,
  listStaffChats,
  getStaffChat,
  replyStaffChat,
  updateStaffChat,
};
