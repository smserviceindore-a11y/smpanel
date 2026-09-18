const mongoose = require('mongoose');
const crypto = require('crypto');

const chatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ['visitor', 'team', 'system'],
      required: true,
    },
    senderName: { type: String, trim: true, default: '' },
    body: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const chatSessionSchema = new mongoose.Schema(
  {
    chatId: { type: String, unique: true, required: true },
    /** Secret so guests can poll/send without login */
    accessToken: {
      type: String,
      required: true,
      default: () => crypto.randomBytes(24).toString('hex'),
    },
    visitorName: { type: String, required: true, trim: true },
    visitorEmail: { type: String, required: true, trim: true, lowercase: true },
    visitorPhone: { type: String, required: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['open', 'waiting', 'active', 'closed'],
      default: 'open',
    },
    messages: { type: [chatMessageSchema], default: [] },
    /** Predefined bot replies used (welcome + keyword). Cap in controller. */
    autoReplyCount: { type: Number, default: 0, min: 0 },
    /** True once a real staff member replies — stops all auto replies */
    humanReplied: { type: Boolean, default: false },
    lastVisitorAt: { type: Date, default: Date.now },
    lastTeamAt: Date,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

chatSessionSchema.index({ status: 1, updatedAt: -1 });
chatSessionSchema.index({ visitorEmail: 1, createdAt: -1 });
chatSessionSchema.index({ accessToken: 1 });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
