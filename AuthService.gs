function loginAdmin(username, password) {
  var suppliedUser = normalizeEmail(username);
  var suppliedPassword = String(password || '');
  var expectedUser = normalizeEmail(getScriptProperty(TNA_CONFIG.ADMIN_USERNAME_PROPERTY_KEY));
  var expectedPassword = String(getScriptProperty(TNA_CONFIG.ADMIN_PASSWORD_PROPERTY_KEY) || '');

  if (!expectedUser || !expectedPassword) {
    return buildResponse(false, null, 'Administrator credentials are not configured. Set TNA_ADMIN_USERNAME and TNA_ADMIN_PASSWORD in Apps Script project settings.', 'ADMIN_CREDENTIALS_NOT_CONFIGURED');
  }

  if (!suppliedUser || !suppliedPassword) {
    return buildResponse(false, null, 'Username and password are required.', 'LOGIN_REQUIRED');
  }

  if (suppliedUser !== expectedUser || suppliedPassword !== expectedPassword) {
    return buildResponse(false, null, 'Invalid username or password.', 'INVALID_CREDENTIALS');
  }

  var adminUser = {
    UserID: 'ADMIN-ROOT',
    EmployeeID: 'ADMIN-001',
    FullName: 'System Administrator',
    Email: expectedUser,
    DepartmentID: 'ADMIN',
    JobTitle: 'System Administrator',
    ManagerUserID: '',
    HODUserID: '',
    AccountStatus: 'ACTIVE'
  };

  return buildResponse(true, { user: adminUser, permissions: TNA_CONFIG.DEFAULT_PERMISSION_MAP['System Administrator'] || [] }, 'Login successful.', null);
}

function getCurrentUserEmail() {
  var user = Session.getActiveUser();
  if (!user || !user.getEmail) {
    return '';
  }
  return normalizeEmail(user.getEmail());
}

function getCurrentUserRecord() {
  var email = getCurrentUserEmail();
  if (!email) {
    return null;
  }

  return getUserByEmail(email);
}

function getUserByEmail(email) {
  var users = getTableData(TNA_CONFIG.SHEETS.USERS);
  if (!email) {
    return null;
  }

  var normalizedEmail = normalizeEmail(email);
  return users.find(function(user) {
    return normalizeEmail(user.Email) === normalizedEmail;
  }) || null;
}

function requireAuthenticatedUser() {
  var user = getCurrentUserRecord();
  if (!user) {
    throw new Error('Authentication required. Your Google account is not registered in the TNA system.');
  }

  if (String(user.AccountStatus || '').toUpperCase() !== 'ACTIVE') {
    throw new Error('Your account is inactive or suspended. Please contact the system administrator.');
  }

  return user;
}

function requirePermission(permissionCode) {
  var user = requireAuthenticatedUser();
  if (!userHasPermission(user.UserID, permissionCode)) {
    throw new Error('Permission denied. Missing required permission: ' + permissionCode);
  }

  return user;
}

function requireRole(roleName) {
  var user = requireAuthenticatedUser();
  var roleIds = getUserRoleIds(user.UserID);
  var roles = getAllRoles();
  var roleNames = roleIds.map(function(roleId) {
    var match = roles.find(function(role) {
      return String(role.RoleID) === String(roleId);
    });
    return match ? match.RoleName : '';
  }).filter(Boolean);

  if (roleNames.indexOf(roleName) === -1) {
    throw new Error('Role required: ' + roleName);
  }

  return user;
}

function getAuthStatus() {
  var user = getCurrentUserRecord();
  if (!user) {
    return buildResponse(false, { isAuthenticated: false }, 'No active user account found.', 'AUTH_REQUIRED');
  }

  return buildResponse(true, {
    isAuthenticated: true,
    user: user,
    permissions: getUserPermissionCodes(user.UserID)
  }, 'Authenticated user loaded successfully.', null);
}
