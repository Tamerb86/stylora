# iZettle OAuth Deployment Checklist

## ✅ Completed Steps

### 1. Code Implementation
- ✅ Created `payment_providers` table with OAuth columns
- ✅ Implemented iZettle service module (`server/services/izettle.ts`)
- ✅ Added OAuth flow endpoints in `server/routers.ts`:
  - `izettle.initiateAuth` - Start OAuth flow
  - `izettle.handleCallback` - Process OAuth callback
  - `izettle.processPayment` - Create payment
  - `izettle.getConnectionStatus` - Check connection status
- ✅ Created Payment Providers settings page (`client/src/pages/PaymentProviders.tsx`)
- ✅ Added iZettle payment button in POS (`client/src/pages/POS.tsx`)
- ✅ Pushed to GitHub (main and develop branches)

### 2. Railway Environment Variables
- ✅ Added to **Production** (barbertime-production-5d35):
  - `IZETTLE_CLIENT_ID`
  - `IZETTLE_CLIENT_SECRET`
  - `IZETTLE_REDIRECT_URI`

## ⏳ Pending Steps

### 3. Staging Environment Setup
- [ ] Add environment variables to **Staging** (barbertime-production-0623):
  ```
  IZETTLE_CLIENT_ID=3209d1a8-4c06-48bd-8c88-f5bc0bf473bc
  IZETTLE_CLIENT_SECRET=IZSEC422729de-4f98-476e-914f-0419447026c7
  IZETTLE_REDIRECT_URI=https://barbertime-production-0623.up.railway.app/api/izettle/callback
  ```
- [ ] Deploy staging environment
- [ ] Verify staging deployment successful

### 4. Database Migration
- [ ] Verify migration `0003_hard_gauntlet.sql` applied to production database
- [ ] Check `payment_providers` table exists
- [ ] Verify table columns match schema

### 5. iZettle Developer Portal Configuration
- [ ] Log in to https://developer.zettle.com/
- [ ] Verify OAuth app settings:
  - Client ID matches environment variable
  - Redirect URIs include both staging and production:
    - `https://barbertime-production-0623.up.railway.app/api/izettle/callback`
    - `https://barbertime-production-5d35.up.railway.app/api/izettle/callback`
- [ ] Enable required OAuth scopes:
  - `READ:PURCHASE` - Read payment transactions
  - `WRITE:PURCHASE` - Create payments
  - `READ:USERINFO` - Get merchant account info

### 6. Production Testing

#### OAuth Connection Test
- [ ] Log in to production: https://barbertime-production-5d35.up.railway.app
- [ ] Navigate to: Innstillinger → Betalingsleverandører
- [ ] Click "Koble til iZettle" button
- [ ] Complete OAuth authorization on iZettle
- [ ] Verify redirect back to BarberTime
- [ ] Check connection status shows "Tilkoblet" (Connected)
- [ ] Verify tokens stored in database:
  ```sql
  SELECT id, tenantId, providerType, isActive, providerEmail, tokenExpiresAt 
  FROM paymentProviders 
  WHERE providerType = 'izettle';
  ```

#### Payment Processing Test
- [ ] Go to POS: Salg
- [ ] Add test service/product to cart
- [ ] Click "Betal med iZettle" button
- [ ] Complete test payment (use iZettle sandbox if available)
- [ ] Verify payment recorded in orders table
- [ ] Check payment appears in order history
- [ ] Verify payment synced to iZettle dashboard

#### Error Handling Test
- [ ] Test with expired token (wait for expiration or manually modify)
- [ ] Verify automatic token refresh works
- [ ] Test payment with insufficient funds
- [ ] Verify error messages display correctly
- [ ] Test disconnecting and reconnecting iZettle

### 7. Staging Testing
- [ ] Repeat all OAuth and payment tests on staging environment
- [ ] Verify staging uses separate iZettle sandbox account

### 8. Multi-Tenant Testing
- [ ] Create second test salon
- [ ] Connect different iZettle account
- [ ] Verify payments go to correct iZettle account per tenant
- [ ] Test simultaneous payments from different tenants

### 9. Documentation
- [ ] Update user documentation with iZettle setup instructions
- [ ] Create admin guide for troubleshooting OAuth issues
- [ ] Document token refresh process
- [ ] Add payment provider configuration to onboarding wizard

### 10. Monitoring & Alerts
- [ ] Set up error logging for OAuth failures
- [ ] Monitor token refresh success rate
- [ ] Track payment success/failure rates
- [ ] Set up alerts for:
  - OAuth token expiration without refresh
  - Payment processing errors
  - iZettle API downtime

## Known Issues to Watch

### Walk-in to POS Redirect
User reported: "لا تزال لا تعمل" (still not working)
- [ ] Debug walk-in queue redirect to POS
- [ ] Verify service pre-selection in cart
- [ ] Test complete flow: Walk-in → Start tjeneste → POS → Payment

### Language Verification
- [ ] Verify all UI text is in Norwegian (no Arabic remaining)
- [ ] Check error messages are translated
- [ ] Verify iZettle OAuth consent screen language

## Rollback Plan

If issues occur in production:

1. **Disable iZettle in UI:**
   ```typescript
   // In PaymentProviders.tsx, temporarily hide iZettle option
   const ENABLE_IZETTLE = false;
   ```

2. **Revert to previous deployment:**
   - Railway dashboard → Deployments → Rollback to previous version

3. **Database rollback (if needed):**
   ```sql
   -- Backup payment_providers data first
   CREATE TABLE payment_providers_backup AS SELECT * FROM paymentProviders;
   
   -- Drop table if migration causes issues
   DROP TABLE paymentProviders;
   ```

## Success Criteria

✅ **Deployment is successful when:**
- OAuth flow completes without errors
- Tokens stored and refreshed automatically
- Payments processed successfully through iZettle
- Multi-tenant isolation verified (each salon uses own account)
- Error handling works correctly
- No impact on existing payment methods (Stripe, cash, card)

## Next Steps After Deployment

1. **Monitor for 24-48 hours:**
   - Check error logs
   - Monitor payment success rates
   - Watch for OAuth token issues

2. **User Communication:**
   - Announce iZettle integration to customers
   - Provide setup guide
   - Offer support for initial setup

3. **Feature Enhancements:**
   - Add payment history sync from iZettle
   - Implement refund functionality
   - Add receipt printing integration
   - Support multiple payment terminals per salon

## Support Contacts

- **iZettle Developer Support:** https://developer.zettle.com/support
- **iZettle API Status:** https://status.zettle.com/
- **Railway Support:** https://railway.app/help

---

**Last Updated:** December 18, 2024
**Deployment Status:** Environment variables added to production, ready for testing
