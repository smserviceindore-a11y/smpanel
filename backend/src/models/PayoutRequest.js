const mongoose = require('mongoose');

const payoutRequestSchema = new mongoose.Schema(
  {
    payoutId: { type: String, unique: true, required: true },
    developerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR' },
    method: {
      type: String,
      enum: ['upi', 'bank', 'paypal'],
      required: true,
    },
    details: {
      upiId: String,
      accountName: String,
      accountNumber: String,
      ifsc: String,
      paypalEmail: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid'],
      default: 'pending',
    },
    adminNotes: { type: String, trim: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    paidAt: Date,
  },
  { timestamps: true }
);

payoutRequestSchema.index({ developerId: 1, createdAt: -1 });
payoutRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PayoutRequest', payoutRequestSchema);
