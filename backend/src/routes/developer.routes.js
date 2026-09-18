const express = require('express');
const {
  getDeveloperDashboard,
  getMyProjects,
  getMyRequests,
  submitDeveloperQuote,
  updateMyProfile,
  submitMyProject,
} = require('../controllers/developer.controller');
const { getDeveloperEarningsDetailed, listSettlements } = require('../controllers/business.controller');
const {
  createPayoutRequest,
  listMyPayouts,
  getDeveloperWalletReport,
} = require('../controllers/payout.controller');
const {
  createCoupon,
  listCoupons,
  updateCoupon,
} = require('../controllers/coupon.controller');
const { createProjectValidation } = require('../validators/project.validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const { developerOnly } = require('../middleware/role.middleware');

const router = express.Router();

router.use(authMiddleware, developerOnly);

router.get('/dashboard', getDeveloperDashboard);
router.get('/projects', getMyProjects);
router.post('/projects', createProjectValidation, validate, submitMyProject);
router.get('/requests', getMyRequests);
router.post('/requests/:id/quote', submitDeveloperQuote);
router.patch('/profile', updateMyProfile);
router.get('/earnings', getDeveloperEarningsDetailed);
router.get('/wallet', getDeveloperWalletReport);
router.get('/settlements', listSettlements);
router.get('/payouts', listMyPayouts);
router.post('/payouts', createPayoutRequest);
router.get('/coupons', listCoupons);
router.post('/coupons', createCoupon);
router.patch('/coupons/:id', updateCoupon);

module.exports = router;
