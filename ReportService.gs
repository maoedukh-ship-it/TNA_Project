function getReportData(reportType, filters) {
  var user = requireAuthenticatedUser();
  var assessments = getTableData(TNA_CONFIG.SHEETS.TNA_ASSESSMENTS);

  if (!userHasPermission(user.UserID, 'TNA_VIEW_ALL') && !userHasPermission(user.UserID, 'TNA_VIEW_ASSIGNED')) {
    return buildResponse(false, [], 'You are not authorized to access reports.', 'REPORT_FORBIDDEN');
  }

  var filtered = assessments.filter(function(item) {
    if (!filters) {
      return true;
    }

    if (filters.department && String(item.DepartmentID || '').toLowerCase() !== String(filters.department || '').toLowerCase()) {
      return false;
    }

    if (filters.status && String(item.CurrentStatus || '').toLowerCase() !== String(filters.status || '').toLowerCase()) {
      return false;
    }

    return true;
  });

  return buildResponse(true, filtered, 'Report data retrieved successfully.', null);
}

function exportTNAReportCSV(reportType, filters) {
  var auth = getReportData(reportType, filters);
  if (!auth.success) {
    return auth;
  }

  var rows = auth.data || [];
  if (!rows.length) {
    return buildResponse(true, [], 'No records found for export.', null);
  }

  var csvRows = [];
  var headers = ['TNAReference', 'EmployeeID', 'ManagerUserID', 'HODUserID', 'CurrentStatus', 'AssessmentPeriod', 'CreatedAt'];
  csvRows.push(headers.join(','));

  rows.forEach(function(row) {
    var line = [
      row.TNAReference || '',
      row.EmployeeID || '',
      row.ManagerUserID || '',
      row.HODUserID || '',
      row.CurrentStatus || '',
      row.AssessmentPeriod || '',
      row.CreatedAt || ''
    ].map(function(value) {
      return '"' + String(value).replace(/"/g, '""') + '"';
    }).join(',');
    csvRows.push(line);
  });

  return buildResponse(true, { csv: csvRows.join('\n') }, 'CSV export generated.', null);
}

function getAssessmentRegisterReport(filters) {
  return getReportData('ASSESSMENT_REGISTER', filters);
}

function getPendingAcknowledgmentReport(filters) {
  var result = getReportData('PENDING_ACK', filters);
  if (!result.success) {
    return result;
  }

  result.data = result.data.filter(function(item) {
    return String(item.CurrentStatus || '').toUpperCase() === TNA_CONFIG.WORKFLOW_STATUSES.PENDING_EMPLOYEE_ACKNOWLEDGMENT;
  });

  return result;
}

function getPendingHodApprovalReport(filters) {
  var result = getReportData('PENDING_HOD', filters);
  if (!result.success) {
    return result;
  }

  result.data = result.data.filter(function(item) {
    return String(item.CurrentStatus || '').toUpperCase() === TNA_CONFIG.WORKFLOW_STATUSES.PENDING_HOD_APPROVAL;
  });

  return result;
}

function getApprovedAssessmentReport(filters) {
  var result = getReportData('APPROVED', filters);
  if (!result.success) {
    return result;
  }

  result.data = result.data.filter(function(item) {
    return String(item.CurrentStatus || '').toUpperCase() === TNA_CONFIG.WORKFLOW_STATUSES.APPROVED;
  });

  return result;
}
