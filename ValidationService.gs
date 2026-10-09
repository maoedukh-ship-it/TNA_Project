function validateAssessmentPayload(payload) {
  if (!payload) {
    throw new Error('Assessment payload is required.');
  }

  var requiredFields = ['EmployeeID', 'EmployeeName', 'DepartmentID', 'JobTitle', 'AssessmentPeriod'];
  for (var i = 0; i < requiredFields.length; i++) {
    var field = requiredFields[i];
    if (isEmptyValue(payload[field])) {
      throw new Error('Missing required assessment field: ' + field);
    }
  }

  if (!payload.Competencies || !Array.isArray(payload.Competencies) || payload.Competencies.length === 0) {
    throw new Error('At least one competency assessment is required.');
  }

  for (var j = 0; j < payload.Competencies.length; j++) {
    var competency = payload.Competencies[j];
    if (!competency.Name) {
      throw new Error('Each competency requires a name.');
    }
    if (isEmptyValue(competency.Rating)) {
      throw new Error('Competency rating is required for: ' + competency.Name);
    }
    if (Number(competency.Rating) < 1 || Number(competency.Rating) > 5) {
      throw new Error('Competency rating must be between 1 and 5 for: ' + competency.Name);
    }
  }

  return true;
}

function validateStatusTransition(currentStatus, nextStatus) {
  var allowed = {
    'DRAFT': ['PENDING_EMPLOYEE_ACKNOWLEDGMENT'],
    'PENDING_EMPLOYEE_ACKNOWLEDGMENT': ['PENDING_HOD_APPROVAL', 'RETURNED_TO_MANAGER'],
    'RETURNED_TO_MANAGER': ['PENDING_EMPLOYEE_ACKNOWLEDGMENT'],
    'PENDING_HOD_APPROVAL': ['APPROVED', 'RETURNED_TO_MANAGER'],
    'APPROVED': [],
    'CANCELLED': []
  };

  var list = allowed[String(currentStatus || '').toUpperCase()] || [];
  var normalized = String(nextStatus || '').toUpperCase();

  if (list.indexOf(normalized) === -1) {
    throw new Error('Invalid status transition from ' + currentStatus + ' to ' + nextStatus + '.');
  }

  return true;
}
