const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema(
  {
    leadId: { type: String, unique: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    mobile: { type: String, required: true, trim: true },
    industry: { type: String, trim: true },
    location: { type: String, trim: true },

    projectType: { type: String, trim: true },
    modules: [{ type: String, trim: true }],
    numUsers: Number,

    needsWeb: { type: Boolean, default: false },
    needsMobile: { type: Boolean, default: false },
    needsWebsite: { type: Boolean, default: false },
    needsERP: { type: Boolean, default: false },
    needsAI: { type: Boolean, default: false },
    needsAPI: { type: Boolean, default: false },

    budget: { type: String, trim: true },
    timeline: { type: String, trim: true },
    additionalNotes: { type: String },

    attachments: [
      {
        url: String,
        name: String,
        type: String,
      },
    ],

    recommendedProjects: [
      {
        projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
        matchScore: Number,
      },
    ],

    status: {
      type: String,
      enum: [
        'new',
        'contacted',
        'requirement_discussed',
        'demo_given',
        'quotation_sent',
        'negotiation',
        'won',
        'lost',
      ],
      default: 'new',
    },

    adminNotes: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

requirementSchema.index({ status: 1, createdAt: -1 });
requirementSchema.index({ email: 1, createdAt: -1 });
requirementSchema.index({ clientId: 1, createdAt: -1 });
requirementSchema.index({ industry: 1, status: 1 });

module.exports = mongoose.model('Requirement', requirementSchema);
