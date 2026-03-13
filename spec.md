# Training Manager

## Current State
Public module links bypass Google login correctly. The sign-off form submits via `actor.submitCompletion(moduleId, userName, initials, signatureData)`. Two bugs exist:
1. `signatureData` is submitted as a plain text string; the admin panel renders it as `<img src>` causing a broken image.
2. Training type, release steps, and acknowledgement initials filled in on the public form are never sent to the backend.

## Requested Changes (Diff)

### Add
- A `textToSignatureImage(text)` utility that renders text to a canvas and returns a base64 PNG, used to convert typed signature to an image.

### Modify
- `PublicModuleView`: Convert typed signature to a canvas image via `textToSignatureImage` before calling `actor.submitCompletion()`.
- `AdminPanel` completions table: Check if `signatureData` starts with `data:` before rendering as `<img>`; otherwise show as italic styled text.

### Remove
- Nothing.

## Implementation Plan
1. Add `textToSignatureImage` helper in `src/frontend/src/utils/signatureUtils.ts`.
2. Update `PublicModuleView.handleSubmit` to call the helper and pass the base64 result as signatureData.
3. Update the AdminPanel completions table signature cell to gracefully handle both image and text signatures.
