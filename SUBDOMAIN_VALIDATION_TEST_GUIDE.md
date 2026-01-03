# Subdomain Validation Test Guide

## Overview
This document provides test cases for manual verification of the subdomain validation feature.

## Validation Rules
1. Length: 3-63 characters
2. Characters: lowercase letters (a-z), numbers (0-9), hyphens (-)
3. Must contain at least one letter (a-z)
4. Cannot start or end with a hyphen
5. No special characters or spaces allowed

## Test Cases

### Valid Subdomains ✓

| Subdomain | Description |
|-----------|-------------|
| `abc` | Minimum length, only letters |
| `mysalon` | Only letters |
| `salon123` | Letters with numbers |
| `my-salon` | Letters with hyphen |
| `salon-2024` | Letters, hyphen, and numbers |
| `a1b2c3` | Mixed letters and numbers |
| `test-salon-123` | Multiple hyphens with letters and numbers |
| `abc` (3 chars) | Minimum valid length |
| `a` + 62 more chars | Maximum valid length (63 chars) |

### Invalid Subdomains ✗

| Subdomain | Reason | Error Message |
|-----------|--------|---------------|
| `12345` | Only numbers (no letters) | "Subdomain must contain at least one letter (a-z)" |
| `123` | Only numbers | "Subdomain must contain at least one letter (a-z)" |
| `ab` | Too short (< 3 chars) | "Subdomain must be at least 3 characters" |
| `a` + 63 more chars | Too long (> 63 chars) | "Subdomain must be at most 63 characters" |
| `-abc` | Starts with hyphen | "Invalid format" |
| `abc-` | Ends with hyphen | "Invalid format" |
| `ABC` | Uppercase letters | "Invalid format" (automatically lowercased in UI) |
| `abc_123` | Contains underscore | "Invalid format" |
| `abc.com` | Contains dot | "Invalid format" |
| `abc 123` | Contains space | "Invalid format" (automatically removed in UI) |
| `abc@123` | Contains special character | "Invalid format" (automatically removed in UI) |

## Testing Locations

### 1. Domain Settings Tab (existing users)
- **Path**: Settings → Domain
- **Component**: `DomainSettingsTab.tsx`
- **Test**: Try editing an existing subdomain with various valid/invalid values

### 2. SaaS Admin Tenant Onboarding (admin creating new tenants)
- **Path**: SaaS Admin → Create New Tenant
- **Component**: `SaasAdminTenantOnboarding.tsx`
- **Test**: Create a new tenant with various subdomain values

### 3. Public Onboarding (new user signup)
- **Path**: /onboarding
- **Component**: `Onboarding.tsx`
- **Test**: Complete onboarding with various subdomain values

## Expected Behavior

### Frontend Validation
1. Input field automatically cleans input:
   - Converts to lowercase
   - Removes special characters and spaces
   - Only allows a-z, 0-9, and hyphens

2. Real-time feedback:
   - Shows validation errors immediately
   - Checks availability after 500ms debounce
   - Disables save button if validation fails

3. Visual indicators:
   - ✓ Green checkmark for valid & available
   - ✗ Red X for invalid or taken
   - Loading spinner during availability check

### Backend Validation
1. Server-side validation occurs on:
   - `salonSettings.updateSubdomain` (existing users)
   - `onboarding.complete` (new signups)
   - `saasAdmin.createTenantWithOnboarding` (admin creating tenants)

2. Returns appropriate error messages
3. Rejects requests that don't meet validation rules

## Manual Testing Checklist

- [ ] Test "only letters" subdomain (should work)
- [ ] Test "letters + numbers" subdomain (should work)
- [ ] Test "letters + hyphens" subdomain (should work)
- [ ] Test "only numbers" subdomain (should fail)
- [ ] Test subdomain starting with hyphen (should fail)
- [ ] Test subdomain ending with hyphen (should fail)
- [ ] Test 2-character subdomain (should fail)
- [ ] Test 64+ character subdomain (should fail)
- [ ] Test subdomain with spaces (should be auto-cleaned)
- [ ] Test subdomain with uppercase (should be auto-lowercased)
- [ ] Test subdomain with special chars (should be auto-removed)
- [ ] Verify availability check works correctly
- [ ] Verify error messages are clear and helpful
- [ ] Test on all three interfaces (Domain Settings, Admin Onboarding, Public Onboarding)

## Screenshots Needed

To demonstrate the fix works correctly, capture screenshots showing:

1. **Valid subdomain accepted**: Show a subdomain with letters being successfully saved
2. **Numeric-only subdomain rejected**: Show "12345" being rejected with error message
3. **Validation rules displayed**: Show the rules card with all requirements
4. **Real-time validation**: Show the checkmark/X icons during input
5. **Different test cases**: Show at least 3-4 different valid/invalid examples

## Notes

- The validation is designed to comply with DNS naming conventions
- Numeric-only subdomains are rejected because they can cause issues with DNS resolution
- The 63-character limit is a DNS standard for subdomain labels
- All validation is performed on both frontend (for UX) and backend (for security)
