const Project = require('../models/Project');
const Category = require('../models/Category');
const { sendSuccess, sendPaginated, sendError } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const buildProjectQuery = (query) => {
  const filter = {};

  if (query.category) {
    filter.category = query.category;
  }

  if (query.industry) {
    filter.industry = new RegExp(query.industry, 'i');
  }

  if (query.projectType) {
    filter.projectType = new RegExp(query.projectType, 'i');
  }

  if (query.technology) {
    filter.technologies = new RegExp(query.technology, 'i');
  }

  if (query.customizable === 'true') filter.customizable = true;
  if (query.liveDemo === 'true') filter.liveDemoAvailable = true;
  if (query.ownerType) filter.ownerType = query.ownerType;

  if (query.featured === 'true') filter.featured = true;

  filter.status = { $in: ['published', 'featured'] };

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  return filter;
};

const getSortOption = (sort) => {
  switch (sort) {
    case 'newest':
      return { createdAt: -1 };
    case 'popular':
      return { views: -1 };
    case 'featured':
    default:
      return { featured: -1, tier: 1, createdAt: -1 };
  }
};

const sanitizeProject = (project, isAdmin = false) => {
  const obj = project.toObject ? project.toObject() : project;
  if (!isAdmin) {
    delete obj.demoCredentials;
  }
  return obj;
};

const getProjects = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
    const filter = buildProjectQuery(req.query);
    const sort = getSortOption(req.query.sort);

    if (req.query.category && !req.query.category.match(/^[0-9a-fA-F]{24}$/)) {
      const category = await Category.findOne({ slug: req.query.category });
      if (category) {
        filter.category = category._id;
      } else {
        delete filter.category;
      }
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-demoCredentials'),
      Project.countDocuments(filter),
    ]);

    sendPaginated(
      res,
      projects,
      buildPaginationMeta(total, page, limit),
      'Projects fetched successfully'
    );
  } catch (error) {
    next(error);
  }
};

const getFeaturedProjects = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 6);
    const filter = {
      featured: true,
      status: { $in: ['published', 'featured'] },
    };

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('category', 'name slug')
        .sort({ tier: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-demoCredentials'),
      Project.countDocuments(filter),
    ]);

    sendPaginated(
      res,
      projects,
      buildPaginationMeta(total, page, limit),
      'Featured projects fetched'
    );
  } catch (error) {
    next(error);
  }
};

const getProjectBySlug = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      slug: req.params.slug,
      status: { $in: ['published', 'featured'] },
    }).populate('category', 'name slug').populate('developerId', 'name profile.company verificationStatus');

    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    sendSuccess(res, sanitizeProject(project), 'Project fetched successfully');
  } catch (error) {
    next(error);
  }
};

const incrementView = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    sendSuccess(res, { views: project.views }, 'View recorded');
  } catch (error) {
    next(error);
  }
};

const getAdminProjects = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 20);
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.reviewStatus) filter.reviewStatus = req.query.reviewStatus;
    if (req.query.ownerType) filter.ownerType = req.query.ownerType;
    if (req.query.search) {
      const { escapeRegex } = require('../utils/excelExport');
      const q = escapeRegex(String(req.query.search).trim());
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { industry: new RegExp(q, 'i') },
        { projectType: new RegExp(q, 'i') },
        { slug: new RegExp(q, 'i') },
      ];
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .select(
          'title slug industry projectType ownerType status featured views screenshots liveDemoAvailable createdAt updatedAt category reviewStatus reviewNotes'
        )
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(filter),
    ]);

    sendPaginated(
      res,
      projects,
      buildPaginationMeta(total, page, limit),
      'Admin projects fetched'
    );
  } catch (error) {
    next(error);
  }
};

const getAdminProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate('category', 'name slug');
    if (!project) return sendError(res, 'Project not found', 404);
    sendSuccess(res, project, 'Project fetched');
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const projectData = { ...req.body, createdBy: req.user._id };
    const project = await Project.create(projectData);

    if (project.category) {
      await Category.findByIdAndUpdate(project.category, { $inc: { projectCount: 1 } });
    }

    sendSuccess(res, project, 'Project created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('category', 'name slug');

    if (!project) return sendError(res, 'Project not found', 404);
    sendSuccess(res, project, 'Project updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return sendError(res, 'Project not found', 404);

    if (project.category) {
      await Category.findByIdAndUpdate(project.category, { $inc: { projectCount: -1 } });
    }

    sendSuccess(res, null, 'Project deleted successfully');
  } catch (error) {
    next(error);
  }
};

const updateProjectStatus = async (req, res, next) => {
  try {
    const { status, featured } = req.body;
    const update = {};

    if (status) update.status = status;
    if (featured !== undefined) update.featured = featured;

    const project = await Project.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!project) return sendError(res, 'Project not found', 404);
    sendSuccess(res, project, 'Project status updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getFeaturedProjects,
  getProjectBySlug,
  incrementView,
  getAdminProjects,
  getAdminProjectById,
  createProject,
  updateProject,
  deleteProject,
  updateProjectStatus,
};
