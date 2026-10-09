function getAllRoles() {
  return getTableData(TNA_CONFIG.SHEETS.ROLES);
}

function getAllPermissions() {
  return getTableData(TNA_CONFIG.SHEETS.PERMISSIONS);
}

function getRoleById(roleId) {
  var roles = getAllRoles();
  return roles.find(function(role) {
    return String(role.RoleID) === String(roleId);
  }) || null;
}

function getRoleByName(roleName) {
  var roles = getAllRoles();
  return roles.find(function(role) {
    return String(role.RoleName || '').toLowerCase() === String(roleName || '').toLowerCase();
  }) || null;
}

function getPermissionByCode(permissionCode) {
  var permissions = getAllPermissions();
  return permissions.find(function(permission) {
    return String(permission.PermissionCode || '').toLowerCase() === String(permissionCode || '').toLowerCase();
  }) || null;
}

function getUserRoleIds(userId) {
  var sheet = getSheetByName(TNA_CONFIG.SHEETS.USER_ROLES);
  if (!sheet) {
    return [];
  }

  var rows = sheetToObjects(sheet);
  return rows.filter(function(row) {
    return String(row.UserID || '').toLowerCase() === String(userId || '').toLowerCase();
  }).map(function(row) {
    return row.RoleID;
  });
}

function getUserPermissionCodes(userId) {
  var roleIds = getUserRoleIds(userId);
  if (!roleIds.length) {
    return [];
  }

  var allPermissions = getAllPermissions();
  var rolePermissionRows = getTableData(TNA_CONFIG.SHEETS.ROLE_PERMISSIONS);

  var permissionIds = [];
  for (var i = 0; i < rolePermissionRows.length; i++) {
    var row = rolePermissionRows[i];
    if (roleIds.indexOf(row.RoleID) !== -1) {
      permissionIds.push(row.PermissionID);
    }
  }

  var codes = allPermissions.filter(function(permission) {
    return permissionIds.indexOf(permission.PermissionID) !== -1;
  }).map(function(permission) {
    return permission.PermissionCode;
  });

  return codes.filter(function(code, index, arr) {
    return arr.indexOf(code) === index;
  });
}

function userHasPermission(userId, permissionCode) {
  var list = getUserPermissionCodes(userId);
  return list.indexOf(permissionCode) !== -1;
}

function assignUserRole(userId, roleName, assignedBy) {
  var roleRecord = getRoleByName(roleName);
  if (!roleRecord) {
    throw new Error('Role not found: ' + roleName);
  }

  var userRolesSheet = getSheetByName(TNA_CONFIG.SHEETS.USER_ROLES);
  var existing = sheetToObjects(userRolesSheet).some(function(row) {
    return String(row.UserID || '').toLowerCase() === String(userId || '').toLowerCase() &&
      String(row.RoleID || '').toLowerCase() === String(roleRecord.RoleID || '').toLowerCase();
  });

  if (!existing) {
    userRolesSheet.appendRow([userId, roleRecord.RoleID, assignedBy || 'SYSTEM', getCurrentTimestamp()]);
  }

  return true;
}
