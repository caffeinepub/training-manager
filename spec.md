# Training Manager

## Current State
The app has a Google login gate. When a user registers with Google, they are immediately given `permission = "viewer"` and can access the app. Admins can promote users to admin from the Permissions tab. There is no approval workflow. All logged-in users see the full sidebar (Training Modules, Dashboard, Admin).

## Requested Changes (Diff)

### Add
- **Pending approval state**: New users who register via Google get `permission = "pending"` instead of "viewer".
- **Waiting screen**: If logged-in user has `permission = "pending"`, show a holding page explaining their account is awaiting admin approval.
- **Rejected screen**: If `permission = "rejected"`, show a screen explaining access was denied with a sign-out option.
- **Viewer (trainee) restricted view**: Approved users with `permission = "viewer"` see only their assigned Training Modules (no Dashboard, no Admin nav items). They can complete training via public module links.
- **Admin approval tab in Admin panel**: A new "Pending Approvals" tab listing all users with `permission = "pending"`. Each row has: Approve (as Viewer), Approve as Admin, Reject buttons.
- Backend `approveUser(userId, role)` method: sets permission to "viewer" or "admin".
- Backend `rejectUser(userId)` method: sets permission to "rejected".
- `approveUser` and `rejectUser` exposed in `useTrainingData` hook.

### Modify
- Backend `registerGoogleUser`: new users default to `permission = "pending"` instead of "viewer".
- `App.tsx`: After login resolves, check current user's permission. Route to waiting/rejected/viewer/admin screens accordingly. Viewer-only users see a simplified layout with only Training Modules tab and only their assigned modules.
- `AdminPanel.tsx`: Add "Pending Approvals" tab (shows badge count of pending users). Existing Permissions tab remains for managing approved users.
- `useTrainingData.ts`: Add `approveUser(userId, role)` and `rejectUser(userId)` methods. Expose `currentUserPermission` derived from the backend user record (not just session).

### Remove
- Nothing removed.

## Implementation Plan
1. Update `main.mo`: change `registerGoogleUser` default permission to "pending"; add `approveUser` and `rejectUser` functions.
2. Update `useTrainingData.ts`: add `approveUser`, `rejectUser` calls; derive `currentUserPermission` by looking up the current session's email in the users list.
3. Update `App.tsx`: add permission-based routing -- pending screen, rejected screen, viewer-only layout (no admin/dashboard nav), full admin layout.
4. Update `AdminPanel.tsx`: add Pending Approvals tab with approve/reject controls.
