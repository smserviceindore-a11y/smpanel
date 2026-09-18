const { sendError } = require('../utils/apiResponse');

const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return sendError(res, 'Access denied. Insufficient permissions.', 403);
  }
  next();
};

const adminOnly = allowRoles('admin', 'super_admin');
const superAdminOnly = allowRoles('super_admin');
const developerOnly = allowRoles('developer');
const clientOnly = allowRoles('client');
const supportAgentOnly = allowRoles('support_agent');
/** Admin / Super Admin / Support Agent — CRM & directory reads */
const staffCrm = allowRoles('admin', 'super_admin', 'support_agent');
/** Only Admin / Super Admin can create users or change credentials */
const staffManagers = allowRoles('admin', 'super_admin');

const VIEWABLE_ROLES = {
  super_admin: ['super_admin', 'admin', 'support_agent', 'developer', 'client'],
  admin: ['support_agent', 'developer', 'client'],
  support_agent: ['developer', 'client'],
};

const CREATABLE_ROLES = {
  super_admin: ['super_admin', 'admin', 'support_agent', 'developer', 'client'],
  admin: ['support_agent', 'developer', 'client'],
};

const canViewRole = (actorRole, targetRole) =>
  (VIEWABLE_ROLES[actorRole] || []).includes(targetRole);

const canCreateRole = (actorRole, targetRole) =>
  (CREATABLE_ROLES[actorRole] || []).includes(targetRole);

module.exports = {
  allowRoles,
  adminOnly,
  superAdminOnly,
  developerOnly,
  clientOnly,
  supportAgentOnly,
  staffCrm,
  staffManagers,
  VIEWABLE_ROLES,
  CREATABLE_ROLES,
  canViewRole,
  canCreateRole,
};
