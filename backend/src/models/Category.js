const mongoose = require('mongoose');
const generateSlug = require('../utils/generateSlug');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, trim: true },
    icon: { type: String },
    isActive: { type: Boolean, default: true },
    projectCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = generateSlug(this.name);
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
