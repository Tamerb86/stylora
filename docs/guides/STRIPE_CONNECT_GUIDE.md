# 🔗 Stripe Connect Integration Guide

## Overview

**Stripe Connect** is now integrated into Stylora to simplify payment setup for salons. Instead of manually copying API keys, salons can connect their Stripe accounts with **one click** using OAuth.

---

## 🎯 Benefits

### For Salons:
- ✅ **One-click setup** - No API keys to copy/paste
- ✅ **Secure OAuth** - Industry-standard authentication
- ✅ **Direct payments** - Money goes straight to salon's bank account
- ✅ **Full control** - Manage everything in Stripe Dashboard
- ✅ **Easy disconnect** - Can revoke access anytime

### For Platform (Stylora):
- ✅ **Better UX** - Simplified onboarding
- ✅ **Scalable** - Easy to onboard 100+ salons
- ✅ **Secure** - No need to store salon API keys
- ✅ **Professional** - Standard SaaS payment integration
- ✅ **Optional fees** - Can add application fees (future)

---

## 🏗️ Architecture

### How It Works:

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Salon     │         │   Stylora    │         │   Stripe    │
│  (Client)   │         │  (Platform)  │         │  (Connect)  │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                       │                        │
       │  1. Click "Connect"   │                        │
       ├──────────────────────>│                        │
       │                       │                        │
       │  2. Redirect to OAuth │                        │
       │<──────────────────────┤                        │
       │                       │                        │
       │  3. Authorize         │                        │
       ├───────────────────────────────────────────────>│
       │                       │                        │
       │  4. Callback with code│                        │
       │<──────────────────────┼────────────────────────┤
       │                       │                        │
       │  5. Exchange code     │                        │
       ├──────────────────────>│  6. Get access token   │
       │                       ├───────────────────────>│
       │                       │<───────────────────────┤
       │                       │                        │
       │  7. Connected!        │                        │
       │<──────────────────────┤                        │
       │                       │                        │
       │  8. Process payment   │                        │
       ├──────────────────────>│  9. Charge via Connect │
       │                       ├───────────────────────>│
       │                       │<───────────────────────┤
       │  10. Payment success  │                        │
       │<──────────────────────┤                        │
```

### Database Schema:

New columns added to `paymentSettings` table:

```sql
ALTER TABLE paymentSettings 
ADD COLUMN stripeConnectedAccountId VARCHAR(255) NULL,
ADD COLUMN stripeAccessToken TEXT NULL,
ADD COLUMN stripeRefreshToken TEXT NULL,
ADD COLUMN stripeAccountStatus ENUM('connected', 'disconnected', 'pending') DEFAULT 'disconnected',
ADD COLUMN stripeConnectedAt TIMESTAMP NULL;
```

---

## 🚀 Setup Instructions

### Step 1: Platform Setup (Stylora Admin)

#### 1.1 Enable Stripe Connect

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Settings** → **Connect**
3. Click **Get started**
4. Fill in platform information:
   - **Platform name**: Stylora
   - **Business type**: SaaS platform
   - **Website**: https://stylora.no

#### 1.2 Get Client ID

1. In Stripe Dashboard → **Settings** → **Connect** → **Settings**
2. Copy **Client ID** (starts with `ca_`)
3. Add to environment variables:

```bash
STRIPE_CONNECT_CLIENT_ID=ca_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx  # Platform secret key
```

#### 1.3 Configure OAuth Settings

1. In Stripe Dashboard → **Settings** → **Connect** → **Settings**
2. Add **Redirect URIs**:
   ```
   https://yourdomain.com/stripe/callback
   http://localhost:3000/stripe/callback  # For testing
   ```

3. Set **OAuth settings**:
   - **Brand name**: Stylora
   - **Brand icon**: Upload logo
   - **Privacy policy**: https://stylora.no/privacy
   - **Terms of service**: https://stylora.no/terms

---

### Step 2: Salon Onboarding

#### 2.1 Salon Connects Account

1. Salon logs into Stylora
2. Goes to **Settings** → **Payment** tab
3. Finds **"Stripe Terminal (Anbefalt)"** section
4. Clicks **"Koble til Stripe"** button
5. Redirected to Stripe OAuth page
6. Logs in to Stripe (or creates account)
7. Reviews permissions and clicks **"Authorize"**
8. Redirected back to Stylora
9. ✅ **Connected!**

#### 2.2 What Happens Behind the Scenes

1. **Authorization URL generated**:
   ```
   https://connect.stripe.com/oauth/authorize?
     response_type=code&
     client_id=ca_xxxxx&
     scope=read_write&
     redirect_uri=https://stylora.no/stripe/callback&
     state=<tenantId>
   ```

2. **User authorizes** on Stripe

3. **Callback received**:
   ```
   https://stylora.no/stripe/callback?
     code=ac_xxxxx&
     state=<tenantId>
   ```

4. **Token exchange**:
   ```bash
   POST https://connect.stripe.com/oauth/token
   {
     "client_secret": "sk_live_xxxxx",
     "code": "ac_xxxxx",
     "grant_type": "authorization_code"
   }
   ```

5. **Response**:
   ```json
   {
     "access_token": "sk_test_xxxxx",
     "refresh_token": "rt_xxxxx",
     "stripe_user_id": "acct_xxxxx",
     "scope": "read_write"
   }
   ```

6. **Saved to database**:
   - `stripeConnectedAccountId`: acct_xxxxx
   - `stripeAccessToken`: sk_test_xxxxx (encrypted)
   - `stripeRefreshToken`: rt_xxxxx (encrypted)
   - `stripeAccountStatus`: connected
   - `stripeConnectedAt`: 2025-01-15 10:30:00

---

## 💳 Payment Processing

### How Payments Work with Connected Accounts

#### Option 1: Direct Charges (Current Implementation)

```typescript
// Backend automatically uses Connected Account
const stripe = new Stripe(PLATFORM_SECRET_KEY, {
  stripeAccount: connectedAccountId  // Salon's account
});

