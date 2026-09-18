const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    creatorRole: {
      type: String,
      enum: ['developer', 'admin', 'super_admin'],
      required: true,
    },
    /** Developer coupons always percent; admin/super may be percent or fixed */
    discountType: {
      type: String,
      enum: ['percent', 'fixed'],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    /**
     * all — any eligible project
     * include — only listed projects
     * exclude — all except listed projects
     */
    projectScope: {
      type: String,
      enum: ['all', 'include', 'exclude'],
      default: 'all',
    },
    includeProjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    excludeProjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    /** For developer coupons: always their own projects only */
    developerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    maxUses: { type: Number, default: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0 },
    minOrderAmount: { type: Number, default: 0 },
    expiresAt: Date,
    isActive: { type: Boolean, default: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

couponSchema.index({ createdBy: 1, createdAt: -1 });
couponSchema.index({ creatorRole: 1, isActive: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
