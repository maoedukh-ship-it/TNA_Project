function getAssessmentById(tnaId) {
  var rows = getTableData(TNA_CONFIG.SHEETS.TNA_ASSESSMENTS);
  return rows.find(function(row) {
    return String(row.TNAID || '').toLowerCase() === String(tnaId || '').toLowerCase();
  }) || null;
}

function getAssessmentByReference(reference) {
  var rows = getTableData(TNA_CONFIG.SHEETS.TNA_ASSESSMENTS);
  return rows.find(function(row) {
    return String(row.TNAReference || '').toLowerCase() === String(reference || '').toLowerCase();
  }) || null;
}

function getTNAForCurrentUser() {
  var user = requireAuthenticatedUser();
  var rows = getTableData(TNA_CONFIG.SHEETS.TNA_ASSESSMENTS);

  if (userHasPermission(user.UserID, 'TNA_VIEW_ALL')) {
    return rows;
  }

  return rows.filter(function(record) {
    var isOwner = String(record.EmployeeID || '').toLowerCase() === String(user.EmployeeID || '').toLowerCase();
    var isManager = String(record.ManagerUserID || '').toLowerCase() === String(user.UserID || '').toLowerCase();
    return isOwner || isManager || String(record.HODUserID || '').toLowerCase() === String(user.UserID || '').toLowerCase();
  });
}

function createNewAssessment(payload) {
  var user = requirePermission('TNA_CREATE');
  validateAssessmentPayload(payload);

  var tnaId = generateId('TNA');
  var reference = generateTNAReference();
  var timestamp = getCurrentTimestamp();
  var assessmentData = payload;

  var assessmentSheet = getSheetByName(TNA_CONFIG.SHEETS.TNA_ASSESSMENTS);
  assessmentSheet.appendRow([
    tnaId,
    reference,
    payload.EmployeeID || '',
    payload.ManagerUserID || user.UserID,
    payload.HODUserID || '',
    payload.AssessmentPeriod || new Date().getFullYear(),
    TNA_CONFIG.WORKFLOW_STATUSES.DRAFT,
    1,
    JSON.stringify(assessmentData),
    timestamp,
    user.UserID,
    timestamp,
    user.UserID,
    '',
    '',
    ''
  ]);

  createAssessmentSnapshot(tnaId, 1, assessmentData, user.UserID, 'Initial assessment created');
  logAudit(user.UserID, 'CREATE_TNA', 'TNA', tnaId, 'Created assessment draft with reference ' + reference, '');

  return buildResponse(true, { TNAID: tnaId, TNAReference: reference }, 'Assessment created as draft.', null);
}

function generateTNAReference() {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sheet = getSheetByName(TNA_CONFIG.SHEETS.TNA_ASSESSMENTS);
    var rows = sheetToObjects(sheet);
    var highest = 0;

    for (var i = 0; i < rows.length; i++) {
      var ref = String(rows[i].TNAReference || '');
      var match = ref.match(/TNA-(\d{4})-(\d+)/i);
      if (match) {
        var number = parseInt(match[2], 10);
        if (number > highest) {
          highest = number;
        }
      }
    }

    var year = new Date().getFullYear();
    return 'TNA-' + year + '-' + String(highest + 1).padStart(4, '0');
  } finally {
    lock.releaseLock();
  }
}

function saveAssessmentDraft(tnaId, payload) {
  var user = requireAuthenticatedUser();
  validateAssessmentPayload(payload);

  var existing = getAssessmentById(tnaId);
  if (!existing) {
    return createNewAssessment(payload);
  }

  if (!canManagerEditAssessment(tnaId, user.UserID)) {
    throw new Error('This assessment is not editable in its current state.');
  }

  var sheet = getSheetByName(TNA_CONFIG.SHEETS.TNA_ASSESSMENTS);
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var rowIndex = -1;

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][headers.indexOf('TNAID')]).toLowerCase() === String(tnaId).toLowerCase()) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error('TNA record could not be found for update.');
  }

  var nextVersion = Number(existing.CurrentVersion || 1);
  var updatedAt = getCurrentTimestamp();

  sheet.getRange(rowIndex, headers.indexOf('AssessmentData') + 1).setValue(JSON.stringify(payload));
  sheet.getRange(rowIndex, headers.indexOf('CurrentStatus') + 1).setValue(TNA_CONFIG.WORKFLOW_STATUSES.DRAFT);
  sheet.getRange(rowIndex, headers.indexOf('CurrentVersion') + 1).setValue(nextVersion);
  sheet.getRange(rowIndex, headers.indexOf('UpdatedAt') + 1).setValue(updatedAt);
  sheet.getRange(rowIndex, headers.indexOf('UpdatedBy') + 1).setValue(user.UserID);

  createAssessmentSnapshot(tnaId, nextVersion, payload, user.UserID, 'Draft updated');
  logAudit(user.UserID, 'SAVE_DRAFT', 'TNA', tnaId, 'Saved draft for assessment ' + existing.TNAReference, '');

  return buildResponse(true, { TNAID: tnaId }, 'Draft saved successfully.', null);
}

