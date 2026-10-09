function createUser(inputData) {
  requirePermission('USER_CREATE');

  var email = normalizeEmail(inputData.Email);
  if (!email) {
    throw new Error('A valid email address is required.');
  }

  if (getUserByEmail(email)) {
    throw new Error('A user with this email already exists.');
  }

  var userId = generateId('USER');
  var timestamp = getCurrentTimestamp();
  var userSheet = getSheetByName(TNA_CONFIG.SHEETS.USERS);

  userSheet.appendRow([
    userId,
    inputData.EmployeeID || '',
    inputData.FullName || '',
    email,
    inputData.DepartmentID || '',
    inputData.JobTitle || '',
    inputData.ManagerUserID || '',
    inputData.HODUserID || '',
    inputData.AccountStatus || 'ACTIVE',
    timestamp,
    inputData.CreatedBy || getCurrentUserEmail(),
    timestamp,
    inputData.UpdatedBy || getCurrentUserEmail()
  ]);

  if (inputData.RoleName) {
    assignUserRole(userId, inputData.RoleName, inputData.CreatedBy || getCurrentUserEmail());
  }

  return buildResponse(true, { UserID: userId }, 'User created successfully.', null);
}

function getUserById(userId) {
  var users = getTableData(TNA_CONFIG.SHEETS.USERS);
  return users.find(function(user) {
    return String(user.UserID || '').toLowerCase() === String(userId || '').toLowerCase();
  }) || null;
}

function getAllUsers() {
  return getTableData(TNA_CONFIG.SHEETS.USERS);
}

function updateUserStatus(userId, accountStatus) {
  requirePermission('USER_EDIT');

  var sheet = getSheetByName(TNA_CONFIG.SHEETS.USERS);
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idx = headers.indexOf('UserID');
  var statusIndex = headers.indexOf('AccountStatus');
  var updatedAtIndex = headers.indexOf('UpdatedAt');
  var updatedByIndex = headers.indexOf('UpdatedBy');

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idx]).toLowerCase() === String(userId).toLowerCase()) {
      sheet.getRange(i + 1, statusIndex + 1).setValue(accountStatus);
      sheet.getRange(i + 1, updatedAtIndex + 1).setValue(getCurrentTimestamp());
      sheet.getRange(i + 1, updatedByIndex + 1).setValue(getCurrentUserEmail());
      return buildResponse(true, { UserID: userId }, 'User status updated.', null);
    }
  }

  return buildResponse(false, null, 'User not found.', 'USER_NOT_FOUND');
}

function listUsersForAdmin() {
  requirePermission('USER_VIEW');
  return buildResponse(true, getAllUsers(), 'User list loaded.', null);
}

function adminCreateUser(payload) {
  return createUser(payload);
}
