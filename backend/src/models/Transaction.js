const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: { type: String, unique: true, required: true },
    quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    developerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    commissionRate: { type: Number, default: 30 },
    platformCommission: { type: Number, default: 0 },
    developerShare: { type: Number, default: 0 },
    /** GST portion of customer-paid amount (inclusive reverse calc) */
    gstAmount: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    /** GST borne from platform / developer shares (not charged to customer) */
    platformGstBear: { type: Number, default: 0 },
    developerGstBear: { type: Number, default: 0 },

    originalAmount: { type: Number },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String },
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },

    milestoneKey: { type: String },
    milestoneId: { type: mongoose.Schema.Types.ObjectId },

    refundAmount: { type: Number, default: 0 },
    refundReason: { type: String },
    refundedAt: Date,

    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    paymentMode: {
      type: String,
      enum: ['razorpay', 'mock', 'manual'],
      default: 'mock',
    },

    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
    },
    paidAt: Date,
    settlementStatus: {
      type: String,
      enum: ['not_applicable', 'pending', 'included', 'paid'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ developerId: 1, settlementStatus: 1 });
transactionSchema.index({ clientId: 1, createdAt: -1 });
transactionSchema.index({ quotationId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
