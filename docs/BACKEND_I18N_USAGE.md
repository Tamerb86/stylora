# Backend i18n Usage Guide

This guide shows developers how to add i18n support to backend messages.

## Quick Start

### Backend: Returning Error Messages

#### Express Endpoints

```typescript
// BAD - Hardcoded message
res.status(400).json({ error: "E-post er påkrevd" });

// GOOD - With messageKey for i18n
res.status(400).json({ 
  error: "E-post er påkrevd",  // Fallback
  messageKey: "errors.emailRequired"  // Translation key
});

// WITH HINT
res.status(401).json({
  error: "Ugyldig e-post eller passord",
  messageKey: "errors.invalidCredentials",
  hint: "Sjekk e-post og passord og prøv igjen.",
  hintKey: "hints.checkEmailAndPassword"
});
```

#### TRPC Procedures

```typescript
// BAD - Hardcoded message
throw new TRPCError({ 
  code: "NOT_FOUND", 
  message: "Customer not found" 
});

// GOOD - With messageKey in data
throw new TRPCError({
  code: "NOT_FOUND",
  message: "Customer not found",  // Fallback
  data: { messageKey: "errors.customerNotFound" }
});
```

### Frontend: Handling Responses

#### Method 1: Using the i18nApi Utility (Recommended)

```typescript
import { useTranslation } from "react-i18next";
import { showErrorToast, showSuccessToast } from "@/utils/i18nApi";
import { trpc } from "@/lib/trpc";

function MyComponent() {
  const { t } = useTranslation();

  const createMutation = trpc.customers.create.useMutation({
    onSuccess: (data) => {
      showSuccessToast(data, t, "toasts.success.customerCreated");
    },
    onError: (error) => {
      showErrorToast(error, t);
    }
  });

  return <button onClick={() => createMutation.mutate(data)}>Create</button>;
}
```

#### Method 2: Manual Translation

```typescript
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

function LoginForm() {
  const { t } = useTranslation();

  const handleSubmit = async () => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Prefer messageKey, fallback to raw message
      const message = data?.messageKey 
        ? t(data.messageKey) 
        : data?.error || t("errors.generic");
      
      const hint = data?.hintKey 
        ? t(data.hintKey) 
        : data?.hint || "";

      setError(message);
      setErrorHint(hint);
      return;
    }
  };
}
```

## Adding New Translation Keys

### Step 1: Add to All Locale Files

Add your key to all 4 locale files:
- `client/src/i18n/locales/no.json` (Norwegian - source of truth)
- `client/src/i18n/locales/en.json` (English)
- `client/src/i18n/locales/ar.json` (Arabic - RTL)
- `client/src/i18n/locales/uk.json` (Ukrainian)

**Example**: Adding a "customer not found" error

In `en.json`:
```json
{
  "errors": {
    "customerNotFound": "Customer not found"
  }
}
```

In `no.json`:
```json
{
  "errors": {
    "customerNotFound": "Kunde ikke funnet"
  }
}
```

In `ar.json`:
```json
{
  "errors": {
    "customerNotFound": "العميل غير موجود"
  }
}
```

In `uk.json`:
```json
{
  "errors": {
    "customerNotFound": "Клієнт не знайдений"
  }
}
```

### Step 2: Use in Backend

```typescript
// Express endpoint
if (!customer) {
  return res.status(404).json({
    error: "Kunde ikke funnet",
    messageKey: "errors.customerNotFound"
  });
}

// TRPC procedure
if (!customer) {
  throw new TRPCError({
    code: "NOT_FOUND",
    message: "Customer not found",
    data: { messageKey: "errors.customerNotFound" }
  });
}
```

### Step 3: Update Test

Add your new key to the test file `server/i18n-messagekey.test.ts`:

```typescript
const requiredErrorKeys = [
  // ... existing keys
  "customerNotFound",  // Add your new key
];
```

## Namespace Organization

Organize keys by feature area:

### Common Namespaces

