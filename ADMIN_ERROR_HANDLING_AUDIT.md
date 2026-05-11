# Admin Codebase Error Handling Audit Report

**Date:** May 12, 2026  
**Scope:** `apps/admin/src` - All API error handling and user feedback mechanisms

---

## Executive Summary

The admin codebase has **inconsistent error handling** across API calls. While some pages implement basic error states, most have **significant gaps**:

- ❌ **No centralized error handler** - Each page implements its own logic
- ❌ **No console logging** - Debugging API failures is difficult
- ❌ **No toast notification system** - Errors displayed as inline text only
- ❌ **Generic error messages** - "Failed to add category" doesn't help users understand what went wrong
- ❌ **Silent failures** - Multiple catch blocks with `/* ignore */` comments
- ⚠️ **Inconsistent error extraction** - Some pages check `err.response.data`, others don't

---

## Current Error Handling Patterns

### 1. **Generic Catch with Inline Error State** (❌ Most Common)
**Found in:** LoginPage, MenuPage (many operations), OrdersPage, DashboardPage

```typescript
try {
  await api.post('/admin/categories', { name: newCatName.trim() });
  setNewCatName('');
  await loadData();
} catch { 
  setError('Failed to add category.'); // ❌ Generic, no logging
}
```

**Issues:**
- No console logging for debugging
- Generic error message doesn't tell user WHY it failed
- Error object is discarded

---

### 2. **Silent Failures** (❌ Most Dangerous)
**Found in:** OrdersPage (2 places), DashboardPage

```typescript
try {
  await api.patch(`/admin/orders/${orderId}/status`, { status });
} catch { 
  /* ignore */ // ❌ Silently fails - user doesn't know it didn't work
}
```

**Issues:**
- User has no feedback that operation failed
- No error visibility to admins
- Impossible to debug

---

### 3. **Better: Error Code Mapping** (⚠️ Good but incomplete)
**Found in:** RegisterPage, TablesPage (one case)

```typescript
catch (err: unknown) {
  const code = e.response?.data?.error;
  const errorMessages: Record<string, string> = {
    SLUG_TAKEN: 'That menu URL is already taken...',
    EMAIL_TAKEN: 'An account with that email already exists...',
  };
  setError(errorMessages[code ?? ''] ?? serverMessage ?? 'Registration failed.');
}
```

**Status:** ✓ Good pattern but:
- No console logging
- Not used consistently across app
- Requires error codes from backend

---

### 4. **Best: Error Details Extraction** (⚠️ Closest to best practice)
**Found in:** SettingsPage

```typescript
catch (err: unknown) {
  const details = e.response?.data?.details;
  setError(details ? details.map((d) => d.msg).join(', ') : 'Failed to save settings.');
}
```

**Status:** ✓ Better, but:
- Still no console logging
- Only works if backend sends `details` array
- Relies on specific error response format

---

### 5. **SSE Error Handling** (❌ Silent)
**Found in:** useOrderStream hook

```typescript
es.onerror = () => { 
  es.close(); // ❌ Silently closes connection
};
```

**Issues:**
- No notification to user that live updates stopped
- No console logging
- No retry mechanism

---

## API Call Inventory

| File | Operation | Error Handling | Status |
|------|-----------|---|---|
| **LoginPage** | POST /auth/login | Generic catch | ❌ |
| **RegisterPage** | POST /auth/register | Error code mapping | ⚠️ |
| **MenuPage** | GET /admin/categories | No error handling | ❌ |
| **MenuPage** | GET /admin/items | No error handling | ❌ |
| **MenuPage** | POST /admin/categories | Generic catch | ❌ |
| **MenuPage** | DELETE /admin/categories | Generic catch | ❌ |
| **MenuPage** | PATCH /admin/categories/archive | Generic catch | ❌ |
| **MenuPage** | POST /admin/categories/prepopulate | Generic catch | ❌ |
| **MenuPage** | POST /admin/items | Generic catch | ❌ |
| **MenuPage** | PATCH /admin/items | Generic catch | ❌ |
| **MenuPage** | DELETE /admin/items | Generic catch | ❌ |
| **OrdersPage** | GET /admin/orders | No error handling | ❌ |
| **OrdersPage** | PATCH /admin/orders/{id}/status | Silent failure | ❌ |
| **OrdersPage** | SSE /admin/orders/stream | Silent failure | ❌ |
| **TablesPage** | GET /admin/tables | No error handling | ❌ |
| **TablesPage** | POST /admin/tables | Error code check | ⚠️ |
| **TablesPage** | DELETE /admin/tables | Generic catch | ❌ |
| **TablesPage** | GET /admin/tables/{id}/qr | No error handling | ❌ |
| **SettingsPage** | GET /admin/restaurant | Generic catch | ❌ |
| **SettingsPage** | PUT /admin/restaurant | Details extraction | ⚠️ |
| **DashboardPage** | GET /admin/orders | Silent failure | ❌ |

