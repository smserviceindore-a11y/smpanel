/**
 * Shared list filter builders — keep queries indexed & bounded.
 */
const { escapeRegex } = require('./excelExport');

const MAX_EXPORT = 5000;

const buildLeadSearchFilter = (search, fields) => {
  if (!search || !String(search).trim()) return {};
  const q = escapeRegex(String(search).trim());
  return {
    $or: fields.map((field) => ({ [field]: new RegExp(q, 'i') })),
  };
};

/** dateFrom / dateTo (YYYY-MM-DD or ISO) → { createdAt: { $gte, $lte } } */
const buildDateRangeFilter = (query = {}, field = 'createdAt') => {
  const from = query.dateFrom || query.from;
  const to = query.dateTo || query.to;
  if (!from && !to) return {};
  const range = {};
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(0, 0, 0, 0);
      range.$gte = d;
    }
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      range.$lte = d;
    }
  }
  if (!Object.keys(range).length) return {};
  return { [field]: range };
};

const mergeFilters = (...parts) => {
  const merged = {};
  for (const part of parts) {
    if (!part || !Object.keys(part).length) continue;
    if (part.$or) {
      merged.$and = [...(merged.$and || []), { $or: part.$or }];
    } else if (part.$and) {
      merged.$and = [...(merged.$and || []), ...part.$and];
    } else {
      Object.assign(merged, part);
    }
  }
  return merged;
};

module.exports = {
  MAX_EXPORT,
  buildLeadSearchFilter,
  buildDateRangeFilter,
  mergeFilters,
};