const paymentIntent = await stripe.paymentIntents.create({
  amount: 50000,  // 500 NOK
  currency: 'nok',
  payment_method_types: ['card_present'],
});
```

**Result**: Money goes **directly** to salon's Stripe account → salon's bank account.

#### Option 2: Destination Charges (Future - with fees)

```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 50000,
  currency: 'nok',
  payment_method_types: ['card_present'],
  application_fee_amount: 1000,  // 10 NOK platform fee (2%)
  transfer_data: {
    destination: connectedAccountId,
  },
});
```

**Result**: 
- Platform receives: 10 NOK
- Salon receives: 490 NOK

---

## 🔧 API Endpoints

### Frontend (tRPC)

#### Get Authorization URL
```typescript
const { data } = trpc.stripeConnect.getAuthUrl.useQuery();
// Returns: { authUrl: "https://connect.stripe.com/oauth/..." }
```

#### Handle Callback
```typescript
const mutation = trpc.stripeConnect.handleCallback.useMutation();
await mutation.mutateAsync({
  code: "ac_xxxxx",
  state: "tenantId",
});
```

#### Get Connection Status
```typescript
const { data } = trpc.stripeConnect.getStatus.useQuery();
// Returns: { connected: true, accountId: "acct_xxxxx", status: "connected" }
```

#### Get Account Details
```typescript
const { data } = trpc.stripeConnect.getAccountDetails.useQuery();
// Returns: { id, email, displayName, country, currency, chargesEnabled, payoutsEnabled }
```

#### Disconnect
```typescript
const mutation = trpc.stripeConnect.disconnect.useMutation();
await mutation.mutateAsync();
```

---

## 🧪 Testing

### Test Mode

1. Use **test mode** Client ID from Stripe Dashboard
2. Set environment variables:
   ```bash
   STRIPE_CONNECT_CLIENT_ID=ca_test_xxxxx
   STRIPE_SECRET_KEY=sk_test_xxxxx
   ```

3. Connect with test Stripe account
4. Use test card readers or simulated readers

### Test Scenarios

#### ✅ Successful Connection
1. Click "Koble til Stripe"
2. Log in with test Stripe account
3. Click "Authorize"
4. Verify redirect to `/stripe/callback`
5. Verify success message
6. Verify account shown in Settings

#### ❌ Connection Cancelled
1. Click "Koble til Stripe"
2. Click "Cancel" on Stripe OAuth page
3. Verify error message shown
4. Verify can retry connection

#### 🔌 Disconnect
1. Click "Koble fra" in Settings
2. Confirm dialog
3. Verify account disconnected
4. Verify can reconnect

#### 💳 Payment with Connected Account
1. Connect Stripe account
2. Go to POS
3. Add items to cart
4. Select "Kort" payment
5. Process payment on reader
6. Verify payment goes to salon's Stripe account

---

## 🔒 Security

### Best Practices

1. **Never expose Client Secret** - Only use on backend
2. **Encrypt tokens** - Store access/refresh tokens encrypted
3. **Use HTTPS** - All OAuth redirects must use HTTPS in production
4. **Validate state parameter** - Prevent CSRF attacks
5. **Scope limitation** - Only request necessary permissions

### Token Storage

```typescript
// ❌ Bad: Store in localStorage
localStorage.setItem('stripe_token', token);

