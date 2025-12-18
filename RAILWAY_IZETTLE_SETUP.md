# Railway iZettle Environment Setup

## Required Environment Variables

Add these environment variables to **both** Railway environments (staging and production):

### Staging Environment (barbertime-production-0623)

```
IZETTLE_CLIENT_ID=3209d1a8-4c06-48bd-8c88-f5bc0bf473bc
IZETTLE_CLIENT_SECRET=IZSEC422729de-4f98-476e-914f-0419447026c7
IZETTLE_REDIRECT_URI=https://barbertime-production-0623.up.railway.app/api/izettle/callback
```

### Production Environment (barbertime-production-5d35)

```
IZETTLE_CLIENT_ID=3209d1a8-4c06-48bd-8c88-f5bc0bf473bc
IZETTLE_CLIENT_SECRET=IZSEC422729de-4f98-476e-914f-0419447026c7
IZETTLE_REDIRECT_URI=https://barbertime-production-5d35.up.railway.app/api/izettle/callback
```

## Steps to Add Environment Variables

1. Go to Railway dashboard: https://railway.app
2. Select your project
3. Click on the **staging** service
4. Go to **Variables** tab
5. Add the three environment variables above (use staging URLs)
6. Click **Deploy** to apply changes
7. Repeat steps 3-6 for the **production** service (use production URLs)

## Testing the Integration

After deploying:

1. **Test OAuth Flow:**
   - Log in to a salon account
   - Go to Settings → Betalingsleverandører
   - Click "Koble til iZettle"
   - Complete OAuth authorization
   - Verify connection status shows "Tilkoblet"

2. **Test Payment Processing:**
   - Go to POS (Salg)
   - Add products/services to cart
   - Click "Betal med iZettle"
   - Complete test payment
   - Verify payment is recorded in order history

## Troubleshooting

### OAuth Callback Errors
- Verify IZETTLE_REDIRECT_URI matches exactly in Railway and iZettle developer portal
- Check that the callback URL is whitelisted in iZettle app settings

### Payment Processing Errors
- Ensure OAuth tokens are stored correctly in database
- Check that access token hasn't expired (refresh automatically handled)
- Verify iZettle account has necessary permissions

### Database Migration
If the `payment_providers` table doesn't exist:
```bash
pnpm db:push
```

## iZettle Developer Portal

- Dashboard: https://developer.zettle.com/
- Documentation: https://developer.zettle.com/docs/api/oauth/overview
- Test credentials: Use sandbox mode for testing

## Multi-Tenant Architecture

Each salon connects their own iZettle account:
- OAuth tokens stored per tenant in `payment_providers` table
- Payments go directly to salon's iZettle account
- No platform fees on payments (included in SaaS subscription)

## Security Notes

- OAuth tokens are encrypted in database
- Refresh tokens automatically renew access tokens
- All API calls use HTTPS
- Rate limiting applied to payment endpoints
