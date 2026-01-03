# Booking Page Troubleshooting Guide

## Problem
Customers cannot access the booking page at `https://{subdomain}.stylora.no/book`

## Common Issues and Solutions

### 1. Subdomain Not Set in Database

**Symptoms:**
- Booking page shows "Salong ikke funnet" (Salon not found)
- Error message shows the subdomain but tenant is not found

**Solution:**
```sql
-- Check if tenant exists and has subdomain
SELECT id, name, subdomain FROM tenants WHERE name LIKE '%TenantName%';

-- If subdomain is missing or incorrect, update it:
UPDATE tenants 
SET subdomain = 'desired-subdomain', updatedAt = NOW()
WHERE id = 'tenant-id-here';
```

### 2. Subdomain Format Issues

**Valid subdomain formats:**
- ✅ `tamer` → https://tamer.stylora.no/book
- ✅ `ks-frisor` → https://ks-frisor.stylora.no/book
- ✅ `beauty123` → https://beauty123.stylora.no/book
- ❌ `Tamer` (uppercase not allowed)
- ❌ `-tamer` (cannot start with hyphen)
- ❌ `tamer-` (cannot end with hyphen)
- ❌ `123` (must contain at least one letter)

**Subdomain rules:**
- 3-63 characters
- Lowercase letters (a-z), numbers (0-9), and hyphens (-)
- Must contain at least one letter
- Cannot start or end with hyphen
- Must be unique across all tenants

### 3. How to Access Booking Page from Settings

**For Salon Owners:**
1. Go to Settings → Domain tab
2. You'll see your booking URL: `https://{subdomain}.stylora.no/book`
3. Click the "Åpne bookingside" button to open it in a new tab
4. Click the copy icon to copy the URL
5. Click the external link icon to open in new tab

### 4. Testing in Development

**Development URLs require tenantId parameter:**
```
http://localhost:3000/book?tenantId=tenant-id-here
http://localhost:3000/book?tenantId=demo-tenant-stylora
```

### 5. Checking Subdomain Availability

**From the Settings UI:**
1. Go to Settings → Domain tab
2. Click "Rediger subdomene"
3. Type your desired subdomain
4. The system will automatically check if it's available
5. Green checkmark = available
6. Red X = already taken

### 6. Server-Side Debugging

**Check server logs for:**
```
[PublicBooking] Looking up tenant with subdomain/id: {subdomain}
[PublicBooking] Tenant found: {...}
[PublicBooking] Tenant not found for subdomain/id: {subdomain}
```

**Check client console logs for:**
```
[Booking] Hostname: {hostname}
[Booking] Hostname parts: [...]
[Booking] Extracted subdomain: {subdomain}
```

### 7. SQL Troubleshooting Queries

See `check_and_fix_subdomain.sql` for useful SQL queries.

## New Salon Setup Checklist

For newly created salons to have working booking pages:

- [ ] Tenant record created in database
- [ ] Subdomain field is set and follows naming rules
- [ ] Subdomain is unique (no duplicates)
- [ ] DNS/routing is configured (automatic in production)
- [ ] Test the booking URL works: `https://{subdomain}.stylora.no/book`
- [ ] Verify services are created and active
- [ ] Verify at least one employee exists
- [ ] Check salon settings are configured

## Technical Implementation

### Client-Side (PublicBooking.tsx)
- Extracts subdomain from URL hostname
- Falls back to ?tenantId parameter for development
- Calls `getTenantBySubdomain` API with extracted subdomain

### Server-Side (routers.ts)
- `getTenantBySubdomain` searches by subdomain OR tenant ID
- Uses SQL OR condition for flexible lookup
- Returns tenant info if found, null otherwise

### Database Schema
```sql
CREATE TABLE tenants (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(63) NOT NULL UNIQUE,
  ...
);

CREATE INDEX subdomain_idx ON tenants(subdomain);
```

## Common Error Messages

### "Salong ikke funnet"
- Tenant doesn't exist with that subdomain
- Check subdomain spelling
- Verify tenant exists in database
- Check subdomain field is set correctly

### "Development environment detected"
- Accessing from localhost/railway without tenantId parameter
- Add `?tenantId=xxx` to URL

### "Could not extract subdomain from hostname"
- Accessing root domain (stylora.no) without subdomain
- Hostname doesn't have expected format
- Check URL format is correct

## Support

If issues persist after checking above:
1. Check database for tenant record
2. Verify subdomain field is set
3. Check server logs for tenant lookup errors
4. Verify no typos in URL
5. Clear browser cache and try again
