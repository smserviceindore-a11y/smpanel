const User = require('../models/User');
const Project = require('../models/Project');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Public developer storefront — profile + published projects.
 */
const getPublicDeveloperProfile = async (req, res, next) => {
  try {
    const developer = await User.findOne({
      _id: req.params.id,
      role: 'developer',
      status: 'active',
    })
      .select('name profile verificationStatus commissionRate createdAt')
      .lean();

    if (!developer) return sendError(res, 'Developer not found', 404);

    const projects = await Project.find({
      developerId: developer._id,
      status: { $in: ['published', 'featured'] },
      reviewStatus: { $in: ['approved', 'none'] },
    })
      .select(
        'title slug shortDescription price buyNowEnabled ratingAvg ratingCount screenshots industry technologies featured status'
      )
      .sort({ featured: -1, createdAt: -1 })
      .limit(48)
      .lean();

    sendSuccess(
      res,
      {
        developer: {
          id: developer._id,
          name: developer.name,
          bio: developer.profile?.bio || '',
          company: developer.profile?.company || '',
          skills: developer.profile?.skills || [],
          experience: developer.profile?.experience || '',
          portfolio: developer.profile?.portfolio || '',
          github: developer.profile?.github || '',
          avatar: developer.profile?.avatar || '',
          verified: developer.verificationStatus === 'verified',
          memberSince: developer.createdAt,
        },
        projects,
      },
      'Developer storefront'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { getPublicDeveloperProfile };
