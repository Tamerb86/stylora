# iZettle OAuth Integration Notes

## Overview
iZettle uses OAuth 2.0 for authentication and authorization.

## OAuth Flows Supported
1. **Code grant with PKCE** (Recommended - most secure)
2. **Code grant** (Standard OAuth 2.0)
3. **Assertion grant** (Using API Key/JWT)

## For SaaS Multi-Tenant (Stylora)
We need **"Code grant"** flow (partner-hosted app):
- Each tenant (salon) authorizes Stylora to access their iZettle account
- Tokens stored per tenant in database
- Refresh tokens used to get new access tokens

## Implementation Steps

### 1. Authorization URL
```
GET https://oauth.zettle.com/authorize
```

Parameters:
- `response_type=code`
- `client_id={YOUR_CLIENT_ID}`
- `redirect_uri={YOUR_REDIRECT_URI}`
- `scope=READ:PURCHASE WRITE:PURCHASE READ:FINANCE`
- `state={RANDOM_STATE}` (for security)

### 2. Token Exchange
```
POST https://oauth.zettle.com/token
```

Body:
- `grant_type=authorization_code`
- `code={AUTHORIZATION_CODE}`
- `client_id={YOUR_CLIENT_ID}`
- `client_secret={YOUR_CLIENT_SECRET}`
- `redirect_uri={YOUR_REDIRECT_URI}`

Response:
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 7200,
  "token_type": "Bearer"
}
```

### 3. Refresh Token
```
POST https://oauth.zettle.com/token
```

Body:
- `grant_type=refresh_token`
- `refresh_token={REFRESH_TOKEN}`
- `client_id={YOUR_CLIENT_ID}`
- `client_secret={YOUR_CLIENT_SECRET}`

### 4. Required Scopes
- `READ:PURCHASE` - Read payment transactions
- `WRITE:PURCHASE` - Create payment transactions
- `READ:FINANCE` - Read financial reports

## Database Schema
Already exists in `paymentProviders` table - need to add:
- `accessToken` (encrypted)
- `refreshToken` (encrypted)
- `tokenExpiresAt`
- `providerAccountId` (iZettle merchant ID)

## Security
- Store tokens encrypted in database
- Use HTTPS only
- Validate state parameter
- Implement token refresh before expiry
