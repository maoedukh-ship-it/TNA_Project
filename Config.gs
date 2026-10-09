var TNA_CONFIG = {
  APP_NAME: 'TNA Web App',
  SPREADSHEET_NAME: 'TNA_System_Data',
  SPREADSHEET_ID_PROPERTY_KEY: 'TNA_SPREADSHEET_ID',
  ADMIN_USERNAME_PROPERTY_KEY: 'TNA_ADMIN_USERNAME',
  ADMIN_PASSWORD_PROPERTY_KEY: 'TNA_ADMIN_PASSWORD',
  DEFAULT_ADMIN_EMAILS: [],
  SHEETS: {
    USERS: 'Users',
    ROLES: 'Roles',
    PERMISSIONS: 'Permissions',
    USER_ROLES: 'UserRoles',
    ROLE_PERMISSIONS: 'RolePermissions',
    DEPARTMENTS: 'Departments',
    TNA_ASSESSMENTS: 'TNA_Assessments',
    TNA_ANSWERS: 'TNA_Answers',
    TNA_VERSIONS: 'TNA_Versions',
    WORKFLOW_HISTORY: 'Workflow_History',
    NOTIFICATIONS_LOG: 'Notifications_Log',
    AUDIT_LOG: 'Audit_Log',
    SYSTEM_SETTINGS: 'System_Settings'
  },
  DEFAULT_ROLES: [
    { RoleName: 'System Administrator', Description: 'Full administrative access to the TNA platform.' },
    { RoleName: 'Employee', Description: 'Access to personal TNA records and acknowledgment actions.' },
    { RoleName: 'Line Manager', Description: 'Creates and manages employee assessments.' },
    { RoleName: 'Head of Department', Description: 'Approves or returns department TNA assessments.' }
  ],
  DEFAULT_PERMISSIONS: [
    { PermissionCode: 'USER_CREATE', Description: 'Create user accounts and profiles.' },
    { PermissionCode: 'USER_EDIT', Description: 'Edit user account details and status.' },
    { PermissionCode: 'ROLE_ASSIGN', Description: 'Assign user roles and permissions.' },
    { PermissionCode: 'TNA_CREATE', Description: 'Create new assessments.' },
    { PermissionCode: 'TNA_VIEW_OWN', Description: 'View own TNA records.' },
    { PermissionCode: 'TNA_VIEW_ASSIGNED', Description: 'View records assigned to the current user.' },
    { PermissionCode: 'TNA_VIEW_ALL', Description: 'View all TNA records across the system.' },
    { PermissionCode: 'TNA_EDIT', Description: 'Edit an assessment or draft.' },
    { PermissionCode: 'TNA_SUBMIT', Description: 'Submit an assessment for employee acknowledgment.' },
    { PermissionCode: 'TNA_ACKNOWLEDGE', Description: 'Acknowledge a manager assessment.' },
    { PermissionCode: 'TNA_APPROVE', Description: 'Approve an assessment.' },
    { PermissionCode: 'TNA_RETURN', Description: 'Return an assessment for revision.' },
    { PermissionCode: 'WORKFLOW_REMIND', Description: 'Send reminders for pending workflow actions.' },
    { PermissionCode: 'AUDIT_VIEW', Description: 'View audit logs and activity.' },
    { PermissionCode: 'SYSTEM_CONFIGURE', Description: 'Configure system settings and workflow rules.' }
  ],
  DEFAULT_PERMISSION_MAP: {
    'System Administrator': [
      'USER_CREATE', 'USER_EDIT', 'ROLE_ASSIGN',
      'TNA_CREATE', 'TNA_VIEW_OWN', 'TNA_VIEW_ASSIGNED', 'TNA_VIEW_ALL',
      'TNA_EDIT', 'TNA_SUBMIT', 'TNA_ACKNOWLEDGE', 'TNA_APPROVE', 'TNA_RETURN',
      'WORKFLOW_REMIND', 'AUDIT_VIEW', 'SYSTEM_CONFIGURE'
    ],
    'Employee': ['TNA_VIEW_OWN', 'TNA_ACKNOWLEDGE'],
    'Line Manager': ['TNA_CREATE', 'TNA_VIEW_ASSIGNED', 'TNA_EDIT', 'TNA_SUBMIT'],
    'Head of Department': ['TNA_VIEW_ASSIGNED', 'TNA_APPROVE', 'TNA_RETURN']
  },
  USER_HEADERS: [
    'UserID', 'EmployeeID', 'FullName', 'Email', 'DepartmentID', 'JobTitle',
    'ManagerUserID', 'HODUserID', 'AccountStatus', 'CreatedAt', 'CreatedBy', 'UpdatedAt', 'UpdatedBy'
  ],
  ROLE_HEADERS: ['RoleID', 'RoleName', 'Description', 'IsActive'],
  PERMISSION_HEADERS: ['PermissionID', 'PermissionCode', 'Description'],
  USER_ROLE_HEADERS: ['UserID', 'RoleID', 'AssignedBy', 'AssignedAt'],
  ROLE_PERMISSION_HEADERS: ['RoleID', 'PermissionID'],
  DEPARTMENT_HEADERS: ['DepartmentID', 'DepartmentName', 'DepartmentHeadUserID', 'IsActive'],
  TNA_HEADERS: [
    'TNAID', 'TNAReference', 'EmployeeID', 'ManagerUserID', 'HODUserID',
    'AssessmentPeriod', 'CurrentStatus', 'CurrentVersion', 'AssessmentData',
    'CreatedAt', 'CreatedBy', 'UpdatedAt', 'UpdatedBy', 'SubmittedAt',
    'EmployeeAcknowledgedAt', 'HODApprovedAt'
  ],
  TNA_ANSWER_HEADERS: ['AnswerID', 'TNAID', 'VersionNumber', 'FieldID', 'FieldValue', 'UpdatedAt', 'UpdatedBy'],
  TNA_VERSION_HEADERS: ['VersionID', 'TNAID', 'VersionNumber', 'AssessmentSnapshot', 'CreatedBy', 'CreatedAt', 'ChangeReason'],
  WORKFLOW_HEADERS: ['WorkflowID', 'TNAID', 'VersionNumber', 'PreviousStatus', 'NewStatus', 'Action', 'ActionBy', 'ActionAt', 'Comments'],
  NOTIFICATION_HEADERS: ['NotificationID', 'TNAID', 'RecipientEmail', 'NotificationType', 'CreatedAt', 'SentAt', 'Status', 'ErrorMessage', 'ReminderCount'],
  AUDIT_HEADERS: ['AuditID', 'UserID', 'Action', 'EntityType', 'EntityID', 'Timestamp', 'ChangeSummary', 'RequestID'],
  SETTINGS_HEADERS: ['SettingKey', 'SettingValue', 'Description', 'UpdatedBy', 'UpdatedAt'],
  WORKFLOW_STATUSES: {
    DRAFT: 'DRAFT',
    PENDING_EMPLOYEE_ACKNOWLEDGMENT: 'PENDING_EMPLOYEE_ACKNOWLEDGMENT',
    RETURNED_TO_MANAGER: 'RETURNED_TO_MANAGER',
    PENDING_HOD_APPROVAL: 'PENDING_HOD_APPROVAL',
    APPROVED: 'APPROVED',
    CANCELLED: 'CANCELLED'
  }
};
