const express = require('express');
const {
  getDashboardStats,
  getDevelopers,
  updateDeveloperVerification,
  getReports,
  exportMasterReportsExcel,
} = require('../controllers/admin.controller');
const {
  getAdminProjects,
  getAdminProjectById,
  createProject,
  updateProject,
  deleteProject,
  updateProjectStatus,
} = require('../controllers/project.controller');
const {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');
const {
  getAdminRequirements,
  getAdminRequirementById,
  updateRequirementStatus,
  exportRequirementsExcel,
} = require('../controllers/requirement.controller');
const {
  getAdminCustomizationRequests,
  getAdminCustomizationById,
  updateCustomizationStatus,
  exportCustomizationsExcel,
} = require('../controllers/customization.controller');
const {
  getApprovalQueue,
  reviewDeveloperProject,
} = require('../controllers/projectReview.controller');
const {
  createQuotation,
  listQuotations,
  exportQuotationsExcel,
  getQuotationById,
  updateQuotation,
  sendQuotation,
  downloadQuotationPdf,
  listInvoices,
  exportInvoicesExcel,
  downloadInvoicePdf,
  listTransactions,
  exportTransactionsExcel,
  createSettlement,
  updateSettlement,
  listSettlements,
  exportSettlementsExcel,
  markQuotationDelivered,
  refundTransaction,
} = require('../controllers/business.controller');
const {
  createCoupon,
  listCoupons,
  updateCoupon,
} = require('../controllers/coupon.controller');
const { getAdminContacts, updateAdminContactStatus } = require('../controllers/contact.controller');
const {
  createProjectValidation,
  updateProjectValidation,
  updateStatusValidation,
} = require('../validators/project.validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/role.middleware');

const router = express.Router();

router.use(authMiddleware, adminOnly);

router.get('/dashboard', getDashboardStats);
router.get('/reports', getReports);
router.get('/reports/export', exportMasterReportsExcel);
router.get('/contacts', getAdminContacts);
router.patch('/contacts/:id', updateAdminContactStatus);
router.get('/developers', getDevelopers);
router.patch('/developers/:id', updateDeveloperVerification);

router.get('/approvals', getApprovalQueue);
router.patch('/approvals/:id', reviewDeveloperProject);

router.get('/projects', getAdminProjects);
router.get('/projects/:id', getAdminProjectById);
router.post('/projects', createProjectValidation, validate, createProject);
router.put('/projects/:id', updateProjectValidation, validate, updateProject);
router.delete('/projects/:id', deleteProject);
router.patch('/projects/:id/status', updateStatusValidation, validate, updateProjectStatus);

router.get('/categories', getAdminCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

router.get('/requirements/export', exportRequirementsExcel);
router.get('/requirements', getAdminRequirements);
router.get('/requirements/:id', getAdminRequirementById);
router.patch('/requirements/:id/status', updateRequirementStatus);

router.get('/customization-requests/export', exportCustomizationsExcel);
router.get('/customization-requests', getAdminCustomizationRequests);
router.get('/customization-requests/:id', getAdminCustomizationById);
router.patch('/customization-requests/:id/status', updateCustomizationStatus);

router.get('/quotations/export', exportQuotationsExcel);
router.get('/quotations', listQuotations);
router.post('/quotations', createQuotation);
router.get('/quotations/:id/pdf', downloadQuotationPdf);
router.get('/quotations/:id', getQuotationById);
router.put('/quotations/:id', updateQuotation);
router.post('/quotations/:id/send', sendQuotation);
router.post('/quotations/:id/deliver', markQuotationDelivered);

router.get('/invoices/export', exportInvoicesExcel);
router.get('/invoices', listInvoices);
router.get('/invoices/:id/pdf', downloadInvoicePdf);

router.get('/transactions/export', exportTransactionsExcel);
router.get('/transactions', listTransactions);
router.post('/transactions/:id/refund', refundTransaction);

router.get('/settlements/export', exportSettlementsExcel);
router.get('/settlements', listSettlements);
router.post('/settlements', createSettlement);
router.patch('/settlements/:id', updateSettlement);

const {
  listAdminPayouts,
  exportAdminPayoutsExcel,
  reviewPayout,
} = require('../controllers/payout.controller');

router.get('/payouts/export', exportAdminPayoutsExcel);
router.get('/payouts', listAdminPayouts);
router.patch('/payouts/:id', reviewPayout);

router.get('/coupons', listCoupons);
router.post('/coupons', createCoupon);
router.patch('/coupons/:id', updateCoupon);

const {
  listAdminReviews,
  moderateReview,
} = require('../controllers/review.controller');
const {
  listAdminTickets,
  getAdminTicket,
  updateAdminTicket,
} = require('../controllers/support.controller');
const { setProjectFeatured } = require('../controllers/marketplaceExtras.controller');

router.get('/reviews', listAdminReviews);
router.patch('/reviews/:id', moderateReview);
router.get('/support', listAdminTickets);
router.get('/support/:id', getAdminTicket);
router.patch('/support/:id', updateAdminTicket);

const {
  listStaffChats,
  getStaffChat,
  replyStaffChat,
  updateStaffChat,
} = require('../controllers/chat.controller');
router.get('/live-chat', listStaffChats);
router.get('/live-chat/:id', getStaffChat);
router.post('/live-chat/:id/reply', replyStaffChat);
router.patch('/live-chat/:id', updateStaffChat);
router.patch('/projects/:id/curate', setProjectFeatured);

const {
  listDirectoryUsers,
  createDirectoryUser,
  updateDirectoryUser,
  getDirectoryUserDetail,
} = require('../controllers/userDirectory.controller');
const { getProjectOpsDetail } = require('../controllers/projectOps.controller');
const {
  listFollowUps,
  createFollowUp,
  updateFollowUp,
  followUpReport,
} = require('../controllers/followUp.controller');

router.get('/directory/users', listDirectoryUsers);
router.post('/directory/users', createDirectoryUser);
router.get('/directory/users/:id', getDirectoryUserDetail);
router.patch('/directory/users/:id', updateDirectoryUser);
router.get('/projects/:id/ops', getProjectOpsDetail);
router.get('/follow-ups/report', followUpReport);
router.get('/follow-ups', listFollowUps);
router.post('/follow-ups', createFollowUp);
router.patch('/follow-ups/:id', updateFollowUp);

module.exports = router;
