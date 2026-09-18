const mongoose = require('mongoose');

const walletLedgerSchema = new mongoose.Schema(
  {
    developerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['credit_hold', 'release_available', 'payout', 'refund_debit'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['hold', 'available', 'reserved', 'paid_out', 'reversed'],
      default: 'hold',
    },
    holdUntil: Date,
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    payoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'PayoutRequest' },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

walletLedgerSchema.index({ developerId: 1, status: 1, createdAt: -1 });
walletLedgerSchema.index({ status: 1, holdUntil: 1 });

module.exports = mongoose.model('WalletLedger', walletLedgerSchema);
