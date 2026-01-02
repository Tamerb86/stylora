# iZettle Reader Connect API Support Ticket

## Summary

**Issue**: Unable to pair PayPal Reader using Reader Connect API - receiving "Must be a valid code" error despite following documentation

**Priority**: High  
**Category**: Reader Connect API - Linking reader to account  
**Market**: Norway  
**Organization UUID**: `01JFGXNX3FWXQ6CQHBQHVP5YK0`

---

## Description

We are integrating Reader Connect API into our web-based POS system for Norwegian salons. We have successfully implemented OAuth authentication and can create Reader Links via the API, but we are unable to pair the physical PayPal Reader with the generated 8-digit code.

### What We're Trying to Achieve

- Integrate PayPal Reader with our web-based POS system
- Use Reader Connect API (REST + WebSocket) for cloud-based payment processing
- Target platform: Web (React/TypeScript)

### Current Implementation Status

✅ **Working**:

- OAuth 2.0 authentication (Authorization Code Grant)
- Access token retrieval and refresh
- Token encryption/decryption
- Reader Link creation via API (`POST /reader-connect/v1/reader-links`)
- 8-digit code generation and display
- WebSocket connection preparation

❌ **Not Working**:

- Physical reader pairing with 8-digit code
- Reader consistently shows: **"Must be a valid code"**

---

## Steps to Reproduce

### 1. OAuth Authentication

```typescript
// Successfully obtaining access token
const authUrl = `https://oauth.zettle.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=READ:PAYMENT&redirect_uri=${REDIRECT_URI}`;
// User authorizes → receive code → exchange for access token
```

**Result**: ✅ Access token obtained successfully

### 2. Create Reader Link

```typescript
const response = await fetch(
  "https://reader-connect.zettle.com/reader-connect/v1/reader-links",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      organizationUuid: "01JFGXNX3FWXQ6CQHBQHVP5YK0",
      label: "Stylora POS",
    }),
  }
);
```

**Result**: ✅ Success - Returns:

```json
{
  "linkId": "01JFQR5KXVZQPWG3KCFBXZM123",
  "code": "12345678",
  "organizationUuid": "01JFGXNX3FWXQ6CQHBQHVP5YK0",
  "label": "Stylora POS",
  "createdAt": "2024-12-22T...",
  "expiresAt": "2024-12-22T..."
}
```

### 3. Attempt to Pair Reader

**Steps on Physical Reader**:

1. Turn on PayPal Reader
2. Navigate to Settings → Integrations
3. Select "Connect to POS"
4. Enter 8-digit code: `12345678`
5. Press OK

**Result**: ❌ **"Must be a valid code"** error on reader

---

## What We've Tried

### Attempt 1: Different API Endpoints

- ✅ Tried: `https://reader-connect.zettle.com/reader-connect/v1/reader-links`
- ✅ Tried: `https://reader-connect.izettle.com/reader-connect/v1/reader-links`
- ❌ Result: Same error

### Attempt 2: Different Code Formats

- ✅ Tried: 8-digit code as returned by API
- ✅ Tried: Adding leading zeros
- ✅ Tried: Different code generation times
- ❌ Result: Same error

### Attempt 3: Different OAuth Scopes

- ✅ Tried: `READ:PAYMENT`
- ✅ Tried: `READ:PAYMENT WRITE:PAYMENT`
- ✅ Tried: `READ:PAYMENT READ:PURCHASE`
- ❌ Result: Same error

### Attempt 4: Verify Organization UUID

```bash
curl -X GET "https://oauth.zettle.com/users/self" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

**Response**:

```json
{
  "uuid": "01JFGXNX3FWXQ6CQHBQHVP5YK0",
  "organizationUuid": "01JFGXNX3FWXQ6CQHBQHVP5YK0"
}
```

✅ Organization UUID matches

### Attempt 5: Check Reader Compatibility

- **Reader Model**: PayPal Reader (new model, purchased 2024)
- **Firmware**: Latest version (auto-updated)
- **Region**: Norway
- **Account**: Norwegian Zettle account

### Attempt 6: Wait for Code Activation

- ✅ Waited 1 minute after code creation
- ✅ Waited 5 minutes after code creation
- ✅ Tried immediately after creation
- ❌ Result: Same error

### Attempt 7: Multiple Reader Link Creations

- Created 10+ different reader links
- Each with unique 8-digit codes
- All codes show same error on reader

---

## Error Messages

### From Reader Display

```
Must be a valid code
```

### From API (No errors)

All API calls return HTTP 200/201 with valid responses. No error messages in API responses.

### From Backend Logs

```
[INFO] Reader link created successfully
[INFO] LinkId: 01JFQR5KXVZQPWG3KCFBXZM123
[INFO] Code: 12345678
[INFO] Organization: 01JFGXNX3FWXQ6CQHBQHVP5YK0
[INFO] Expires: 2024-12-22T10:30:00Z
```

No errors in backend logs.

---

## Request Details

### API Request (Create Reader Link)

```http
POST /reader-connect/v1/reader-links HTTP/1.1
Host: reader-connect.zettle.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "organizationUuid": "01JFGXNX3FWXQ6CQHBQHVP5YK0",
  "label": "Stylora POS"
}
```

### API Response

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "linkId": "01JFQR5KXVZQPWG3KCFBXZM123",
  "code": "12345678",
  "organizationUuid": "01JFGXNX3FWXQ6CQHBQHVP5YK0",
  "label": "Stylora POS",
  "createdAt": "2024-12-22T09:30:00.000Z",
  "expiresAt": "2024-12-22T10:30:00.000Z"
}
```

