const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { supportAgentOnly } = require('../middleware/role.middleware');
const {
  listAdminTickets,
  getAdminTicket,
  updateAdminTicket,
} = require('../controllers/support.controller');
const {
  getAdminRequirements,
  getAdminRequirementById,
  updateRequirementStatus,
} = require('../controllers/requirement.controller');
const {
  getAdminCustomizationRequests,
  getAdminCustomizationById,
  updateCustomizationStatus,
} = require('../controllers/customization.controller');
const {
  listDirectoryUsers,
  getDirectoryUserDetail,
} = require('../controllers/userDirectory.controller');
const { getProjectOpsDetail } = require('../controllers/projectOps.controller');
const {
  listFollowUps,
  createFollowUp,
  updateFollowUp,
  followUpReport,
} = require('../controllers/followUp.controller');
const { getAdminContacts, updateAdminContactStatus } = require('../controllers/contact.controller');

const router = express.Router();

router.use(authMiddleware, supportAgentOnly);

router.get('/dashboard', async (req, res, next) => {
  try {
    const SupportTicket = require('../models/SupportTicket');
    const FollowUp = require('../models/FollowUp');
    const Requirement = require('../models/Requirement');
    const CustomizationRequest = require('../models/CustomizationRequest');
    const { sendSuccess } = require('../utils/apiResponse');

    const [openTickets, overdueReminders, upcomingReminders, newReqs, newCustoms, myFollowUps] =
      await Promise.all([
        SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
        FollowUp.countDocuments({
          reminderDone: false,
          nextFollowUpAt: { $lt: new Date() },
        }),
        FollowUp.countDocuments({
          reminderDone: false,
          nextFollowUpAt: { $gte: new Date() },
        }),
        Requirement.countDocuments({ status: 'new' }),
        CustomizationRequest.countDocuments({ status: 'new' }),
        FollowUp.countDocuments({ agentId: req.user._id }),
      ]);

    sendSuccess(
      res,
      {
        openTickets,
        overdueReminders,
        upcomingReminders,
        newRequirements: newReqs,
        newCustomizations: newCustoms,
        myFollowUps,
      },
      'Support dashboard'
    );
  } catch (e) {
    next(e);
  }
});

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

router.get('/requirements', getAdminRequirements);
router.get('/requirements/:id', getAdminRequirementById);
router.patch('/requirements/:id/status', updateRequirementStatus);

router.get('/customization-requests', getAdminCustomizationRequests);
router.get('/customization-requests/:id', getAdminCustomizationById);
router.patch('/customization-requests/:id/status', updateCustomizationStatus);

router.get('/contacts', getAdminContacts);
router.patch('/contacts/:id', updateAdminContactStatus);

router.get('/directory/users', listDirectoryUsers);
router.get('/directory/users/:id', getDirectoryUserDetail);
router.get('/projects/:id/ops', getProjectOpsDetail);

router.get('/follow-ups/report', followUpReport);
router.get('/follow-ups', listFollowUps);
router.post('/follow-ups', createFollowUp);
router.patch('/follow-ups/:id', updateFollowUp);

module.exports = router;
