const User = require('../models/User');
const Project = require('../models/Project');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Public list of developers who have published projects (for marketplace filters).
 */
const listPublicDevelopers = async (req, res, next) => {
  try {
    const developerIds = await Project.distinct('developerId', {
      ownerType: 'developer',
      developerId: { $ne: null },
      status: { $in: ['published', 'featured'] },
    });

    const developers = await User.find({
      _id: { $in: developerIds },
      role: 'developer',
      status: 'active',
    })
      .select('name profile.company profile.avatar verificationStatus')
      .sort({ name: 1 })
      .lean();

    sendSuccess(
      res,
      developers.map((d) => ({
        id: d._id,
        name: d.name,
        company: d.profile?.company || '',
        avatar: d.profile?.avatar || '',
        verified: d.verificationStatus === 'verified',
      })),
      'Developers fetched'
    );
  } catch (error) {
    next(error);
  }
};

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

module.exports = { listPublicDevelopers, getPublicDeveloperProfile };
