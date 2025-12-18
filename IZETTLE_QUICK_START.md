# iZettle Integration - Quick Start Testing Guide

## ✅ Deployment Status: READY FOR TESTING

All code has been deployed to both **production** and **staging** environments. The database migration has been applied successfully.

---

## 🚀 Quick Test (5 Minutes)

### Step 1: Access Production Environment

**URL:** https://barbertime-production-5d35.up.railway.app

**Demo Credentials:**
- Email: `demo@barbertime.no`
- Password: `demo123`

### Step 2: Navigate to Payment Providers

1. Log in with demo credentials
2. Click **Innstillinger** (Settings) in sidebar
3. Click **Betalingsleverandører** (Payment Providers)

### Step 3: Connect iZettle

1. Find the **iZettle** card
2. Click **"Koble til iZettle"** button
3. You will be redirected to iZettle OAuth page
4. **Log in with your iZettle test account**
5. Authorize the connection
6. You will be redirected back to BarberTime
7. Verify connection status shows **"Tilkoblet"** (Connected)

### Step 4: Test Payment in POS

1. Go to **Salg** (POS) in sidebar
2. Add a service: Click **"Legg til tjeneste"** → Select "Herreklipp" (299 NOK)
3. Add a product: Click **"Legg til produkt"** → Select any product
4. Click **"Betal med iZettle"** button
5. Complete the payment (use iZettle test card if available)
6. Verify success toast notification appears
7. Check order history to confirm payment recorded

---

## 📋 Environment Variables (Already Added)

### Production Environment ✅
```
IZETTLE_CLIENT_ID=3209d1a8-4c06-48bd-8c88-f5bc0bf473bc
IZETTLE_CLIENT_SECRET=IZSEC422729de-4f98-476e-914f-0419447026c7
IZETTLE_REDIRECT_URI=https://barbertime-production-5d35.up.railway.app/api/izettle/callback
```

### Staging Environment ⏳ (Need to Add)
```
IZETTLE_CLIENT_ID=3209d1a8-4c06-48bd-8c88-f5bc0bf473bc
IZETTLE_CLIENT_SECRET=IZSEC422729de-4f98-476e-914f-0419447026c7
IZETTLE_REDIRECT_URI=https://barbertime-production-0623.up.railway.app/api/izettle/callback
```

**To add staging variables:**
1. Go to Railway dashboard
2. Select staging service
3. Click **Variables** tab
4. Add the three variables above
5. Click **Deploy**

---

## 🧪 Detailed Testing Scenarios

### Scenario 1: First-Time Connection

**Goal:** Verify OAuth flow works correctly

**Steps:**
1. Navigate to Settings → Betalingsleverandører
2. Click "Koble til iZettle"
3. Complete OAuth authorization
4. Verify redirect back to BarberTime
5. Check connection status shows "Tilkoblet"
6. Verify account email is displayed

**Expected Result:**
- OAuth completes without errors
- Connection status updates immediately
- Account email shown correctly
- Tokens stored in database

**Database Verification:**
```sql
SELECT 
  id, tenantId, providerType, isActive, 
  providerEmail, tokenExpiresAt, lastSyncAt
FROM paymentProviders 
WHERE providerType = 'izettle';
```

### Scenario 2: Payment Processing

**Goal:** Verify payment creation works

**Steps:**
1. Go to POS (Salg)
2. Add items to cart:
   - Service: Herreklipp (299 NOK)
   - Product: Hårpleie produkt (150 NOK)
   - Total: 449 NOK
3. Click "Betal med iZettle"
4. Complete payment
5. Verify success notification
6. Check order history

**Expected Result:**
- Payment processes within 3-5 seconds
- Success toast appears
- Order created with correct amount
- Payment status = "completed"
- Payment appears in iZettle dashboard

**Database Verification:**
```sql
SELECT 
  o.id, o.totalAmount, o.status, o.paymentStatus,
  p.amount, p.method, p.status as paymentStatus
FROM orders o
LEFT JOIN payments p ON o.id = p.orderId
WHERE o.createdAt > NOW() - INTERVAL 1 HOUR
ORDER BY o.createdAt DESC
LIMIT 5;
```

### Scenario 3: Token Refresh

**Goal:** Verify automatic token refresh works

**Steps:**
1. Manually expire token in database:
   ```sql
   UPDATE paymentProviders 
   SET tokenExpiresAt = NOW() - INTERVAL 1 HOUR
   WHERE providerType = 'izettle';
   ```
2. Attempt a payment in POS
3. Verify payment still succeeds
4. Check token was refreshed:
   ```sql
   SELECT tokenExpiresAt, updatedAt 
   FROM paymentProviders 
   WHERE providerType = 'izettle';
   ```

**Expected Result:**
- Payment succeeds despite expired token
- Token automatically refreshed before payment
- New `tokenExpiresAt` is in the future
- No error shown to user

### Scenario 4: Disconnection

**Goal:** Verify disconnection works correctly

**Steps:**
1. Go to Settings → Betalingsleverandører
2. Click "Koble fra" button
3. Confirm disconnection
4. Verify connection status shows "Ikke tilkoblet"
5. Go to POS
6. Verify "Betal med iZettle" button is hidden

**Expected Result:**
- Tokens removed from database
- Connection status updates immediately
- Payment button no longer visible in POS
- Can reconnect successfully after disconnection

### Scenario 5: Multi-Tenant Isolation

**Goal:** Verify each salon uses their own iZettle account

**Steps:**
1. Create second test salon account
2. Connect different iZettle account
3. Process payment from Salon 1
4. Verify payment goes to Salon 1's iZettle account
5. Process payment from Salon 2
6. Verify payment goes to Salon 2's iZettle account

