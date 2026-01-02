# Security and Best Practices Improvements

This document describes the security enhancements made to the Stylora application.

## Changes Made

### 1. Trust Proxy Configuration
**Location:** `server/_core/index.ts`

The trust proxy setting now uses environment variables for better configuration control:

```typescript
app.set('trust proxy', process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : 1);
```

**Environment Variable:**
- `TRUST_PROXY` - Set to the number of proxy hops or use `loopback` for enhanced security (default: 1)

### 2. Stripe Webhook Security
**Location:** `server/_core/index.ts`, `server/stripe-webhook.ts`

- Simplified webhook handler to use raw body directly without intermediate processing
- Ensures signature verification works correctly with untampered body

### 3. Rate Limiting Improvements
**Location:** `server/_core/index.ts`

- Updated rate limit skip logic to use precise path matching instead of broad pattern matching
- Added specific rate limiters for different endpoint types:
  - **General API:** 100 requests per 15 minutes
  - **Auth endpoints:** 20 requests per 15 minutes
  - **Public booking:** 20 requests per minute
  - **Webhooks/callbacks:** 100 requests per minute
  - **File uploads:** 30 requests per minute

```typescript
skip: (req) => {
  return req.path === "/api/stripe/webhook" || req.path === "/api/vipps/callback";
}
```

### 4. Content Security Policy (CSP)
**Location:** `server/_core/index.ts`

CSP is now enabled in production with appropriate directives for Stripe integration:

```typescript
const isDev = process.env.NODE_ENV === "development";

app.use(helmet({
  contentSecurityPolicy: isDev ? false : {
    useDefaults: true,
    directives: {
      "script-src": ["'self'", "https://js.stripe.com"],
      "frame-src": ["'self'", "https://js.stripe.com"],
      "connect-src": ["'self'"],
      "img-src": ["'self'", "data:", "https:"]
    }
  }
}));
```

### 5. Secure File Upload Endpoint
**Location:** `server/_core/index.ts`

Added comprehensive security to the `/api/storage/upload` endpoint:

- **Authentication:** Requires valid user session
- **Content Type Validation:** Only allows: JPEG, PNG, WEBP, PDF
- **Rate Limiting:** 30 uploads per minute
- **Body Validation:** Ensures non-empty buffer
- **Extension Mapping:** Proper file extension based on content type

### 6. Token Logging Removal
**Location:** `server/_core/index.ts`

Removed all sensitive token logging from iZettle OAuth callback:
- Removed access token length logging
- Removed access token preview logging
- Removed encrypted token preview logging

### 7. OAuth State Parameter Validation (CSRF Protection)
**Location:** `server/services/izettle.ts`, `server/_core/index.ts`

Implemented HMAC-signed state parameters for OAuth flows:

- State now includes HMAC signature: `{payload}.{signature}`
- Uses `crypto.timingSafeEqual()` for constant-time comparison
- Validates timestamp (rejects states older than 10 minutes)
- Prevents CSRF attacks on OAuth callbacks

```typescript
// Generate signed state
const payload = Buffer.from(JSON.stringify({ tenantId, timestamp })).toString("base64url");
const signature = generateStateSignature(payload);
const state = `${payload}.${signature}`;

// Verify state
const stateData = verifyAndDecodeState(state);
if (!stateData || !stateData.tenantId) {
  // Invalid or expired state
}
```

### 8. Unified Error Handler
**Location:** `server/_core/index.ts`

Added consistent error handling across all processes:

- Captures exceptions with Sentry (if configured)
- Logs errors to console
- Returns consistent error responses
- Works whether Sentry is configured or not

### 9. Scheduler Duplication Prevention
**Location:** `server/_core/index.ts`

Prevents duplicate scheduler jobs when running multiple instances:

```typescript
const instanceType = process.env.INSTANCE_TYPE;

if (!instanceType || instanceType === "worker") {
  // Start schedulers only on worker instances
  startNotificationScheduler();
  scheduleBackups();
  startAutoClockOutScheduler();
  startEmailScheduler();
}
```

**Environment Variable:**
- `INSTANCE_TYPE` - Set to `worker` for instances that should run schedulers, or `web` for web-only instances (default: runs schedulers)

### 10. Production Port Handling
**Location:** `server/_core/index.ts`

Improved port handling for production deployments:

```typescript
const port = process.env.NODE_ENV === "production"
  ? preferredPort  // Direct binding in production
  : await findAvailablePort(preferredPort);  // Scan in development
```

## Environment Variables

### Required for New Features

| Variable | Purpose | Example | Default |
|----------|---------|---------|---------|
| `TRUST_PROXY` | Number of proxy hops | `1`, `2`, or `loopback` | `1` |
| `INSTANCE_TYPE` | Control scheduler execution | `worker` or `web` | Runs schedulers |
| `NODE_ENV` | Environment mode | `production` or `development` | `development` |

### Existing Variables (No Changes Required)

All existing environment variables continue to work as before. No changes are required to:
- `JWT_SECRET` - Used for HMAC signatures
- `STRIPE_WEBHOOK_SECRET` - Webhook verification
- `SENTRY_DSN` - Error tracking
- Database and AWS credentials
- Other service API keys

## Security Benefits

1. **CSRF Protection:** OAuth flows are now protected against cross-site request forgery
2. **Rate Limiting:** Better protection against abuse with granular rate limits
3. **File Upload Security:** Authenticated uploads with content validation
4. **No Token Leakage:** Sensitive tokens are no longer logged
5. **Production CSP:** Content Security Policy enabled in production
6. **Unified Error Handling:** Consistent error responses and logging
7. **Scheduler Safety:** Prevents duplicate jobs in multi-instance deployments
8. **Better Proxy Support:** Configurable trust proxy for various deployment scenarios

## Migration Notes

### For Development
No changes required. All features work with sensible defaults.

### For Production Deployment

1. **Set NODE_ENV:**
   ```bash
   NODE_ENV=production
   ```

2. **Configure Instance Types (Optional):**
   - For web-only instances: `INSTANCE_TYPE=web`
   - For worker instances: `INSTANCE_TYPE=worker`
   - If not set, schedulers will run (backward compatible)

3. **Configure Trust Proxy (Optional):**
   - If behind 1 proxy (default): No change needed
   - If behind multiple proxies: Set `TRUST_PROXY=2` (or appropriate number)
   - For specific configurations: Set `TRUST_PROXY=loopback`

4. **Ensure JWT_SECRET is Set:**
   - Used for HMAC signatures in OAuth state
   - Should already be configured for existing auth

## Testing

All changes maintain backward compatibility. Existing functionality continues to work without configuration changes.

To test the new features:

1. **File Uploads:** Try uploading with invalid content types (should reject)
2. **OAuth Flows:** Test iZettle integration (state validation automatic)
3. **Rate Limits:** Monitor logs for rate limit messages
4. **Schedulers:** Check logs for scheduler start messages
5. **CSP:** Check browser console in production (no CSP errors)

## Rollback

If needed, rollback is safe as all changes are backward compatible. No database migrations or breaking changes were introduced.