function submitAssessment(tnaId, payload) {
  var user = requirePermission('TNA_SUBMIT');
  validateAssessmentPayload(payload);

  var assessment = getAssessmentById(tnaId);
  if (!assessment) {
    throw new Error('Assessment not found.');
  }

  if (String(assessment.ManagerUserID || '').toLowerCase() !== String(user.UserID || '').toLowerCase()) {
    throw new Error('Only the assigned manager can submit this assessment.');
  }

  var currentStatus = String(assessment.CurrentStatus || 'DRAFT');
  var nextVersion = Number(assessment.CurrentVersion || 1) + 1;

  if (currentStatus === TNA_CONFIG.WORKFLOW_STATUSES.DRAFT || currentStatus === TNA_CONFIG.WORKFLOW_STATUSES.RETURNED_TO_MANAGER) {
    createAssessmentSnapshot(tnaId, nextVersion, payload, user.UserID, 'Assessment submitted for employee acknowledgment');
    transitionAssessmentStatus(tnaId, TNA_CONFIG.WORKFLOW_STATUSES.PENDING_EMPLOYEE_ACKNOWLEDGMENT, 'SUBMIT', user.UserID, 'Assessment submitted for acknowledgment.', payload, nextVersion);
    logAudit(user.UserID, 'SUBMIT_TNA', 'TNA', tnaId, 'Submitted assessment for employee acknowledgment', '');
    notifyAssessmentSubmitted(tnaId);

    return buildResponse(true, { TNAID: tnaId, TNAReference: assessment.TNAReference, Version: nextVersion }, 'Assessment submitted successfully.', null);
  }

  throw new Error('This assessment cannot be submitted in its current state.');
}

function resubmitReturnedAssessment(tnaId, payload, revisionReason) {
  var user = requireAuthenticatedUser();
  var assessment = getAssessmentById(tnaId);

  if (!assessment) {
    throw new Error('Assessment not found.');
  }

  if (String(assessment.ManagerUserID || '').toLowerCase() !== String(user.UserID || '').toLowerCase()) {
    throw new Error('Only the assigned manager can resubmit this assessment.');
  }

  if (String(assessment.CurrentStatus || '').toUpperCase() !== TNA_CONFIG.WORKFLOW_STATUSES.RETURNED_TO_MANAGER) {
    throw new Error('This assessment is not currently returned to the manager for revision.');
  }

  validateAssessmentPayload(payload);

  var nextVersion = Number(assessment.CurrentVersion || 1) + 1;
  createAssessmentSnapshot(tnaId, nextVersion, payload, user.UserID, revisionReason || 'Manager revised returned assessment');
  transitionAssessmentStatus(tnaId, TNA_CONFIG.WORKFLOW_STATUSES.PENDING_EMPLOYEE_ACKNOWLEDGMENT, 'MANAGER_RESUBMIT', user.UserID, revisionReason || 'Manager revised the assessment and resubmitted it.', payload, nextVersion);
  logAudit(user.UserID, 'RESUBMIT_TNA', 'TNA', tnaId, 'Manager revised and resubmitted returned assessment', '');
  notifyAssessmentSubmitted(tnaId);

  return buildResponse(true, { TNAID: tnaId, Version: nextVersion }, 'Assessment resubmitted for employee review.', null);
}

function acknowledgeAssessment(tnaId, comments) {
  var user = requirePermission('TNA_ACKNOWLEDGE');
  var assessment = getAssessmentById(tnaId);

  if (!assessment) {
    throw new Error('Assessment not found.');
  }

  if (String(assessment.EmployeeID || '').toLowerCase() !== String(user.EmployeeID || '').toLowerCase()) {
    throw new Error('You are not authorized to acknowledge this assessment.');
  }

  if (String(assessment.CurrentStatus || '').toUpperCase() !== TNA_CONFIG.WORKFLOW_STATUSES.PENDING_EMPLOYEE_ACKNOWLEDGMENT) {
    throw new Error('Assessment cannot be acknowledged in its current status.');
  }

  transitionAssessmentStatus(tnaId, TNA_CONFIG.WORKFLOW_STATUSES.PENDING_HOD_APPROVAL, 'EMPLOYEE_ACKNOWLEDGE', user.UserID, comments || 'Employee acknowledged the assessment.');
  logAudit(user.UserID, 'ACKNOWLEDGE_TNA', 'TNA', tnaId, 'Employee acknowledged assessment', '');
  notifyEmployeeAcknowledgementCompleted(tnaId);
  notifyHodForApproval(tnaId);

  return buildResponse(true, { TNAID: tnaId }, 'Assessment acknowledged successfully.', null);
}

