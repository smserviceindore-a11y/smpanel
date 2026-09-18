const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema(
  {
    settlementId: { type: String, unique: true, required: true },
    developerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transactionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'cancelled'],
      default: 'pending',
    },
    notes: { type: String, trim: true },
    paidAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

settlementSchema.index({ developerId: 1, createdAt: -1 });
settlementSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Settlement', settlementSchema);