**Expected Result:**
- Each salon has separate OAuth tokens
- Payments go to correct iZettle account
- No cross-tenant data leakage
- Each salon sees only their own payments

---

## 🐛 Troubleshooting

### Issue: OAuth Redirect Fails

**Symptoms:**
- Clicking "Koble til iZettle" does nothing
- Redirected to error page
- "Invalid redirect URI" error

**Solutions:**
1. Verify `IZETTLE_REDIRECT_URI` matches exactly in Railway
2. Check iZettle developer portal has correct redirect URI whitelisted
3. Ensure HTTPS is used (not HTTP)
4. Clear browser cache and try again

**Check Environment Variables:**
```bash
# In Railway dashboard, verify:
IZETTLE_REDIRECT_URI=https://barbertime-production-5d35.up.railway.app/api/izettle/callback
```

### Issue: Payment Fails

**Symptoms:**
- "Betal med iZettle" button shows error
- Payment doesn't complete
- Error toast appears

**Solutions:**
1. Check iZettle connection status (Settings → Betalingsleverandører)
2. Verify tokens haven't expired (check database)
3. Ensure iZettle account has necessary permissions
4. Check iZettle API status: https://status.zettle.com/

**Check Logs:**
```bash
# In Railway dashboard → Deployments → Logs
# Look for errors containing "izettle" or "payment"
```

### Issue: Connection Shows "Tilkoblet" But Payment Fails

**Symptoms:**
- Connection status shows connected
- Payment button visible
- Payment fails when clicked

**Solutions:**
1. Check token expiration:
   ```sql
   SELECT tokenExpiresAt FROM paymentProviders WHERE providerType = 'izettle';
   ```
2. Verify iZettle account is active
3. Check iZettle account has payment permissions
4. Try disconnecting and reconnecting

### Issue: "Betal med iZettle" Button Not Visible

**Symptoms:**
- Connection shows "Tilkoblet"
- Payment button not visible in POS

**Solutions:**
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Check browser console for errors
3. Verify connection status API returns correct data
4. Check `isActive` flag in database:
   ```sql
   SELECT isActive FROM paymentProviders WHERE providerType = 'izettle';
   ```

---

## 📊 Success Metrics

After testing, verify these metrics:

✅ **Functional Metrics:**
- [ ] OAuth connection success rate: 100%
- [ ] Payment processing success rate: > 95%
- [ ] Token refresh success rate: 100%
- [ ] Average payment time: < 5 seconds

✅ **User Experience Metrics:**
- [ ] Connection process takes < 30 seconds
- [ ] Payment process takes < 10 seconds
- [ ] Error messages are clear and in Norwegian
- [ ] UI is responsive on mobile devices

✅ **Security Metrics:**
- [ ] OAuth tokens encrypted in database
- [ ] HTTPS used for all API calls
- [ ] CSRF protection working
- [ ] Multi-tenant isolation verified

---

## 🔍 Database Queries for Verification

### Check iZettle Connections
```sql
SELECT 
  pp.id,
  t.name as salonName,
  pp.providerEmail,
  pp.isActive,
  pp.tokenExpiresAt,
  pp.lastSyncAt,
  pp.createdAt
FROM paymentProviders pp
JOIN tenants t ON pp.tenantId = t.id
WHERE pp.providerType = 'izettle'
ORDER BY pp.createdAt DESC;
```

### Check Recent iZettle Payments
```sql
SELECT 
  o.id,
  t.name as salonName,
  c.name as customerName,
  o.totalAmount,
  o.paymentStatus,
  p.method,
  p.status,
  o.createdAt
FROM orders o
JOIN tenants t ON o.tenantId = t.id
LEFT JOIN customers c ON o.customerId = c.id
LEFT JOIN payments p ON o.id = p.orderId
WHERE p.method = 'izettle'
ORDER BY o.createdAt DESC
LIMIT 10;
```

### Check Token Expiration Status
```sql
SELECT 
  t.name as salonName,
  pp.providerEmail,
  pp.tokenExpiresAt,
  CASE 
    WHEN pp.tokenExpiresAt > NOW() THEN 'Valid'
    ELSE 'Expired'
  END as tokenStatus,
  TIMESTAMPDIFF(HOUR, NOW(), pp.tokenExpiresAt) as hoursUntilExpiry
FROM paymentProviders pp
JOIN tenants t ON pp.tenantId = t.id
WHERE pp.providerType = 'izettle';
```

---

## 📞 Support

### iZettle Support
- **Developer Portal:** https://developer.zettle.com/
- **API Documentation:** https://developer.zettle.com/docs/api/oauth/overview
- **API Status:** https://status.zettle.com/
- **Support Email:** support@izettle.com

### Railway Support
- **Dashboard:** https://railway.app
- **Help Center:** https://railway.app/help
- **Status:** https://status.railway.app/

---

## 🎯 Next Steps After Successful Testing

1. **Add Staging Environment Variables**
   - Follow instructions above to add variables to staging

2. **Test on Staging**
   - Repeat all test scenarios on staging environment
   - Use separate iZettle sandbox account

3. **Update User Documentation**
   - Create user guide for salon owners
   - Add iZettle setup to onboarding wizard
   - Create video tutorial

4. **Monitor Production**
   - Watch error logs for first 48 hours
   - Track payment success rates
   - Monitor token refresh patterns

5. **Implement Enhancements**
   - Add payment history sync from iZettle
   - Implement refund functionality
   - Add receipt printing integration
   - Support multiple payment terminals

---

**Last Updated:** December 18, 2024  
**Status:** Ready for Testing  
**Deployment:** Production ✅ | Staging ⏳
