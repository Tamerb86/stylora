# Backend i18n Implementation Summary

## Overview
This implementation adds internationalization (i18n) support for backend-originated messages, ensuring all user-facing error messages, success messages, and hints can be translated to the user's preferred language (Norwegian, English, Arabic, Ukrainian).

## Key Changes

### 1. Type Definitions (shared/types.ts)
Added new interfaces for i18n-ready API responses:
- `ApiErrorResponse`: Standard error response with messageKey and hintKey
- `ApiSuccessResponse<T>`: Standard success response with messageKey

### 2. Translation Keys Added
Added 20+ new error keys and 5 hint keys to all 4 locale files:

**Error Keys** (in errors.* namespace):
- `noTenantAccess`, `tenantNotFound`, `emailNotVerified`
- `accessDenied`, `invalidCredentials`, `accountDeactivated`
- `tenantSuspended`, `tenantCanceled`
- `databaseError`, `databaseUnavailable`
- `authenticationFailed`, `missingCredentials`
- `invalidEmailFormat`, `accountConfigError`
- `couldNotFetchAccount`
- `refreshTokenMissing`, `invalidRefreshToken`
- `tokenRefreshFailed`, `logoutFailed`, `notAuthenticated`

**Hint Keys** (in hints.* namespace):
- `checkEmailAndPassword`
- `contactSupport`
- `tryAgainLater`
- `databaseConnectionIssue`
- `reactivateSubscription`

### 3. Backend Updates

#### Auth Endpoints (server/_core/auth-simple.ts)
Updated all error responses in the login endpoint to include `messageKey`:
```typescript
res.status(401).json({
  error: "Ugyldig e-post eller passord",
  messageKey: "errors.invalidCredentials",
  hint: "Sjekk e-post og passord og prøv igjen.",
  hintKey: "hints.checkEmailAndPassword"
});
```

#### Refresh Token Endpoint (server/_core/auth-refresh-endpoint.ts)
Updated all error responses to include `messageKey`

#### TRPC Middleware (server/routers.ts)
Updated TRPCError throws to include messageKey in data field:
```typescript
throw new TRPCError({
  code: "FORBIDDEN",
  message: "No tenant access",
  data: { messageKey: "errors.noTenantAccess" }
});
```

### 4. Frontend Utilities

#### i18nApi Utility (client/src/utils/i18nApi.ts)
Created utility functions for handling i18n API responses:
- `getErrorMessage(error, t?, fallbackKey)`: Extracts error message, preferring messageKey
- `showErrorToast(error, t?, fallbackKey)`: Shows error toast with i18n support
- `showSuccessToast(response, t?, fallbackKey)`: Shows success toast with i18n support
- `getHintMessage(response, t?)`: Extracts hint message

#### Login Page Update (client/src/pages/Login.tsx)
Updated to use messageKey when available:
```typescript
const errorMessage = data?.messageKey 
  ? t(data.messageKey) 
  : (data?.error || t("auth.errors.loginFailed"));
```

### 5. Testing
Created comprehensive test suite (server/i18n-messagekey.test.ts):
- Verifies error response structure includes messageKey
- Verifies TRPC errors can include messageKey in data
- Verifies all required keys exist in all 4 locale files
- All 6 tests passing ✅

## Implementation Pattern

### Backend (Express endpoints):
```typescript
res.status(400).json({
  error: "Fallback message in Norwegian",
  messageKey: "errors.keyName",
  hint: "Fallback hint",
  hintKey: "hints.keyName"
});
```

### Backend (TRPC procedures):
```typescript
throw new TRPCError({
  code: "FORBIDDEN",
  message: "Fallback message",
  data: { messageKey: "errors.keyName" }
});
```

### Frontend (component):
```typescript
import { useTranslation } from "react-i18next";
import { showErrorToast } from "@/utils/i18nApi";

const { t } = useTranslation();

// In mutation onError:
onError: (error) => {
  showErrorToast(error, t);
}

// Or manually:
const message = data?.messageKey ? t(data.messageKey) : data?.error;
```

## Endpoints Updated

### Express Endpoints:
1. `/api/auth/login` - All error cases
2. `/api/auth/refresh` - All error cases
3. `/api/auth/logout-all` - All error cases

### TRPC Middleware:
1. `tenantProcedure` - No tenant access, tenant not found, email not verified
2. `wizardProcedure` - No tenant access
3. `adminProcedure` - Access denied

## Backward Compatibility
All responses include both:
- **messageKey**: For i18n-aware clients
- **error/message**: Fallback for legacy code

The frontend gracefully falls back to raw messages if messageKey is not present.

## RTL Support
All translations include Arabic (ar) with proper RTL text. The UI automatically adjusts layout direction based on language selection.

## Next Steps (Optional Improvements)
1. Update more TRPC procedures to include messageKey
2. Update other Express endpoints (e.g., file upload, webhooks)
3. Add messageKey to success responses throughout the app
4. Create a migration guide for other developers
5. Add automated checks to ensure all backend messages include messageKey

## Translation Files Location
- English: `client/src/i18n/locales/en.json`
- Norwegian: `client/src/i18n/locales/no.json`
- Arabic: `client/src/i18n/locales/ar.json`
- Ukrainian: `client/src/i18n/locales/uk.json`

## Testing
Run tests:
```bash
npm test -- server/i18n-messagekey.test.ts
```

Build project:
```bash
pnpm build
```

## Security Considerations
- Error messages remain generic to prevent user enumeration attacks
- HTTP status codes unchanged
- Sensitive information not exposed in messages
- All messageKeys use safe, descriptive identifiers
