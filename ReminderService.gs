function getPendingAssessmentsForReminder() {
  var rows = getTableData(TNA_CONFIG.SHEETS.TNA_ASSESSMENTS);
  return rows.filter(function(record) {
    var status = String(record.CurrentStatus || '').toUpperCase();
    return status === TNA_CONFIG.WORKFLOW_STATUSES.PENDING_EMPLOYEE_ACKNOWLEDGMENT ||
      status === TNA_CONFIG.WORKFLOW_STATUSES.PENDING_HOD_APPROVAL ||
      status === TNA_CONFIG.WORKFLOW_STATUSES.RETURNED_TO_MANAGER;
  });
}

function sendReminderForAssessment(tnaId, reminderType) {
  var user = requirePermission('WORKFLOW_REMIND');
  var assessment = getAssessmentById(tnaId);
  if (!assessment) {
    throw new Error('Assessment not found.');
  }

  var recipient = '';
  var subject = 'TNA reminder';
  var body = '<p>This is a reminder for the TNA record ' + assessment.TNAReference + '.</p><p>Status: ' + assessment.CurrentStatus + '</p>';

  if (String(assessment.CurrentStatus || '').toUpperCase() === TNA_CONFIG.WORKFLOW_STATUSES.PENDING_EMPLOYEE_ACKNOWLEDGMENT) {
    var employee = getUserById(assessment.EmployeeID);
    recipient = employee ? employee.Email : '';
    subject = 'TNA reminder: employee acknowledgment required';
    body += '<p>Please review and acknowledge the assessment.</p>';
  } else if (String(assessment.CurrentStatus || '').toUpperCase() === TNA_CONFIG.WORKFLOW_STATUSES.PENDING_HOD_APPROVAL) {
    var hod = getUserById(assessment.HODUserID);
    recipient = hod ? hod.Email : '';
    subject = 'TNA reminder: HOD approval required';
    body += '<p>Please review and approve the assessment.</p>';
  } else if (String(assessment.CurrentStatus || '').toUpperCase() === TNA_CONFIG.WORKFLOW_STATUSES.RETURNED_TO_MANAGER) {
    var manager = getUserById(assessment.ManagerUserID);
    recipient = manager ? manager.Email : '';
    subject = 'TNA reminder: assessment returned for revision';
    body += '<p>Please revise and resubmit the assessment.</p>';
  }

  if (!recipient) {
    throw new Error('No recipient could be resolved for this reminder.');
  }

  var sent = sendWorkflowEmail(recipient, subject, body);
  logNotification(tnaId, recipient, reminderType || 'REMINDER', sent.success ? 'SENT' : 'FAILED', sent.message || '');
  logAudit(user.UserID, 'SEND_REMINDER', 'TNA', tnaId, 'Sent reminder to ' + recipient + ' for status ' + assessment.CurrentStatus, '');

  return buildResponse(sent.success, { TNAID: tnaId, Recipient: recipient }, sent.success ? 'Reminder sent successfully.' : 'Reminder failed to send.', sent.success ? null : 'REMINDER_FAILED');
}

function getReminderHistory(tnaId) {
  var rows = getTableData(TNA_CONFIG.SHEETS.NOTIFICATIONS_LOG);
  return rows.filter(function(row) {
    return String(row.TNAID || '').toLowerCase() === String(tnaId || '').toLowerCase();
  });
}
