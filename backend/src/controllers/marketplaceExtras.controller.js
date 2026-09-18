const Project = require('../models/Project');
const AuditLog = require('../models/AuditLog');
const { getRecommendations } = require('../utils/recommendationEngine');
const { sendSuccess, sendError, sendPaginated } = require('../utils/apiResponse');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const sitemapXml = async (req, res, next) => {
  try {
    const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const projects = await Project.find({ status: { $in: ['published', 'featured'] } })
      .select('slug updatedAt')
      .lean();
    const urls = [
      '',
      '/projects',
      '/about',
      '/contact',
      '/marketplace/developers',
      ...projects.map((p) => `/projects/${p.slug}`),
    ];
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (path) => `  <url>
    <loc>${base}${path}</loc>
    <changefreq>weekly</changefreq>
  </url>`
  )
  .join('\n')}
</urlset>`;
    res.type('application/xml').send(body);
  } catch (error) {
    next(error);
  }
};

const recommendProjects = async (req, res, next) => {
  try {
    const limit = Math.min(24, Math.max(1, Number(req.query.limit) || 6));
    const published = await Project.find({ status: { $in: ['published', 'featured'] } })
      .select(
        'title slug shortDescription industry projectType category features price buyNowEnabled ratingAvg ratingCount screenshots status featured technologies views'
      )
      .populate('category', 'name')
      .sort({ featured: -1, ratingAvg: -1, views: -1 })
      .limit(80)
      .lean();

    const fakeReq = {
      industry: req.query.industry || '',
      projectType: req.query.projectType || '',
      budget: req.query.budget || '',
      modules: req.query.modules ? String(req.query.modules).split(',') : [],
    };
    let scored = getRecommendations(fakeReq, published);

    // Fallback: featured / top-rated if scorer still empty
    if (!scored.length && published.length) {
      scored = published.slice(0, limit).map((p, i) => ({
        projectId: p._id,
        matchScore: 50 - i,
      }));
    }

    const byId = Object.fromEntries(published.map((p) => [String(p._id), p]));
    const list = scored
      .map((s) => {
        const id = String(s.projectId);
        const p = byId[id];
        if (!p) return null;
        return { ...p, matchScore: s.matchScore };
      })
      .filter(Boolean)
      .slice(0, limit);

    sendSuccess(res, list, 'Suggested projects');
  } catch (error) {
    next(error);
  }
};

const listAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query.page, req.query.limit || 30);
    const filter = {};
    if (req.query.action) filter.action = new RegExp(req.query.action, 'i');
    const [rows, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actorId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);
    sendPaginated(res, rows, buildPaginationMeta(total, page, limit), 'Audit logs');
  } catch (error) {
    next(error);
  }
};

const setProjectFeatured = async (req, res, next) => {
  try {
    const { featured, tier } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return sendError(res, 'Project not found', 404);
    if (featured !== undefined) {
      project.featured = Boolean(featured);
      if (featured && project.status === 'published') project.status = 'featured';
      if (!featured && project.status === 'featured') project.status = 'published';
    }
    if (tier !== undefined) project.tier = Number(tier) || project.tier;
    await project.save();
    const { writeAuditLog } = require('../utils/auditLog');
    await writeAuditLog({
      actorId: req.user._id,
      action: 'project.curate',
      entityType: 'Project',
      entityId: project._id,
      meta: { featured: project.featured, tier: project.tier },
      ip: req.ip,
    });
    sendSuccess(res, project, 'Project curation updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sitemapXml,
  recommendProjects,
  listAuditLogs,
  setProjectFeatured,
};
