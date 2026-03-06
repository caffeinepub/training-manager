# Training Manager

## Current State
The app has a ModuleViewer component that displays a training module with an embedded Google Doc and a sign-off section. When completed, it shows the user's name, initials, completion date, and a signature image. Completion data (userName, initials, signatureData, completedAt) is stored in localStorage via the `useTrainingData` hook.

## Requested Changes (Diff)

### Add
- A "Download PDF" button that appears in the completed state of ModuleViewer (after sign-off is complete)
- A `usePdfExport` hook or utility function that uses the `jspdf` and `html2canvas` libraries to generate a PDF
- The PDF should include:
  - Module title and description
  - A "Completion Sign-Off" section with the user's name, initials, date completed
  - The signature image (from base64 signatureData)
  - A "Training Completed" watermark/stamp style header
  - Company/platform branding (Training Manager)

### Modify
- `ModuleViewer.tsx`: Add a "Download PDF" button in the completed state section, below the signature preview
- `package.json` / frontend dependencies: Add `jspdf` and `html2canvas`

### Remove
- Nothing

## Implementation Plan
1. Install `jspdf` and `html2canvas` packages in the frontend
2. Create a `usePdfExport.ts` utility/hook that accepts module + completion data and generates a formatted PDF certificate-style document
3. In `ModuleViewer.tsx`, import and wire the PDF export utility, add a "Download PDF" button (with Download icon) in the completed state, below the existing signature preview block
4. The button should trigger PDF generation and auto-download the file named `<module-title>-completion.pdf`
