function doGet() {
  try {
    setupSystem();
    return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle(TNA_CONFIG.APP_NAME)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (e) {
    return HtmlService.createHtmlOutput('<h2>Application could not be initialized.</h2><p>' + e.message + '</p>');
  }
}

function doPost(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    message: 'POST requests are not supported directly in this application shell.'
  })).setMimeType(ContentService.MimeType.JSON);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function initializeApp() {
  try {
    var setupResult = setupSystem();
    return setupResult;
  } catch (e) {
    return buildResponse(false, null, e.message, 'APP_INIT_FAILED');
  }
}

function getAppState() {
  try {
    var auth = getAuthStatus();
    return auth;
  } catch (e) {
    return buildResponse(false, null, e.message, 'APP_STATE_ERROR');
  }
}

function getDashboardSummary() {
  try {
    requirePermission('TNA_VIEW_ALL');
    var assessments = getTableData(TNA_CONFIG.SHEETS.TNA_ASSESSMENTS);
    return buildResponse(true, {
      totalAssessmentCount: assessments.length,
      draftCount: assessments.filter(function(record) {
        return String(record.CurrentStatus).toUpperCase() === TNA_CONFIG.WORKFLOW_STATUSES.DRAFT;
      }).length,
      pendingEmployeeAcknowledgment: assessments.filter(function(record) {
        return String(record.CurrentStatus).toUpperCase() === TNA_CONFIG.WORKFLOW_STATUSES.PENDING_EMPLOYEE_ACKNOWLEDGMENT;
      }).length,
      pendingHodApproval: assessments.filter(function(record) {
        return String(record.CurrentStatus).toUpperCase() === TNA_CONFIG.WORKFLOW_STATUSES.PENDING_HOD_APPROVAL;
      }).length,
      returnedCount: assessments.filter(function(record) {
        return String(record.CurrentStatus).toUpperCase() === TNA_CONFIG.WORKFLOW_STATUSES.RETURNED_TO_MANAGER;
      }).length,
      approvedCount: assessments.filter(function(record) {
        return String(record.CurrentStatus).toUpperCase() === TNA_CONFIG.WORKFLOW_STATUSES.APPROVED;
      }).length
    }, 'Dashboard summary loaded successfully.', null);
  } catch (e) {
    return buildResponse(false, null, e.message, 'DASHBOARD_ERROR');
  }
}

function sendAssessmentReminder(tnaId) {
  try {
    return sendReminderForAssessment(tnaId, 'ADMIN_REMINDER');
  } catch (e) {
    return buildResponse(false, null, e.message, 'REMINDER_ERROR');
  }
}
