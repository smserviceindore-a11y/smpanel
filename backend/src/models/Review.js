const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'hidden'],
      default: 'pending',
    },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: Date,
  },
  { timestamps: true }
);

reviewSchema.index({ projectId: 1, clientId: 1 }, { unique: true });
reviewSchema.index({ projectId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
