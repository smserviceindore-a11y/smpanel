const Coupon = require('../models/Coupon');
const Project = require('../models/Project');
const User = require('../models/User');

/**
 * Demo polish: platform Buy Now coupon + enable Buy Now on one company project.
 */
const seedDemoBuyNow = async () => {
  const admin = await User.findOne({
    role: { $in: ['super_admin', 'admin'] },
  }).sort({ role: -1 });

  if (!admin) {
    console.log('seedDemoBuyNow: no admin — skipped');
    return;
  }

  let coupon = await Coupon.findOne({ code: 'BUYNOW10' });
  if (!coupon) {
    coupon = await Coupon.create({
      code: 'BUYNOW10',
      discountType: 'percent',
      discountValue: 10,
      projectScope: 'all',
      maxUses: 0,
      minOrderAmount: 0,
      creatorRole: 'admin',
      createdBy: admin._id,
      isActive: true,
      description: 'Platform 10% off ready Buy Now purchases',
    });
    console.log('Platform coupon created: BUYNOW10');
  } else {
    coupon.isActive = true;
    coupon.discountType = 'percent';
    coupon.discountValue = 10;
    await coupon.save();
    console.log('Platform coupon ensured: BUYNOW10');
  }

  const project = await Project.findOne({
    ownerType: 'company',
    status: { $in: ['published', 'featured'] },
  }).sort({ featured: -1, createdAt: 1 });

  if (project) {
    const amount = Number(project.price?.amount) > 0 ? Number(project.price.amount) : 4999;
    project.buyNowEnabled = true;
    project.price = {
      ...(project.price?.toObject?.() || project.price || {}),
      amount,
      currency: 'INR',
      displayText: project.price?.displayText || `₹${amount.toLocaleString('en-IN')}`,
    };
    if (!project.deliveryAccessUrl) {
      project.deliveryAccessUrl = 'https://example.com/demo-access';
    }
    await project.save();
    console.log(
      `Buy Now enabled on: ${project.slug} (₹${amount}, delivery=${project.deliveryAccessUrl})`
    );
  } else {
    console.log('seedDemoBuyNow: no company project — skipped Buy Now flag');
  }
};

module.exports = seedDemoBuyNow;
