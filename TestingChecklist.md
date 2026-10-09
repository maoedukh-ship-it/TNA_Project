# Testing Checklist and Acceptance Criteria

## User management
- Public registration is blocked.
- Only the administrator can create users.
- User status changes are logged.
- Inactive users cannot access protected functions.

## Manager assessment workflow
- Draft can be created and saved.
- Save & Add New resets the form after a successful save.
- Preview and submit actions validate required data.
- Duplicate submissions are prevented.

## Employee acknowledgment workflow
- Employee receives notification and can acknowledge.
- A return-for-revision workflow requires comments.
- Acknowledgment is linked to the correct version.

## HOD approval
- HOD approval requires a current acknowledged version.
- HOD return requires mandatory comments.
- Approved versions are protected from unauthorized modifications.

## Administration
- Admin can review all workflow stages.
- Reminder emails can be sent without changing status.
- Failures are logged.

## Security
- Protected functions validate permission and workflow state.
- Direct status manipulation is blocked.
- Unauthorized report access is denied.

## Performance and reliability
- Email failures do not corrupt status.
- Workflow transitions are validated before write.
- Batch operations remain lightweight.