---

## Environment Details

### Development Environment

- **Platform**: Web (Browser-based)
- **Frontend**: React 19 + TypeScript
- **Backend**: Node.js 22 + TypeScript
- **OAuth Library**: Custom implementation (following Zettle docs)
- **API Client**: Fetch API

### Account Details

- **Market**: Norway
- **Account Type**: Business account
- **Organization UUID**: `01JFGXNX3FWXQ6CQHBQHVP5YK0`
- **Developer Account**: Registered on developer.zettle.com
- **API Credentials**: Valid (OAuth working)

### Reader Details

- **Model**: PayPal Reader (2024 model)
- **Purchase Date**: December 2024
- **Firmware**: Latest (auto-updated)
- **Region**: Norway
- **Connection**: WiFi enabled
- **Status**: Working (can process payments via Zettle Go app)

---

## Expected Outcome

1. Create Reader Link via API → ✅ Working
2. Receive 8-digit code → ✅ Working
3. Enter code on PayPal Reader → ❌ **Should accept code**
4. Reader pairs with our POS → ❌ **Not happening**
5. Establish WebSocket connection → ⏸️ **Blocked by step 3**
6. Process payments → ⏸️ **Blocked by step 3**

---

## Questions

1. **Is there a specific reader model required for Reader Connect API?**
   - Documentation doesn't specify model requirements
   - We have "PayPal Reader" (new model, 2024)

2. **Are there additional activation steps needed?**
   - Do we need to register the reader serial number?
   - Do we need to enable Reader Connect in account settings?

3. **Is the 8-digit code format correct?**
   - We're using the code exactly as returned by API
   - Should it be formatted differently on the reader?

4. **Is there a delay between code creation and activation?**
   - We've tried waiting 1-5 minutes
   - Still getting same error

5. **Are there any account-level permissions needed?**
   - OAuth scopes we're using: `READ:PAYMENT`
   - Do we need additional scopes?

6. **Is Reader Connect API available in Norway?**
   - Documentation lists Norway as supported
   - But is it fully rolled out?

---

## Additional Information

### Time Spent

- 10+ hours debugging
- 50+ pairing attempts
- Multiple code reviews
- Extensive documentation reading

### Documentation Reviewed

- ✅ Reader Connect API Overview
- ✅ Reader Connect REST API Reference
- ✅ OAuth 2.0 Authorization Guide
- ✅ Link a Reader User Guide
- ✅ WebSocket API Reference

### Code Repository

We have a complete implementation ready. Can provide code samples if needed.

### Business Impact

- Blocking launch of POS system for Norwegian salons
- Need to decide between:
  - Waiting for iZettle fix
  - Switching to alternative solution (Stripe Terminal)

---

## Requested Support

1. **Verify if our implementation is correct**
   - Are we missing any steps?
   - Is the API endpoint correct?

2. **Check if there's a backend issue**
   - Can you verify our organization UUID is properly configured?
   - Are there any flags/settings needed on our account?

3. **Provide working example**
   - Is there a complete working example for web integration?
   - The GitHub example-integration repo doesn't include Reader Connect

4. **Clarify reader compatibility**
   - Which exact reader models work with Reader Connect API?
   - Does "PayPal Reader" (2024) support Reader Connect?

---

## Contact Information

**Email**: [Your email]  
**Organization UUID**: `01JFGXNX3FWXQ6CQHBQHVP5YK0`  
**Market**: Norway  
**Preferred Response Method**: Email

---

## Attachments

1. Screenshot of reader error message
2. API request/response logs
3. Backend implementation code (if requested)
4. OAuth token (redacted) for verification

---

**Thank you for your assistance!**

We're eager to integrate Reader Connect API into our POS system, but this blocking issue is preventing us from moving forward. Any guidance would be greatly appreciated.
