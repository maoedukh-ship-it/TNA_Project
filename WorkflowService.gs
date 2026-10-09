function transitionAssessmentStatus(tnaId, nextStatus, action, actionBy, comments, assessmentData, versionNumber) {
  var assessment = getAssessmentById(tnaId);
  if (!assessment) {
    throw new Error('Assessment not found.');
  }

  var currentStatus = String(assessment.CurrentStatus || 'DRAFT');
  validateStatusTransition(currentStatus, nextStatus);

  var sheet = getSheetByName(TNA_CONFIG.SHEETS.WORKFLOW_HISTORY);
  sheet.appendRow([
    generateId('WF'),
    tnaId,
    versionNumber || assessment.CurrentVersion || 1,
    currentStatus,
    nextStatus,
    action || 'STATUS_CHANGE',
    actionBy || getCurrentUserEmail(),
    getCurrentTimestamp(),
    comments || ''
  ]);

  var assessmentSheet = getSheetByName(TNA_CONFIG.SHEETS.TNA_ASSESSMENTS);
  var rows = assessmentSheet.getDataRange().getValues();
  var headers = rows[0];
  var rowIndex = -1;

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][headers.indexOf('TNAID')]).toLowerCase() === String(tnaId).toLowerCase()) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error('Assessment row not found for update.');
  }

  if (assessmentData !== undefined) {
    assessmentSheet.getRange(rowIndex, headers.indexOf('AssessmentData') + 1).setValue(JSON.stringify(assessmentData));
  }

  if (versionNumber !== undefined) {
    assessmentSheet.getRange(rowIndex, headers.indexOf('CurrentVersion') + 1).setValue(versionNumber);
  }

  assessmentSheet.getRange(rowIndex, headers.indexOf('CurrentStatus') + 1).setValue(nextStatus);
  assessmentSheet.getRange(rowIndex, headers.indexOf('UpdatedAt') + 1).setValue(getCurrentTimestamp());
  assessmentSheet.getRange(rowIndex, headers.indexOf('UpdatedBy') + 1).setValue(actionBy || getCurrentUserEmail());

  if (nextStatus === TNA_CONFIG.WORKFLOW_STATUSES.PENDING_EMPLOYEE_ACKNOWLEDGMENT) {
    assessmentSheet.getRange(rowIndex, headers.indexOf('SubmittedAt') + 1).setValue(getCurrentTimestamp());
  }

  if (nextStatus === TNA_CONFIG.WORKFLOW_STATUSES.PENDING_HOD_APPROVAL) {
    assessmentSheet.getRange(rowIndex, headers.indexOf('EmployeeAcknowledgedAt') + 1).setValue(getCurrentTimestamp());
  }

  if (nextStatus === TNA_CONFIG.WORKFLOW_STATUSES.APPROVED) {
    assessmentSheet.getRange(rowIndex, headers.indexOf('HODApprovedAt') + 1).setValue(getCurrentTimestamp());
  }

  return true;
}

function canManagerEditAssessment(tnaId, userId) {
  var assessment = getAssessmentById(tnaId);
  if (!assessment) {
    return false;
  }

  var status = String(assessment.CurrentStatus || '').toUpperCase();
  var isManager = String(assessment.ManagerUserID || '').toLowerCase() === String(userId || '').toLowerCase();
  if (!isManager) {
    return false;
  }

  return status === TNA_CONFIG.WORKFLOW_STATUSES.DRAFT || status === TNA_CONFIG.WORKFLOW_STATUSES.PENDING_EMPLOYEE_ACKNOWLEDGMENT || status === TNA_CONFIG.WORKFLOW_STATUSES.RETURNED_TO_MANAGER;
}
