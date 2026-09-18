const mongoose = require('mongoose');

const developerWalletSchema = new mongoose.Schema(
  {
    developerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    availableBalance: { type: Number, default: 0, min: 0 },
    holdBalance: { type: Number, default: 0, min: 0 },
    /** Amount locked in pending/approved payout requests (not withdrawable again) */
    reservedBalance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeveloperWallet', developerWalletSchema);
