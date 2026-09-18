const mongoose = require('mongoose');

const customizationRequestSchema = new mongoose.Schema(
  {
    leadId: { type: String, unique: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    developerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    mobile: { type: String, required: true, trim: true },

    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    projectTitle: { type: String, trim: true },

    /** platform = SM project; developer = marketplace developer project */
    ownership: {
      type: String,
      enum: ['platform', 'developer'],
      default: 'platform',
    },
    /**
     * pending_admin — waiting SM review before developer can see
     * released_to_developer — developer may view sanitized brief
     * held — admin kept internal
     * not_applicable — platform-owned (no developer release)
     */
    reviewStatus: {
      type: String,
      enum: ['pending_admin', 'released_to_developer', 'held', 'not_applicable'],
      default: 'not_applicable',
    },
    /** Sanitized brief shown to developer (no client contact) */
    developerBrief: { type: String, trim: true },
    developerQuoteAmount: { type: Number, min: 0 },
    developerQuoteNotes: { type: String, trim: true },
    developerQuotedAt: Date,
    releasedAt: Date,
    releasedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    selectedModules: [{ type: String, trim: true }],
    additionalRequirements: { type: String },

    budget: { type: String, trim: true },
    timeline: { type: String, trim: true },

    status: {
      type: String,
      enum: ['new', 'contacted', 'quotation_sent', 'negotiation', 'won', 'lost'],
      default: 'new',
    },

    adminNotes: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

customizationRequestSchema.index({ status: 1, createdAt: -1 });
customizationRequestSchema.index({ email: 1, createdAt: -1 });
customizationRequestSchema.index({ clientId: 1, createdAt: -1 });
customizationRequestSchema.index({ developerId: 1, reviewStatus: 1, createdAt: -1 });
customizationRequestSchema.index({ projectId: 1, createdAt: -1 });
customizationRequestSchema.index({ ownership: 1, reviewStatus: 1 });

module.exports = mongoose.model('CustomizationRequest', customizationRequestSchema);
