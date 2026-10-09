# Deployment and Maintenance Guide

## 1. Recommended deployment model

Use a Google Workspace-only deployment for production:

- Deploy the Apps Script as a Web App.
- Restrict access to users inside the organization.
- Maintain admin-only creation of user accounts.
- Use Google accounts as the identity source.
- Never rely on browser-provided email values or role values as security proof.

## 2. Setup steps

1. Open Google Apps Script.
2. Create a new project.
3. Upload the `.gs` and `.html` files from this workspace.
4. In **Project Settings > Script Properties**, add:
	- `TNA_SPREADSHEET_ID`: the ID from your Google Sheets URL. The script's Google account must have Editor access to that spreadsheet.
	- `TNA_ADMIN_USERNAME`: the administrator email address.
	- `TNA_ADMIN_PASSWORD`: a strong, unique administrator password.
5. Run `setupSystem()` once and authorize the requested Google Sheets access.
6. Confirm the expected sheets were added to the configured spreadsheet.
7. Deploy as a Web App and restrict access to the intended Google Workspace users.
8. Verify login and spreadsheet access using the deployed application.

Do not put spreadsheet IDs or administrator credentials in source files or commit them to Git. The app deliberately fails with a configuration error instead of creating a new spreadsheet when `TNA_SPREADSHEET_ID` is missing.

## 3. Security notes

- Only the system admin may create or edit users.
- Every backend function must validate permission and workflow state.
- Use the `requirePermission()` and `requireAuthenticatedUser()` guards.
- Never trust a browser field as a proof of identity.
- Use audit logs for all sensitive actions.

## 4. Operational guidance

- Back up the spreadsheet periodically.
- Store runtime identifiers and credentials in Apps Script Script Properties, never in the Git repository.
- Monitor notification logs and failed emails.
- Review inactive account statuses.
- Keep role and permission assignments audited.
- Add extra validation tables for department assignment and assessment field definitions as needed.

## 5. Known limitations

- Google Sheets is not a relational database and is not suitable for heavy multi-user transactional workloads.
- Apps Script execution time and quotas must be respected.
- Large-scale data processing may require migration to Cloud SQL or another managed DB.
- Email limits and quotas can impact large reminder bursts.

## 6. Future enhancements

- advanced department approval matrix
- workflow notification escalation rules
- richer report export filters
- custom TNA competency templates per department
- manager-only dashboards and operational analytics
