# Login Issues Troubleshooting Guide

This document provides solutions for common login failures in the Stylora application.

## Common Login Issues

### 1. "Ugyldig e-post eller passord" (Invalid Email or Password)

**Possible Causes:**
- Wrong password
- Email address not registered
- Email case sensitivity (now fixed in latest version)

**Solutions:**
- Verify you're using the correct password
- Check if the email is registered in the system
- Try using the "Glemt passord?" (Forgot password) link
- The system now handles email case-insensitively, so `Test@Example.com` and `test@example.com` are treated the same

### 2. "Database ikke tilgjengelig" (Database Not Available)

**Possible Causes:**
- Database server is down
- Incorrect `DATABASE_URL` environment variable
- Network connectivity issues
- Database credentials expired

**Solutions:**
1. **Check Database Connection:**
   ```bash
   # Verify DATABASE_URL is set
   echo $DATABASE_URL
   ```

2. **Test Database Connectivity:**
   - The server logs will show database connection status on startup
   - Look for: `✅ [Database] Connection validated successfully`
   - Or error: `❌ [Database] CRITICAL: Database connection failed!`

3. **Verify Environment Variables:**
   - Ensure `DATABASE_URL` is correctly set in `.env` file
   - Format: `mysql://username:password@host:3306/database_name`
   - Check that the database server is accessible from the application server

4. **Check Database Server Status:**
   - Verify the MySQL/database server is running
   - Check firewall rules allow connections
   - Verify database credentials are correct

### 3. "Kontoen er deaktivert" (Account is Deactivated)

**Possible Causes:**
- User account has been deactivated by an administrator
- Account suspended due to policy violation

**Solutions:**
- Contact your system administrator to reactivate the account
- Check the `users` table in the database: `isActive` field should be `true`

### 4. "For mange innloggingsforsøk" (Too Many Login Attempts)

**Possible Causes:**
- Rate limiting triggered after 20 failed login attempts in 15 minutes

**Solutions:**
- Wait 15 minutes before trying again
- Ensure you're using the correct credentials
- Use the "Glemt passord?" link to reset your password if needed

### 5. Login Form Not Responding

**Possible Causes:**
- JavaScript errors in the browser
- Network connectivity issues
- Server not responding

**Solutions:**
1. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Look for JavaScript errors in the Console tab
   - Check Network tab for failed API requests

2. **Verify API Endpoint:**
   - The login form sends a POST request to `/api/auth/login`
   - Check if the request reaches the server
   - Look for error responses in the Network tab

3. **Check Server Logs:**
   - Server logs provide detailed information about login attempts
   - Look for `[Auth]` prefixed log messages
   - Example: `[Auth] Login attempt for non-existent user: test@example.com`

## Demo Account for Testing

If you need to test the system, use the demo account:

- **Email:** `demo@stylora.no`
- **Password:** `demo123`

This account is pre-configured for testing purposes.

## Recent Improvements (v1.1.0)

### Case-Insensitive Email Handling
- Emails are now normalized to lowercase during login, registration, and password reset
- Users can login with any case variation: `Test@Example.com`, `test@example.com`, `TEST@EXAMPLE.COM`
- Existing users with mixed-case emails can now login successfully

### Enhanced Error Messages
- More specific error messages guide users to resolve issues
- Database connectivity errors include actionable advice
- Deactivated account messages direct users to contact administrators

### Better Logging
- All login attempts are logged with email and user ID
- Failed attempts show specific reasons (invalid password, non-existent user, etc.)
- Database connectivity is validated on server startup

## For Administrators

### Checking User Status

```sql
-- Check if user exists
SELECT id, email, isActive, role FROM users WHERE LOWER(email) = 'user@example.com';

-- Reactivate a deactivated user
UPDATE users SET isActive = true WHERE id = USER_ID;

-- Check password hash exists
SELECT id, email, passwordHash IS NOT NULL as has_password FROM users WHERE id = USER_ID;
```

### Resetting User Password

If a user needs their password reset manually:

```javascript
// In Node.js REPL or script
const bcrypt = require('bcrypt');
const newPassword = 'NewSecurePassword123!';
const hash = await bcrypt.hash(newPassword, 10);
console.log('Password hash:', hash);

// Then update in database:
// UPDATE users SET passwordHash = 'HASH_FROM_ABOVE' WHERE id = USER_ID;
```

### Monitoring Login Issues

Check server logs for authentication-related messages:

```bash
# Filter auth-related logs
grep "\[Auth\]" server.log

# Check for failed login attempts
grep "Invalid password\|non-existent user" server.log

# Monitor database connectivity
grep "\[Database\]" server.log
```

## Environment Variables

Required environment variables for authentication:

```bash
# Database Connection
DATABASE_URL=mysql://username:password@host:3306/database_name

# JWT Secret (minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Application ID
VITE_APP_ID=stylora
```

## Support

If issues persist after trying these solutions:

1. Check server logs for detailed error messages
2. Verify all environment variables are correctly set
3. Ensure database is accessible and credentials are valid
4. Test with the demo account to rule out user-specific issues
5. Contact system administrator or technical support

## Technical Details

### Authentication Flow

1. User enters email and password
2. Email is normalized to lowercase
3. Database query uses case-insensitive matching: `LOWER(email) = normalized_email`
4. Password is verified using bcrypt
5. User's `isActive` status is checked
6. Session token and refresh token are created
7. Tokens are set as HTTP-only cookies
8. User is redirected to dashboard

### Security Features

- Passwords hashed with bcrypt (10 rounds)
- Rate limiting: 20 attempts per 15 minutes
- HTTP-only cookies for session tokens
- Refresh tokens stored in database with 90-day expiry
- Session tokens expire after 30 days
- Failed login attempts are logged for security monitoring
