# TNA Web App Foundation

This repository contains a Google Apps Script Training Needs Analysis application.

## Included files

- `Code.gs` – web app entry point and Apps Script routes
- `Config.gs` – global configuration, default roles, permissions, and status definitions
- `Utils.gs` – shared utility helpers
- `DatabaseService.gs` – spreadsheet access and sheet enforcement logic
- `Setup.gs` – initialization and default data seeding
- `RoleService.gs` – role and permission management utility functions
- `AuthService.gs` – user authentication and permission checks
- `UserService.gs` – user creation and management
- `Index.html` – application shell
- `Styles.html` – design system and base styling
- `JavaScript.html` – front-end initialization logic

## How to set it up in Apps Script

1. Create or open the Google Apps Script project.
2. Add the `.gs` and `.html` files from this repository to the project.
3. Configure `TNA_SPREADSHEET_ID`, `TNA_ADMIN_USERNAME`, and `TNA_ADMIN_PASSWORD` under **Project Settings > Script Properties**. See [DeploymentGuide.md](DeploymentGuide.md).
4. Ensure the script's Google account has Editor access to the configured spreadsheet.
5. Run `setupSystem()` once and authorize the requested access.
6. Deploy the project as a Web App with appropriate access restrictions.

## Important deployment guidance

- Use Google Workspace-only access for production.
- Only authorized administrators should create users.
- Treat `Session.getActiveUser()` as a user-identity hint, not as full authorization.
- Enforce permissions in the backend for every protected action.

## Next phases

The next development steps are:

1. Build the full TNA assessment form and workflow logic
2. Add manager assessment submission and version tracking
3. Add employee acknowledgment and HOD approval flows
4. Add notification templates and reminder logic
5. Add audit logs, dashboard reports, and export features
