# Training Manager

## Current State
All mutations do optimistic local state updates only. The backend fetch runs once when actor first loads. UI data can drift from backend.

## Requested Changes (Diff)

### Add
- refreshAll() re-fetches all backend data after every mutation.

### Modify
- Every mutation calls refreshAll() after write succeeds.

### Remove
- Per-mutation manual setState calls replaced by refreshAll.

## Implementation Plan
1. Extract fetch logic into refreshAll useCallback.
2. Call refreshAll after every mutation.
3. Keep owner-email admin guarantee inside refreshAll.
