const Category = require('../models/Category');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { escapeRegex } = require('../utils/excelExport');

const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name slug description projectCount isActive')
      .sort({ name: 1 })
      .lean();
    res.set('Cache-Control', 'public, max-age=60');
    sendSuccess(res, categories, 'Categories fetched');
  } catch (error) {
    next(error);
  }
};

const getAdminCategories = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 50);
    const filter = {};
    if (req.query.search) {
      const q = escapeRegex(String(req.query.search).trim());
      filter.$or = [{ name: new RegExp(q, 'i') }, { slug: new RegExp(q, 'i') }];
    }
    if (req.query.isActive === 'true') filter.isActive = true;
    if (req.query.isActive === 'false') filter.isActive = false;

    const [categories, total] = await Promise.all([
      Category.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Category.countDocuments(filter),
    ]);

    sendPaginated(res, categories, buildPaginationMeta(total, page, limit), 'Categories fetched');
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    sendSuccess(res, category, 'Category created', 201);
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!category) return sendError(res, 'Category not found', 404);
    sendSuccess(res, category, 'Category updated');
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return sendError(res, 'Category not found', 404);
    sendSuccess(res, null, 'Category deleted');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
