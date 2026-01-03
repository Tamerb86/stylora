-- Script to check and fix subdomain issues for tenants
-- This helps identify tenants that might not have a subdomain set correctly

-- 1. Check for tenants without subdomain (should not exist, but checking)
SELECT 
    id,
    name,
    subdomain,
    email,
    status,
    createdAt
FROM tenants
WHERE subdomain IS NULL OR subdomain = '';

-- 2. Check for the specific 'tamer' subdomain
SELECT 
    id,
    name,
    subdomain,
    email,
    status,
    createdAt
FROM tenants
WHERE subdomain = 'tamer' OR name LIKE '%tamer%' OR name LIKE '%Tamer%';

-- 3. List all tenants with their booking URLs
SELECT 
    id,
    name,
    subdomain,
    CONCAT('https://', subdomain, '.stylora.no/book') AS booking_url,
    status
FROM tenants
ORDER BY createdAt DESC
LIMIT 20;

-- 4. If you need to update a tenant's subdomain (example)
-- IMPORTANT: Only run this if you've verified the subdomain is available
-- UPDATE tenants 
-- SET subdomain = 'tamer', updatedAt = NOW()
-- WHERE id = 'YOUR_TENANT_ID_HERE';

-- 5. Check for duplicate subdomains (should not exist due to unique constraint)
SELECT 
    subdomain,
    COUNT(*) as count
FROM tenants
GROUP BY subdomain
HAVING COUNT(*) > 1;