// ✅ Good: Store in database (encrypted)
await db.update(paymentSettings).set({
  stripeAccessToken: encrypt(token),  // Encrypted
  stripeRefreshToken: encrypt(refreshToken),
});
```

---

## 📊 Monitoring

### Metrics to Track

1. **Connection success rate**: % of successful OAuth flows
2. **Active connections**: Number of connected salons
3. **Payment volume**: Total processed via Connected Accounts
4. **Disconnection rate**: % of salons disconnecting

### Stripe Dashboard

Monitor in **Stripe Dashboard** → **Connect** → **Accounts**:
- Connected accounts list
- Account status (active/inactive)
- Payment volume per account
- Disputes and chargebacks

---

## 🆘 Troubleshooting

### Common Issues

#### Issue: "Stripe Connect is not configured"
**Solution**: Add `STRIPE_CONNECT_CLIENT_ID` to environment variables

#### Issue: "Invalid redirect_uri"
**Solution**: Add redirect URI to Stripe Dashboard → Settings → Connect → Settings

#### Issue: "Failed to connect to Stripe"
**Solution**: 
- Check `STRIPE_SECRET_KEY` is correct
- Verify network connectivity
- Check Stripe API status

#### Issue: Payments not going to salon account
**Solution**:
- Verify `stripeConnectedAccountId` is set
- Check `stripeAccountStatus` is "connected"
- Verify platform secret key has Connect permissions

---

## 🔄 Migration from Manual API Keys

### For Existing Salons

If salons already have manual API keys configured:

1. **Stripe Connect takes priority**:
   - System checks for Connected Account first
   - Falls back to manual API keys if not connected

2. **Migration path**:
   - Salon connects via Stripe Connect
   - Old API keys remain as fallback
   - Can remove manual keys after testing

3. **Code logic**:
   ```typescript
   if (settings.stripeConnectedAccountId && settings.stripeAccountStatus === 'connected') {
     // Use Stripe Connect
     apiKey = PLATFORM_SECRET_KEY;
     connectedAccountId = settings.stripeConnectedAccountId;
   } else {
     // Fallback to manual API key
     apiKey = settings.stripeSecretKey;
   }
   ```

---

## 📚 Resources

### Documentation
- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [OAuth for Connect](https://stripe.com/docs/connect/oauth-reference)
- [Connected Accounts](https://stripe.com/docs/connect/accounts)

### Support
- [Stripe Support](https://support.stripe.com)
- [Stripe Community](https://stripe.com/community)

---

## 🎯 Next Steps

### Phase 1: Launch (Current)
- ✅ OAuth flow implemented
- ✅ Direct charges working
- ✅ UI for connection/disconnection
- ✅ Documentation complete

### Phase 2: Enhancement (Future)
- [ ] Add application fees (platform revenue)
- [ ] Implement onboarding flow for new Stripe users
- [ ] Add webhook handling for account updates
- [ ] Build admin dashboard for monitoring connections

### Phase 3: Scale (Future)
- [ ] Multi-currency support
- [ ] Regional payment methods
- [ ] Advanced reporting
- [ ] Automated compliance checks

---

## 💡 Tips for Salons

### Getting Started
1. **Create Stripe account** (if you don't have one):
   - Go to https://stripe.com/no
   - Click "Start now"
   - Fill in business information
   - Add bank account

2. **Connect to Stylora**:
   - Settings → Payment → "Koble til Stripe"
   - One click!

3. **Order card reader**:
   - Stripe Dashboard → Terminal → Shop
   - Order BBPOS WisePOS E (~$299)
   - Ships in 5-7 days

4. **Start accepting payments**:
   - Reader arrives
   - Connect to WiFi
   - Discover in Stylora
   - Start processing!

### Best Practices
- ✅ Enable two-factor authentication on Stripe account
- ✅ Review transactions regularly in Stripe Dashboard
- ✅ Set up automatic payouts to bank account
- ✅ Keep business information up to date
- ✅ Monitor for disputes and respond quickly

---

## 📞 Support

For questions or issues:
- **Stylora Support**: support@stylora.no
- **Stripe Support**: https://support.stripe.com
- **Documentation**: This guide + Stripe docs

---

**Last Updated**: December 24, 2025
**Version**: 1.0.0