function returnAssessmentForRevision(tnaId, comments) {
  var user = requirePermission('TNA_ACKNOWLEDGE');
  var assessment = getAssessmentById(tnaId);

  if (!assessment) {
    throw new Error('Assessment not found.');
  }

  if (String(assessment.EmployeeID || '').toLowerCase() !== String(user.EmployeeID || '').toLowerCase()) {
    throw new Error('You cannot return this assessment for revision.');
  }

  if (!comments || String(comments).trim() === '') {
    throw new Error('A return reason is required before sending the assessment back for revision.');
  }

  transitionAssessmentStatus(tnaId, TNA_CONFIG.WORKFLOW_STATUSES.RETURNED_TO_MANAGER, 'EMPLOYEE_RETURN', user.UserID, comments);
  logAudit(user.UserID, 'RETURN_TNA_TO_MANAGER', 'TNA', tnaId, 'Employee returned assessment with comments', '');
  notifyManagerRevisionRequired(tnaId);

  return buildResponse(true, { TNAID: tnaId }, 'Assessment returned to manager for revision.', null);
}

function approveAssessment(tnaId, comments) {
  var user = requirePermission('TNA_APPROVE');
  var assessment = getAssessmentById(tnaId);

  if (!assessment) {
    throw new Error('Assessment not found.');
  }

  if (String(assessment.HODUserID || '').toLowerCase() !== String(user.UserID || '').toLowerCase()) {
    throw new Error('You are not assigned as the HOD for this assessment.');
  }

  if (String(assessment.CurrentStatus || '').toUpperCase() !== TNA_CONFIG.WORKFLOW_STATUSES.PENDING_HOD_APPROVAL) {
    throw new Error('This assessment is not awaiting HOD approval.');
  }

  if (isEmptyValue(assessment.EmployeeAcknowledgedAt)) {
    throw new Error('The current assessment version has not been acknowledged by the employee.');
  }

  transitionAssessmentStatus(tnaId, TNA_CONFIG.WORKFLOW_STATUSES.APPROVED, 'HOD_APPROVE', user.UserID, comments || 'Approved by HOD.');
  logAudit(user.UserID, 'APPROVE_TNA', 'TNA', tnaId, 'HOD approved assessment', '');

  return buildResponse(true, { TNAID: tnaId }, 'Assessment approved successfully.', null);
}

function hodReturnAssessment(tnaId, comments) {
  var user = requirePermission('TNA_RETURN');
  var assessment = getAssessmentById(tnaId);

  if (!assessment) {
    throw new Error('Assessment not found.');
  }

  if (String(assessment.HODUserID || '').toLowerCase() !== String(user.UserID || '').toLowerCase()) {
    throw new Error('You are not assigned as the HOD for this assessment.');
  }

  if (!comments || String(comments).trim() === '') {
    throw new Error('A return reason is required before returning the assessment.');
  }

  transitionAssessmentStatus(tnaId, TNA_CONFIG.WORKFLOW_STATUSES.RETURNED_TO_MANAGER, 'HOD_RETURN', user.UserID, comments);
  logAudit(user.UserID, 'HOD_RETURN_TNA', 'TNA', tnaId, 'HOD returned assessment for revision', '');
  notifyManagerRevisionRequired(tnaId);

  return buildResponse(true, { TNAID: tnaId }, 'Assessment returned to manager for revision.', null);
}

function getAssessmentWorkflowHistory(tnaId) {
  var sheet = getSheetByName(TNA_CONFIG.SHEETS.WORKFLOW_HISTORY);
  if (!sheet) {
    return [];
  }

  return sheetToObjects(sheet).filter(function(row) {
    return String(row.TNAID || '').toLowerCase() === String(tnaId || '').toLowerCase();
  }).sort(function(a, b) {
    return new Date(a.ActionAt || 0) - new Date(b.ActionAt || 0);
  });
}
