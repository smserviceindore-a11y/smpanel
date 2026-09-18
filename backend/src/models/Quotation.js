const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    unitAmount: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const milestoneSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    paidAt: Date,
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  },
  { _id: true }
);

const quotationSchema = new mongoose.Schema(
  {
    quotationId: { type: String, unique: true, required: true },
    leadType: {
      type: String,
      enum: ['requirement', 'customization', 'manual', 'buy_now'],
      default: 'manual',
    },
    requirementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Requirement' },
    customizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomizationRequest' },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    developerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    clientName: { type: String, required: true, trim: true },
    clientEmail: { type: String, required: true, trim: true, lowercase: true },
    clientPhone: { type: String, trim: true },
    clientCompany: { type: String, trim: true },
    clientAddress: { type: String, trim: true },
    clientGstin: { type: String, trim: true, uppercase: true },

    title: { type: String, required: true, trim: true },
    items: { type: [lineItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 18 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },

    /** Partial / milestone payments. If empty, treated as single full payment. */
    milestones: { type: [milestoneSchema], default: [] },
    paidAmount: { type: Number, default: 0 },

    /** When admin marks work delivered — used for hold-from-delivery mode */
    deliveredAt: Date,
    deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    notes: { type: String, trim: true },
    validUntil: Date,
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'rejected', 'expired', 'partially_paid', 'paid'],
      default: 'draft',
    },

    commissionRate: { type: Number, default: 30 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

quotationSchema.index({ status: 1, createdAt: -1 });
quotationSchema.index({ clientEmail: 1, createdAt: -1 });
quotationSchema.index({ clientId: 1, createdAt: -1 });
quotationSchema.index({ developerId: 1, createdAt: -1 });

module.exports = mongoose.model('Quotation', quotationSchema);
