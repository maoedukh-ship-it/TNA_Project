function sendWorkflowEmail(recipientEmail, subject, body) {
  var settingsSheet = getSheetByName(TNA_CONFIG.SHEETS.SYSTEM_SETTINGS);
  var settings = sheetToObjects(settingsSheet || getSystemSpreadsheet().getSheetByName(TNA_CONFIG.SHEETS.SYSTEM_SETTINGS));
  var emailEnabled = settings.find(function(row) {
    return String(row.SettingKey || '').toLowerCase() === 'email_enabled';
  });

  if (emailEnabled && String(emailEnabled.SettingValue || '').toLowerCase() === 'false') {
    return { success: false, message: 'Email service is disabled by configuration.' };
  }

  if (!recipientEmail || String(recipientEmail).trim() === '') {
    return { success: false, message: 'No valid recipient email provided.' };
  }

  try {
    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      htmlBody: body
    });

    return { success: true, message: 'Email sent successfully.' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function logNotification(tnaId, recipientEmail, notificationType, status, errorMessage) {
  var sheet = getSheetByName(TNA_CONFIG.SHEETS.NOTIFICATIONS_LOG);
  if (!sheet) {
    return false;
  }

  sheet.appendRow([
    generateId('NOTIF'),
    tnaId || '',
    recipientEmail || '',
    notificationType || 'GENERIC',
    getCurrentTimestamp(),
    getCurrentTimestamp(),
    status || 'PENDING',
    errorMessage || '',
    0
  ]);

  return true;
}

function notifyAssessmentSubmitted(tnaId) {
  var assessment = getAssessmentById(tnaId);
  if (!assessment) {
    return { success: false, message: 'Assessment not found.' };
  }

  var employee = getUserById(assessment.EmployeeID) || getUserByEmail(assessment.EmployeeID);
  var recipient = employee ? employee.Email : '';
  var result = sendWorkflowEmail(recipient, 'TNA assessment submitted for acknowledgment', '<p>A manager has submitted a TNA assessment for ' + (employee ? employee.FullName : 'your review') + '.</p><p>Reference: ' + assessment.TNAReference + '</p><p>Status: ' + assessment.CurrentStatus + '</p><p>Please review and acknowledge or return it for revision.</p>');
  logNotification(tnaId, recipient, 'ASSESSMENT_SUBMITTED', result.success ? 'SENT' : 'FAILED', result.message || '');
  return result;
}

function notifyEmployeeAcknowledgementCompleted(tnaId) {
  var assessment = getAssessmentById(tnaId);
  if (!assessment) {
    return { success: false, message: 'Assessment not found.' };
  }

  var hod = getUserById(assessment.HODUserID) || null;
  var recipient = hod ? hod.Email : '';
  var result = sendWorkflowEmail(recipient, 'TNA acknowledged and awaiting HOD approval', '<p>The employee has acknowledged the assessment.</p><p>Reference: ' + assessment.TNAReference + '</p><p>Please review and approve or return the record.</p>');
  logNotification(tnaId, recipient, 'ACKNOWLEDGED', result.success ? 'SENT' : 'FAILED', result.message || '');
  return result;
}

function notifyManagerRevisionRequired(tnaId) {
  var assessment = getAssessmentById(tnaId);
  if (!assessment) {
    return { success: false, message: 'Assessment not found.' };
  }

  var manager = getUserById(assessment.ManagerUserID);
  var recipient = manager ? manager.Email : '';
  var result = sendWorkflowEmail(recipient, 'TNA returned for revision', '<p>The assessment has been returned for revision.</p><p>Reference: ' + assessment.TNAReference + '</p><p>Please review the feedback and resubmit the record.</p>');
  logNotification(tnaId, recipient, 'RETURNED_TO_MANAGER', result.success ? 'SENT' : 'FAILED', result.message || '');
  return result;
}

function notifyHodForApproval(tnaId) {
  var assessment = getAssessmentById(tnaId);
  if (!assessment) {
    return { success: false, message: 'Assessment not found.' };
  }

  var hod = getUserById(assessment.HODUserID);
  var recipient = hod ? hod.Email : '';
  var result = sendWorkflowEmail(recipient, 'TNA approval required', '<p>An assessment is ready for HOD approval.</p><p>Reference: ' + assessment.TNAReference + '</p><p>Employee: ' + (getUserById(assessment.EmployeeID) ? getUserById(assessment.EmployeeID).FullName : assessment.EmployeeID) + '</p>');
  logNotification(tnaId, recipient, 'HOD_APPROVAL_REQUIRED', result.success ? 'SENT' : 'FAILED', result.message || '');
  return result;
}
