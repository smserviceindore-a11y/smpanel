const express = require('express');
const {
  getProjects,
  getFeaturedProjects,
  getProjectBySlug,
  incrementView,
} = require('../controllers/project.controller');
const { listProjectReviews } = require('../controllers/review.controller');
const { recommendProjects } = require('../controllers/marketplaceExtras.controller');

const router = express.Router();

router.get('/featured', getFeaturedProjects);
router.get('/recommend', recommendProjects);
router.post('/:id/view', incrementView);
router.get('/', getProjects);
router.get('/:slug/reviews', listProjectReviews);
router.get('/:slug', getProjectBySlug);

module.exports = router;
