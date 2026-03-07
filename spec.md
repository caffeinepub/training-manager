# Training Manager

## Current State
- Training modules are stored in localStorage and displayed in a grid.
- Users (trainees) can be created, assigned modules, and the admin can complete a training on behalf of a user by selecting them from the "View as trainee" dropdown.
- Module viewing and sign-off is done in-app only -- there is no way to share a direct link to a specific training for a specific user.
- All data is ephemeral per-browser (localStorage).

## Requested Changes (Diff)

### Add
- **Shareable training link generation**: Each assigned module on the user profile or the trainee view generates a unique URL containing `?moduleId=<id>&userId=<id>`.
- **Share button on ModuleCard**: When a user is selected in "View as trainee" mode, each ModuleCard gets a "Copy Link" button that copies the direct URL to clipboard.
- **Share buttons in UserProfileModal**: Each assigned module row shows a "Copy Link" icon button to copy the direct sign-off link for that user+module combo.
- **Deep-link handling in App.tsx**: On mount, read `moduleId` and `userId` from URL search params. If both are present and valid, auto-select the user and open the module viewer directly (bypassing the home screen).
- **Landing state for shared links**: When arriving via a shared link, display a clear "Signing as [Name]" context banner so the receiving manager knows whose training they are completing.
- **Toast confirmation** when a link is copied.

### Modify
- `App.tsx`: Add `useEffect` to parse URL params on mount and set `selectedUserId` + `selectedModule` accordingly. Also clear URL params after loading so the URL stays clean.
- `ModuleCard.tsx`: Accept optional `shareUrl` prop; if provided, show a "Copy Link" icon button that does not trigger `onView`.
- `UserProfileModal.tsx`: Add a share/copy-link icon button next to each assigned module row.

### Remove
- Nothing removed.

## Implementation Plan
1. In `App.tsx`, on mount parse `window.location.search` for `moduleId` and `userId`. If both match valid data, call `setSelectedUserId` and `setSelectedModule` to jump directly to the sign-off view. Clear the params from the URL via `history.replaceState`.
2. Add a `buildShareUrl(moduleId, userId)` utility in `utils/shareLinks.ts` that constructs `window.location.origin + window.location.pathname + ?moduleId=...&userId=...`.
3. Modify `ModuleCard` to accept an optional `onCopyLink?: () => void` prop. When provided, render a small "Copy Link" button that calls `onCopyLink` and shows a toast.
4. In `App.tsx` modules list, when `selectedUserId` is set, pass `onCopyLink` to each `ModuleCard` that copies the share URL.
5. In `UserProfileModal.tsx`, add a copy-link icon button per module row (only for modules that are checked/assigned). Clicking it calls `navigator.clipboard.writeText(buildShareUrl(module.id, userId))` and shows a toast.
6. Ensure the `ModuleViewer` "Signing as" banner already works (it does from a previous version) -- no changes needed there.
