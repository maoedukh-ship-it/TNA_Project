function setupSystem() {
  var spreadsheet = getSystemSpreadsheet();

  ensureSheet(spreadsheet, TNA_CONFIG.SHEETS.USERS, TNA_CONFIG.USER_HEADERS);
  ensureSheet(spreadsheet, TNA_CONFIG.SHEETS.ROLES, TNA_CONFIG.ROLE_HEADERS);
  ensureSheet(spreadsheet, TNA_CONFIG.SHEETS.PERMISSIONS, TNA_CONFIG.PERMISSION_HEADERS);
  ensureSheet(spreadsheet, TNA_CONFIG.SHEETS.USER_ROLES, TNA_CONFIG.USER_ROLE_HEADERS);
  ensureSheet(spreadsheet, TNA_CONFIG.SHEETS.ROLE_PERMISSIONS, TNA_CONFIG.ROLE_PERMISSION_HEADERS);
  ensureSheet(spreadsheet, TNA_CONFIG.SHEETS.DEPARTMENTS, TNA_CONFIG.DEPARTMENT_HEADERS);
  ensureSheet(spreadsheet, TNA_CONFIG.SHEETS.TNA_ASSESSMENTS, TNA_CONFIG.TNA_HEADERS);
  ensureSheet(spreadsheet, TNA_CONFIG.SHEETS.TNA_ANSWERS, TNA_CONFIG.TNA_ANSWER_HEADERS);
  ensureSheet(spreadsheet, TNA_CONFIG.SHEETS.TNA_VERSIONS, TNA_CONFIG.TNA_VERSION_HEADERS);
  ensureSheet(spreadsheet, TNA_CONFIG.SHEETS.WORKFLOW_HISTORY, TNA_CONFIG.WORKFLOW_HEADERS);
  ensureSheet(spreadsheet, TNA_CONFIG.SHEETS.NOTIFICATIONS_LOG, TNA_CONFIG.NOTIFICATION_HEADERS);
  ensureSheet(spreadsheet, TNA_CONFIG.SHEETS.AUDIT_LOG, TNA_CONFIG.AUDIT_HEADERS);
  ensureSheet(spreadsheet, TNA_CONFIG.SHEETS.SYSTEM_SETTINGS, TNA_CONFIG.SETTINGS_HEADERS);

  initializeDefaultRolesAndPermissions();
  initializeSystemSettings();
  seedAdminUsers();

  return buildResponse(true, { spreadsheetId: spreadsheet.getId() }, 'System initialized successfully.', null);
}

function initializeDefaultRolesAndPermissions() {
  var rolesSheet = getSheetByName(TNA_CONFIG.SHEETS.ROLES);
  var permissionsSheet = getSheetByName(TNA_CONFIG.SHEETS.PERMISSIONS);
  var rolePermissionsSheet = getSheetByName(TNA_CONFIG.SHEETS.ROLE_PERMISSIONS);

  if (!rolesSheet || !permissionsSheet || !rolePermissionsSheet) {
    return;
  }

  var roles = sheetToObjects(rolesSheet);
  for (var i = 0; i < TNA_CONFIG.DEFAULT_ROLES.length; i++) {
    var role = TNA_CONFIG.DEFAULT_ROLES[i];
    var exists = roles.some(function(row) {
      return String(row.RoleName || '').toLowerCase() === String(role.RoleName).toLowerCase();
    });

    if (!exists) {
      rolesSheet.appendRow([generateId('ROLE'), role.RoleName, role.Description, 'TRUE']);
    }
  }

  var permissions = sheetToObjects(permissionsSheet);
  for (var j = 0; j < TNA_CONFIG.DEFAULT_PERMISSIONS.length; j++) {
    var permission = TNA_CONFIG.DEFAULT_PERMISSIONS[j];
    var exists = permissions.some(function(row) {
      return String(row.PermissionCode || '').toLowerCase() === String(permission.PermissionCode).toLowerCase();
    });

    if (!exists) {
      permissionsSheet.appendRow([generateId('PERM'), permission.PermissionCode, permission.Description]);
    }
  }

  var roleMap = sheetToObjects(rolesSheet);
  var permissionMap = sheetToObjects(permissionsSheet);
  var rolePermissions = sheetToObjects(rolePermissionsSheet);

  for (var k = 0; k < TNA_CONFIG.DEFAULT_ROLES.length; k++) {
    var defaultRole = TNA_CONFIG.DEFAULT_ROLES[k];
    var roleRecord = roleMap.find(function(row) {
      return String(row.RoleName || '').toLowerCase() === String(defaultRole.RoleName).toLowerCase();
    });

    if (!roleRecord) {
      continue;
    }

    var allowedPermissions = TNA_CONFIG.DEFAULT_PERMISSION_MAP[defaultRole.RoleName] || [];
    for (var m = 0; m < allowedPermissions.length; m++) {
      var permissionCode = allowedPermissions[m];
      var permissionRecord = permissionMap.find(function(row) {
        return String(row.PermissionCode || '').toLowerCase() === String(permissionCode).toLowerCase();
      });

      if (!permissionRecord) {
        continue;
      }

      var pairExists = rolePermissions.some(function(row) {
        return String(row.RoleID || '').toLowerCase() === String(roleRecord.RoleID || '').toLowerCase() &&
          String(row.PermissionID || '').toLowerCase() === String(permissionRecord.PermissionID || '').toLowerCase();
      });

      if (!pairExists) {
        rolePermissionsSheet.appendRow([roleRecord.RoleID, permissionRecord.PermissionID]);
      }
    }
  }
}

