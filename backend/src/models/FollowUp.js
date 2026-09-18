const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema(
  {
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    /** Client or developer being followed up */
    subjectUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    channel: {
      type: String,
      enum: ['call', 'email', 'chat', 'meeting', 'other'],
      default: 'call',
    },
    notes: { type: String, required: true, trim: true },
    relatedRequirementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Requirement' },
    relatedCustomizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CustomizationRequest',
    },
    relatedTicketId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket' },
    relatedProjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    nextFollowUpAt: { type: Date },
    reminderDone: { type: Boolean, default: false },
  },
  { timestamps: true }
);

followUpSchema.index({ agentId: 1, nextFollowUpAt: 1 });
followUpSchema.index({ subjectUserId: 1, createdAt: -1 });
followUpSchema.index({ nextFollowUpAt: 1, reminderDone: 1 });

module.exports = mongoose.model('FollowUp', followUpSchema);
