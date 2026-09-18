const ContactMessage = require('../models/ContactMessage');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { sendEmail } = require('../utils/mailer');

const createContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return sendError(res, 'Name, email and message are required', 400);
    }

    const doc = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone,
      subject,
      message: message.trim(),
    });

    await sendEmail({
      to: process.env.CONTACT_NOTIFY_EMAIL || process.env.SMTP_USER,
      subject: `Contact: ${subject || 'New message'} — ${name}`,
      text: `${name} <${email}>\nPhone: ${phone || '—'}\n\n${message}`,
    });

    sendSuccess(res, { id: doc._id }, 'Message sent', 201);
  } catch (error) {
    next(error);
  }
};

const getAdminContacts = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search?.trim()) {
      const q = req.query.search.trim();
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { subject: new RegExp(q, 'i') },
        { message: new RegExp(q, 'i') },
      ];
    }

    const [rows, total] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ContactMessage.countDocuments(filter),
    ]);

    sendPaginated(res, rows, buildPaginationMeta(total, page, limit), 'Contact messages fetched');
  } catch (error) {
    next(error);
  }
};

const updateAdminContactStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['new', 'read', 'replied', 'archived'];
    if (!allowed.includes(status)) {
      return sendError(res, 'Invalid status', 400);
    }

    const doc = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).lean();

    if (!doc) return sendError(res, 'Contact message not found', 404);
    sendSuccess(res, doc, 'Contact status updated');
  } catch (error) {
    next(error);
  }
};

module.exports = { createContact, getAdminContacts, updateAdminContactStatus };
