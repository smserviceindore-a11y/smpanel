const express = require('express');
const {
  getClientDashboard,
  getMyRequirements,
  getMyCustomizations,
  updateMyProfile,
} = require('../controllers/client.controller');
const {
  getClientQuotations,
  respondToQuotation,
  createPaymentForQuotation,
  confirmPayment,
  listInvoices,
  exportInvoicesExcel,
  downloadInvoicePdf,
  downloadQuotationPdf,
  buyNowForProject,
} = require('../controllers/business.controller');
const { createReview } = require('../controllers/review.controller');
const {
  createTicket,
  listMyTickets,
  getMyTicket,
  replyMyTicket,
} = require('../controllers/support.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { clientOnly } = require('../middleware/role.middleware');

const router = express.Router();

router.use(authMiddleware, clientOnly);

router.get('/dashboard', getClientDashboard);
router.get('/requirements', getMyRequirements);
router.get('/customizations', getMyCustomizations);
router.patch('/profile', updateMyProfile);

router.get('/quotations', getClientQuotations);
router.get('/quotations/:id/pdf', downloadQuotationPdf);
router.post('/quotations/:id/respond', respondToQuotation);
router.post('/quotations/:id/pay', createPaymentForQuotation);
router.post('/payments/confirm', confirmPayment);
router.post('/coupons/preview', require('../controllers/coupon.controller').previewCoupon);
router.post('/projects/:slug/buy-now', buyNowForProject);

router.post('/reviews', createReview);

router.get('/support', listMyTickets);
router.post('/support', createTicket);
router.get('/support/:id', getMyTicket);
router.post('/support/:id/reply', replyMyTicket);

router.get('/invoices/export', exportInvoicesExcel);
router.get('/invoices', listInvoices);
router.get('/invoices/:id/pdf', downloadInvoicePdf);

module.exports = router;
