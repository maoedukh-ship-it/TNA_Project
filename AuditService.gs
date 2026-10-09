function logAudit(userId, action, entityType, entityId, changeSummary, requestId) {
  var sheet = getSheetByName(TNA_CONFIG.SHEETS.AUDIT_LOG);
  if (!sheet) {
    return false;
  }

  sheet.appendRow([
    generateId('AUD'),
    userId || '',
    action || 'UNKNOWN_ACTION',
    entityType || 'UNKNOWN_ENTITY',
    entityId || '',
    getCurrentTimestamp(),
    changeSummary || '',
    requestId || ''
  ]);

  return true;
}
