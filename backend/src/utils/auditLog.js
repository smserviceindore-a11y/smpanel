const AuditLog = require('../models/AuditLog');

const writeAuditLog = async ({ actorId, action, entityType, entityId, meta, ip }) => {
  try {
    await AuditLog.create({
      actorId,
      action,
      entityType,
      entityId: entityId != null ? String(entityId) : undefined,
      meta,
      ip,
    });
  } catch (e) {
    // Never block primary flow on audit failure
    console.warn('Audit log failed:', e.message);
  }
};

module.exports = { writeAuditLog };
