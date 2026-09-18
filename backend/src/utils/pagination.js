const getPagination = (page = 1, limit = 12) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  // Hard cap — protects DB from huge page sizes
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (parsedPage - 1) * parsedLimit;

  return { page: parsedPage, limit: parsedLimit, skip };
};

const buildPaginationMeta = (total, page, limit) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit) || 1),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

module.exports = { getPagination, buildPaginationMeta };