function initializeSystemSettings() {
  var sheet = getSheetByName(TNA_CONFIG.SHEETS.SYSTEM_SETTINGS);
  if (!sheet) {
    return;
  }

  var configRows = sheetToObjects(sheet);
  var defaults = [
    ['APP_NAME', TNA_CONFIG.APP_NAME, 'Application display name', 'SYSTEM', getCurrentTimestamp()],
    ['WORKFLOW_ENABLED', 'TRUE', 'Main workflow engine enabled', 'SYSTEM', getCurrentTimestamp()],
    ['REMINDER_COOLDOWN_MINUTES', '60', 'Minimum time between reminders', 'SYSTEM', getCurrentTimestamp()],
    ['EMAIL_ENABLED', 'TRUE', 'Allow sending emails from the app', 'SYSTEM', getCurrentTimestamp()],
    ['DEFAULT_ASSESSMENT_PERIOD', '2026', 'Default assessment period', 'SYSTEM', getCurrentTimestamp()]
  ];

  for (var i = 0; i < defaults.length; i++) {
    var entry = defaults[i];
    var exists = configRows.some(function(row) {
      return String(row.SettingKey || '').toLowerCase() === String(entry[0]).toLowerCase();
    });

    if (!exists) {
      sheet.appendRow(entry);
    }
  }
}

function seedAdminUsers() {
  var admins = TNA_CONFIG.DEFAULT_ADMIN_EMAILS || [];
  var configuredAdminEmail = getScriptProperty(TNA_CONFIG.ADMIN_USERNAME_PROPERTY_KEY);
  if (configuredAdminEmail && admins.indexOf(configuredAdminEmail) === -1) {
    admins.push(configuredAdminEmail);
  }

  for (var i = 0; i < admins.length; i++) {
    var email = normalizeEmail(admins[i]);
    if (!email) {
      continue;
    }

    var existing = findRowByKey(TNA_CONFIG.SHEETS.USERS, 'Email', email);
    if (existing) {
      continue;
    }

    var userId = generateId('USER');
    var userSheet = getSheetByName(TNA_CONFIG.SHEETS.USERS);
    userSheet.appendRow([
      userId,
      'ADMIN-001',
      'System Administrator',
      email,
      'ADMIN',
      'System Administrator',
      '',
      '',
      'ACTIVE',
      getCurrentTimestamp(),
      'SYSTEM',
      getCurrentTimestamp(),
      'SYSTEM'
    ]);

    var roleRecord = findRowByKey(TNA_CONFIG.SHEETS.ROLES, 'RoleName', 'System Administrator');
    if (roleRecord) {
      var userRoleSheet = getSheetByName(TNA_CONFIG.SHEETS.USER_ROLES);
      userRoleSheet.appendRow([userId, roleRecord.RoleID, 'SYSTEM', getCurrentTimestamp()]);
    }
  }
}
