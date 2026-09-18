const express = require('express');
const {
  getSuperDashboard,
  getUsers,
  updateUserStatus,
  createAdminUser,
} = require('../controllers/superAdmin.controller');
const { getSettings, updatePaymentSettings, updateCloudinarySettings } = require('../controllers/settings.controller');
const {
  getPaymentReportSummary,
  getDeveloperPaymentReports,
  getDeveloperPaymentDetail,
  getPaymentTransactions,
  exportPaymentTransactionsExcel,
} = require('../controllers/paymentReport.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { superAdminOnly } = require('../middleware/role.middleware');

const router = express.Router();

router.use(authMiddleware, superAdminOnly);

router.get('/dashboard', getSuperDashboard);
router.get('/reports', require('../controllers/admin.controller').getReports);
router.get(
  '/reports/export',
  require('../controllers/admin.controller').exportMasterReportsExcel
);
router.get('/users', getUsers);
router.patch('/users/:id', updateUserStatus);
router.post('/admins', createAdminUser);

router.get('/settings', getSettings);
router.put('/settings/payments', updatePaymentSettings);
router.put('/settings/cloudinary', updateCloudinarySettings);
router.put('/settings/billing', require('../controllers/settings.controller').updateBillingSettings);
router.put('/settings/smtp', require('../controllers/settings.controller').updateSmtpSettings);
router.put('/settings/company', require('../controllers/settings.controller').updateCompanySettings);

router.get('/analytics', require('../controllers/analytics.controller').getAnalyticsSummary);
router.get(
  '/analytics/abandoned-quotes',
  require('../controllers/analytics.controller').listAbandonedQuotes
);
router.get(
  '/analytics/abandoned-quotes/export',
  require('../controllers/analytics.controller').exportAbandonedQuotesExcel
);
router.post(
  '/analytics/abandoned-quotes/remind',
  require('../controllers/analytics.controller').remindAbandonedQuotes
);

router.get('/audit-logs', require('../controllers/marketplaceExtras.controller').listAuditLogs);

router.get('/payment-reports/summary', getPaymentReportSummary);
router.get('/payment-reports/developers', getDeveloperPaymentReports);
router.get('/payment-reports/developers/:id', getDeveloperPaymentDetail);
router.get('/payment-reports/transactions/export', exportPaymentTransactionsExcel);
router.get('/payment-reports/transactions', getPaymentTransactions);

module.exports = router;
