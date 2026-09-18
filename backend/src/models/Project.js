const mongoose = require('mongoose');
const generateSlug = require('../utils/generateSlug');

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    shortDescription: { type: String, maxlength: 200 },
    description: { type: String },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    industry: { type: String, trim: true },
    projectType: { type: String, trim: true },
    technologies: [{ type: String, trim: true }],

    features: [{ type: String, trim: true }],
    screenshots: [
      {
        url: String,
        caption: String,
        order: { type: Number, default: 0 },
      },
    ],
    videoUrl: String,
    videoThumbnail: String,

    demoUrl: String,
    demoCredentials: {
      username: String,
      password: String,
      notes: String,
    },
    liveDemoAvailable: { type: Boolean, default: false },

    price: {
      displayText: String,
      /** Fixed Buy Now price (INR). When set with buyNowEnabled, clients can purchase instantly. */
      amount: { type: Number, min: 0 },
      min: Number,
      max: Number,
      currency: { type: String, default: 'INR' },
    },
    /** Ready-product instant purchase */
    buyNowEnabled: { type: Boolean, default: false },
    /** Optional link shown to buyer after paid Buy Now */
    deliveryAccessUrl: { type: String, trim: true },
    /** Delivery vault — zip / download package URL */
    deliveryZipUrl: { type: String, trim: true },
    /** License key or redemption code shown after payment */
    deliveryLicenseKey: { type: String, trim: true },
    deliveryInstructions: { type: String, trim: true },
    customizable: { type: Boolean, default: true },
    /** Average rating cache (updated on review approve) */
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },

    ownerType: {
      type: String,
      enum: ['company', 'developer'],
      default: 'company',
    },
    developerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    /** Phase 2 — developer listing review */
    reviewStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    reviewNotes: { type: String, trim: true },
    reviewedAt: Date,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    status: {
      type: String,
      enum: ['draft', 'published', 'featured', 'archived'],
      default: 'draft',
    },
    featured: { type: Boolean, default: false },
    tier: { type: Number, enum: [1, 2, 3], default: 1 },

    views: { type: Number, default: 0 },
    demoViews: { type: Number, default: 0 },

    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

projectSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = generateSlug(this.title);
  }
  next();
});

projectSchema.index({ title: 'text', description: 'text', features: 'text' });
projectSchema.index({ status: 1, featured: 1 });
projectSchema.index({ category: 1, industry: 1 });
projectSchema.index({ developerId: 1, createdAt: -1 });
projectSchema.index({ ownerType: 1, status: 1, createdAt: -1 });
projectSchema.index({ reviewStatus: 1, createdAt: -1 });
projectSchema.index({ ownerType: 1, reviewStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Project', projectSchema);
