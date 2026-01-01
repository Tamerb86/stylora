# PayPal Reader Connect API - Setup Guide

## ⚠️ Important: Hardware Requirement

**This integration ONLY works with PayPal Reader (new model)**

- ✅ **PayPal Reader** - Black device with PayPal logo, 3.2" touchscreen
- ❌ **iZettle Reader 2** - White/gray device with iZettle logo (S/N: 2119039988)

**Your current device (iZettle Reader 2) is NOT compatible with this integration.**

---

## 🎯 How It Works

### Architecture:

```
Stylora POS (Computer)
    ↓ (HTTPS/WebSocket)
iZettle Cloud (Reader Connect API)
    ↓ (WiFi/Cloud)
PayPal Reader (Physical Device)
```

### Flow:

1. **Setup (One-time)**:
   - Connect iZettle account via OAuth
   - Create Reader Link
   - Link PayPal Reader to your account

2. **Payment (Each transaction)**:
   - Employee presses F4 in Stylora POS
   - POS sends payment request via WebSocket
   - iZettle Cloud forwards to PayPal Reader
   - Customer pays on Reader
   - Result returns to POS automatically

---

## 📋 Setup Steps

### Step 1: Purchase PayPal Reader

**Where to buy:**
- [PayPal Reader Norway](https://www.paypal.com/no/business/pos/card-reader)
- Price: ~€29-49

**What you get:**
- PayPal Reader device
- USB-C charging cable
- Quick start guide

### Step 2: Set Up PayPal Reader

1. **Charge the Reader**:
   - Connect USB-C cable
   - Wait until fully charged (green light)

2. **Turn on Reader**:
   - Press and hold power button
   - Follow on-screen setup wizard

3. **Connect to WiFi**:
   - Settings → WiFi
   - Select your network
   - Enter password

4. **Link to iZettle Account**:
   - Open Zettle app on phone/tablet
   - Go to Settings → Card Readers
   - Tap "Add Reader"
   - Follow pairing instructions
   - Reader will show "Linked" on screen

### Step 3: Configure Stylora

1. **Connect iZettle Account** (if not already done):
   - Go to Stylora → Betalingsterminaler
   - Click "Koble til iZettle"
   - Log in with iZettle credentials
   - Authorize Stylora

2. **Create Reader Link**:
   ```
   Currently requires manual API call (UI coming soon):
   
   POST /api/trpc/izettle.createReaderLink
   Headers: Authorization: Bearer {access_token}
   Body: { "linkName": "Stylora POS" }
   
   Response: { "linkId": "...", "websocketUrl": "..." }
   ```

3. **Save Link ID**:
   - Store `linkId` in payment provider config
   - This connects Stylora to your Reader

### Step 4: Test Payment

1. **Open Stylora POS**
2. **Add test product** (1.00 kr)
3. **Press F4** (Betal med iZettle)
4. **Check PayPal Reader screen**:
   - Should show "1.00 kr"
   - Tap/insert card to pay
5. **Verify in Stylora**:
   - Payment should complete automatically
   - Receipt prints (if configured)

---

## 🔧 Technical Details

### WebSocket Connection

**Endpoint:** `wss://reader-connect.zettle.com/v1/links/{linkId}/ws`

**Authentication:** Bearer token in WebSocket headers

**Message Format:**
```json
{
  "type": "MESSAGE",
  "linkId": "009f739c-6620-43b0-978e-b245e723c57a",
  "channelId": "1",
  "messageId": "5614cb0e-4988-45c9-998a-8cd17fb8bdbb",
  "payload": {
    "type": "PAYMENT_REQUEST",
    "accessToken": "eyJ...",
    "expiresAt": 1689066916914,
    "internalTraceId": "c31f2bf0-93e6-4105-bae4-68d49cb1159e",
    "amount": 100,
    "tippingType": "DEFAULT"
  }
}
```

### Payment Flow

1. **PAYMENT_REQUEST** → Sent from Stylora
2. **PAYMENT_PROGRESS_RESPONSE** → Reader processing (multiple updates)
3. **PAYMENT_RESULT_RESPONSE** → Final result (COMPLETED/FAILED/CANCELED)

### Database Schema

**payment_providers table:**
```sql
config JSONB -- Stores: { "linkId": "..." }
```

**payments table:**
```sql
gateway_payment_id VARCHAR -- Stores internalTraceId
gateway_metadata JSONB -- Stores full payment result
```

---

## 🐛 Troubleshooting

### "PayPal Reader er ikke koblet til"

**Cause:** No linkId in payment provider config

**Fix:**
1. Create Reader Link via API
2. Update payment provider config with linkId

### "Kunne ikke koble til PayPal Reader"

**Cause:** WebSocket connection failed

**Possible reasons:**
- Reader is offline
- Reader not linked to account
- Invalid access token

**Fix:**
1. Check Reader WiFi connection
2. Verify Reader is linked in Zettle app
3. Reconnect iZettle account in Stylora

### Payment stuck on "pending"

**Cause:** WebSocket disconnected before result

**Fix:**
1. Check payment status in Zettle app
2. Manually update payment in Stylora
3. Restart WebSocket connection

### Reader not showing payment

**Cause:** Reader not connected to internet

**Fix:**
1. Check Reader WiFi settings
2. Restart Reader
3. Re-link Reader in Zettle app

---

## 📚 Resources

- [Reader Connect API Documentation](https://developer.zettle.com/docs/payment-integrations/reader-connect/overview)
- [PayPal Reader Product Page](https://www.paypal.com/no/business/pos/card-reader)
- [Zettle Developer Portal](https://developer.zettle.com/)

---

## 🔐 Security Notes

- Access tokens are encrypted in database
- WebSocket uses TLS (wss://)
- OAuth tokens refresh automatically
- Reader Link can be revoked anytime

---

## 💡 Future Improvements

- [ ] Add UI for creating Reader Links
- [ ] Add Reader status monitoring
- [ ] Add payment retry mechanism
- [ ] Add offline payment queue
- [ ] Add multi-reader support
