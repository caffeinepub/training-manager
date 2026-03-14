# Training Manager

## Current State
The app has a sign-off form with checkboxes, initials, and signatures. Completions are stored in the backend and visible in Admin > Completions and on user profiles (Assigned/Completed sections). PDF export logic may exist in SignOffForm but is not accessible from Admin > Completions or the user profile's Completed section.

## Requested Changes (Diff)

### Add
- Download PDF button in Admin > Completions next to each completion record
- Download PDF button in the user profile's Completed section next to each completed module
- PDF generation utility that reconstructs the sign-off form layout from stored completion data (training type checkboxes, release process steps, initials, team member signature, manager signature, module name, user name, date)

### Modify
- Admin > Completions tab: add a download icon button per row
- UserProfile component Completed section: add a download icon button per completed module

### Remove
- Nothing removed

## Implementation Plan
1. Create a `generateCompletionPDF` utility function that accepts a completion record and generates a PDF using jsPDF (or html2canvas + jsPDF), matching the sign-off form layout
2. Add a download button in Admin > Completions for each completion row
3. Add a download button in the UserProfile Completed section for each completed module
4. Wire both buttons to the PDF generation utility