- `errors.*` - Error messages
  - `errors.generic` - Generic error
  - `errors.notFound` - Resource not found
  - `errors.unauthorized` - Not authorized
  - `errors.forbidden` - Access denied
  - `errors.validationError` - Validation failed

- `hints.*` - Helpful hints for errors
  - `hints.contactSupport` - "Contact support"
  - `hints.tryAgainLater` - "Try again later"

- `toasts.success.*` - Success messages
  - `toasts.success.created` - "{item} created!"
  - `toasts.success.updated` - "{item} updated!"
  - `toasts.success.deleted` - "{item} deleted!"

- `toasts.error.*` - Error toasts
  - `toasts.error.generic` - "Error: {message}"
  - `toasts.error.createFailed` - "Could not create {item}"

## Variable Interpolation

Use `{variable}` syntax for dynamic content:

**Translation file**:
```json
{
  "errors": {
    "tooManyItems": "Cannot add more than {max} items"
  }
}
```

**Backend**:
```typescript
// Store max in data for frontend to interpolate
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Cannot add more than 10 items",
  data: { 
    messageKey: "errors.tooManyItems",
    params: { max: 10 }
  }
});
```

**Frontend**:
```typescript
const message = error.data?.messageKey
  ? t(error.data.messageKey, error.data.params)
  : error.message;
```

## Testing

Always test your translations in all 4 languages:

1. Run the test suite:
   ```bash
   npm test -- server/i18n-messagekey.test.ts
   ```

2. Test manually in the UI:
   - Switch to each language using the language switcher
   - Trigger the error/success condition
   - Verify the message displays correctly
   - For Arabic, verify RTL layout works

## Best Practices

### DO ✅

- Always include both messageKey and fallback message
- Use semantic key names (e.g., `invalidCredentials`, not `error1`)
- Keep messages concise for UI space constraints
- Test in all 4 languages before committing
- Add hints for complex errors
- Use consistent HTTP status codes

### DON'T ❌

- Don't expose sensitive information in error messages
- Don't use language-specific characters in keys
- Don't change message without updating translations
- Don't skip backward compatibility (always include fallback)
- Don't reveal system internals in user-facing messages

## Common Patterns

### Authentication Errors

```typescript
// Invalid credentials
res.status(401).json({
  error: "Ugyldig e-post eller passord",
  messageKey: "errors.invalidCredentials",
  hint: "Sjekk e-post og passord og prøv igjen.",
  hintKey: "hints.checkEmailAndPassword"
});

// Account deactivated
res.status(403).json({
  error: "Kontoen er deaktivert",
  messageKey: "errors.accountDeactivated",
  hint: "Kontakt support for å aktivere kontoen.",
  hintKey: "hints.contactSupport"
});
```

### Validation Errors

```typescript
// Missing required field
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Email is required",
  data: { messageKey: "errors.requiredField" }
});

// Invalid format
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Invalid email format",
  data: { messageKey: "errors.invalidEmail" }
});
```

### Permission Errors

```typescript
// No access to resource
throw new TRPCError({
  code: "FORBIDDEN",
  message: "Access denied",
  data: { messageKey: "errors.accessDenied" }
});

// Admin only
throw new TRPCError({
  code: "FORBIDDEN",
  message: "Admin access required",
  data: { messageKey: "errors.adminRequired" }
});
```

## Utilities Reference

### `getErrorMessage(error, t?, fallbackKey?)`
Extracts error message from response, preferring messageKey.

### `showErrorToast(error, t?, fallbackKey?)`
Shows error toast with translation.

### `showSuccessToast(response, t?, fallbackKey?)`
Shows success toast with translation.

### `getHintMessage(response, t?)`
Extracts hint message from response.

## Example Component

See `client/src/pages/Login.tsx` for a complete example of handling i18n error messages.

## Questions?

Check:
- `BACKEND_I18N_SUMMARY.md` - Implementation overview
- `server/i18n-messagekey.test.ts` - Test examples
- `client/src/utils/i18nApi.ts` - Utility functions