**Summary:**
- ❌ **9** with generic/silent/no error handling
- ⚠️ **4** with partial error handling
- ✓ **0** with comprehensive error handling

---

## Current UI Feedback Mechanisms

### Error Display
- Inline `<p>` tags with red text
- No toast notification library (react-hot-toast, react-toastify, etc. not installed)
- Must add errors to local state on every page

### Success Feedback
- SettingsPage: Inline green text message that auto-clears after 3 seconds
- Other pages: No success feedback

### Loading States
- Local boolean flags (`loading`, `saving`, `adding`)
- Button disabled states during async operations
- Some skeleton loading animations

---

## Required Improvements

### 1. **Create Toast Notification System**
No toast library currently installed. Options:
- **react-hot-toast** (lightweight, ~3KB)
- **sonner** (modern, ~5KB)
- Custom implementation (minimal, no dependencies)

### 2. **Implement Centralized Error Handler Utility**
```typescript
// utils/errorHandler.ts
export const handleApiError = (
  error: unknown,
  options: {
    userMessage?: string;
    showToast?: boolean;
    logToConsole?: boolean;
  }
) => {
  // Extract error details
  // Log to console with context
  // Show user-friendly toast
}
```

### 3. **Update All API Calls**
- Add proper error catching with logging
- Show user-friendly toast messages
- Log detailed errors to console

### 4. **Add Console Logging Pattern**
```typescript
console.error('[MenuPage] Failed to add category:', {
  statusCode: err.response?.status,
  message: err.response?.data?.error,
  details: err.response?.data?.details,
  timestamp: new Date().toISOString(),
});
```

---

## Detailed Findings by Page

### ✅ **Best: SettingsPage**
- Extracts error details from server response
- Shows error inline
- Success feedback (3-sec auto-close)
- Still needs: console logging

### ⚠️ **OK: TablesPage**
- One good error code check (TABLE_EXISTS)
- Others are generic
- Missing: console logging, consistent patterns

### ❌ **Poor: MenuPage**
- 8+ operations with generic error messages
- No console logging
- Some loadData calls with no error handling
- Error messages like "Failed to add category" unhelpful

### ❌ **Poor: OrdersPage**
- Multiple silent failures (`/* ignore */` comments)
- No error feedback to user
- Can't tell if status update worked
- SSE connection failure is silent

### ❌ **Worst: DashboardPage**
- Silent failure: `.catch(() => {})`
- No user feedback
- Pending orders count won't show if API fails

### ❌ **Poor: LoginPage**
- Generic error message
- No console logging
- No attempt to extract backend error details

### ⚠️ **OK: RegisterPage**
- Error code mapping for known errors
- Better than most
- Still needs: console logging, fallback error extraction

---

## Recommendations by Priority

### Priority 1 (Critical)
1. **Fix silent failures** - Add error feedback for all catch blocks
2. **Add console logging** - Every API error should log details
3. **Implement toast system** - Users need clear feedback

### Priority 2 (High)
4. **Create error handler utility** - Centralize error logic
5. **Extract server error details** - Don't show generic messages
6. **Add validation error mapping** - Show field-specific errors

### Priority 3 (Medium)
7. **Add retry mechanism** - For transient failures
8. **SSE reconnection** - Auto-reconnect on connection loss
9. **Error boundaries** - Catch React errors

### Priority 4 (Low)
10. **Error tracking** - Send errors to monitoring service
11. **User error analytics** - Track common failures
12. **Error documentation** - Frontend error code reference

---

## Files Needing Updates

All files in `apps/admin/src/pages/`:
- [ ] LoginPage.tsx
- [ ] RegisterPage.tsx
- [ ] MenuPage.tsx
- [ ] OrdersPage.tsx
- [ ] TablesPage.tsx
- [ ] SettingsPage.tsx
- [ ] DashboardPage.tsx

Additional files:
- [ ] hooks/useOrderStream.ts
- [ ] api/index.ts (add error interceptor)
- [ ] Create: utils/errorHandler.ts
- [ ] Create: utils/toast.ts (or install library)

---

## Implementation Plan

1. **Phase 1:** Create error handling utilities (2-3 files)
2. **Phase 2:** Install toast library (if external)
3. **Phase 3:** Update each page component (7 files)
4. **Phase 4:** Test all error scenarios
5. **Phase 5:** Add monitoring/logging (optional)

---

## Notes for Implementation

- Keep backward compatible with existing error state handling
- Don't break SettingsPage's 3-sec success notification
- Maintain existing loading states and button disabling
- Consider adding error retry buttons for network errors
- Log includes: timestamp, file, operation, status code, error message, stack trace
