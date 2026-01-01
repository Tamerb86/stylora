# Public Booking with Payment Integration

## Overview

This document explains how to integrate the public booking flow with Stripe payment checkout. The system provides a combined endpoint that creates an appointment and immediately starts the payment process in a single API call.

---

## What Was Implemented

### Backend Changes

**File:** `server/routers.ts`

Added new mutation: `publicBooking.createBookingAndStartPayment`

**What it does:**
1. Creates the appointment (status: `"pending"`)
2. Creates or reuses customer based on phone number
3. Creates a Stripe Checkout Session
4. Stores payment record (status: `"pending"`)
5. Returns checkout URL for frontend redirect

**When payment completes:**
- Stripe webhook updates payment status to `"completed"`
- Webhook updates appointment status to `"confirmed"`

### Test Coverage

**File:** `server/publicBookingPayment.test.ts` (NEW)

5 comprehensive tests covering:
1. ✅ Create booking and return checkout URL
2. ✅ Create new customer if phone doesn't exist
3. ✅ Reuse existing customer if phone matches
4. ✅ Reject booking with invalid service
5. ✅ Calculate correct end time based on service duration

All tests pass successfully.

---

## API Reference

### Endpoint

```typescript
trpc.publicBooking.createBookingAndStartPayment.useMutation()
```

### Input Schema

```typescript
{
  tenantId: string;           // Salon/shop identifier
  serviceId: number;          // Service to book
  employeeId: number;         // Employee/barber to book with
  date: string;               // Appointment date (YYYY-MM-DD)
  time: string;               // Start time (HH:MM)
  customerInfo: {
    firstName: string;        // Customer first name
    lastName?: string;        // Customer last name (optional)
    phone: string;            // Customer phone (used for lookup/creation)
    email?: string;           // Customer email (optional)
  };
  successUrl: string;         // URL to redirect after successful payment
  cancelUrl: string;          // URL to redirect if payment is canceled
}
```

### Response

```typescript
{
  success: boolean;           // Always true on success
  appointmentId: number;      // Created appointment ID
  customerId: number;         // Customer ID (created or existing)
  checkoutUrl: string;        // Stripe Checkout URL (redirect here)
  paymentId: number;          // Payment record ID
  sessionId: string;          // Stripe session ID (cs_xxx)
}
```

---

## Frontend Integration

### Option A: Combined Endpoint (Recommended)

Use the new `createBookingAndStartPayment` mutation for a streamlined flow.

#### React Example

```typescript
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export function BookingForm({ tenantId }: { tenantId: string }) {
  const [formData, setFormData] = useState({
    serviceId: 0,
    employeeId: 0,
    date: "",
    time: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });

  const createBookingAndPay = trpc.publicBooking.createBookingAndStartPayment.useMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const origin = window.location.origin;

    try {
      const result = await createBookingAndPay.mutateAsync({
        tenantId,
        serviceId: formData.serviceId,
        employeeId: formData.employeeId,
        date: formData.date,
        time: formData.time,
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
        },
        successUrl: `${origin}/booking/success?appointmentId=${result.appointmentId}`,
        cancelUrl: `${origin}/booking/cancel`,
      });

      // Redirect to Stripe Checkout
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (error) {
      console.error("Booking failed:", error);
      // Show error message to user
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={createBookingAndPay.isPending}>
        {createBookingAndPay.isPending ? "Processing..." : "Book and Pay"}
      </button>
    </form>
  );
}
```

#### Success Page Example

```typescript
// pages/booking/success.tsx
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc";

export function BookingSuccess() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");

  // Optionally fetch appointment details
  const { data: appointment } = trpc.appointments.getById.useQuery(
    { id: Number(appointmentId) },
    { enabled: !!appointmentId }
  );

  return (
    <div>
      <h1>Booking Confirmed!</h1>
      <p>Your appointment has been booked and payment confirmed.</p>
      {appointment && (
        <div>
          <p>Date: {appointment.appointmentDate}</p>
          <p>Time: {appointment.startTime}</p>
          <p>Status: {appointment.status}</p>
        </div>
      )}
    </div>
  );
}
```

#### Cancel Page Example

```typescript
// pages/booking/cancel.tsx
export function BookingCancel() {
  return (
    <div>
      <h1>Booking Canceled</h1>
      <p>Your payment was canceled. The appointment was not confirmed.</p>
      <a href="/booking">Try again</a>
    </div>
  );
}
```

---

### Option B: Two-Step Flow (Alternative)

If you need more control, you can call the endpoints separately.

```typescript
import { trpc } from "@/lib/trpc";

export function BookingFormTwoStep({ tenantId }: { tenantId: string }) {
  const createBooking = trpc.publicBooking.createBooking.useMutation();
  const createCheckout = trpc.payments.createCheckoutSession.useMutation();

  async function handleSubmit(formData: any) {
    try {
      // Step 1: Create booking
      const bookingResult = await createBooking.mutateAsync({
        tenantId,
        serviceId: formData.serviceId,
        employeeId: formData.employeeId,
        date: formData.date,
        time: formData.time,
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email,
        },
      });

      const appointmentId = bookingResult.appointmentId;

      // Step 2: Create checkout session
      const origin = window.location.origin;
      const checkout = await createCheckout.mutateAsync({
        appointmentId,
        successUrl: `${origin}/booking/success?appointmentId=${appointmentId}`,
        cancelUrl: `${origin}/booking/cancel`,
      });

      // Redirect to Stripe Checkout
      window.location.href = checkout.url;
    } catch (error) {
      console.error("Booking failed:", error);
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(formData); }}>
      {/* Form fields */}
      <button type="submit">Book and Pay</button>
    </form>
  );
}
```

**Note:** Option A is recommended because it's simpler and atomic (single transaction).

---

## Payment Flow Diagram

```
┌──────────────┐
│   Customer   │
│  fills form  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  Frontend calls:                                     │
│  createBookingAndStartPayment                        │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  Backend:                                            │
│  1. Create appointment (status: "pending")           │
│  2. Create/reuse customer                            │
│  3. Create Stripe Checkout Session                   │
│  4. Create payment record (status: "pending")        │
│  5. Return checkoutUrl                               │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  Frontend redirects to Stripe Checkout               │
│  window.location.href = result.checkoutUrl           │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  Customer completes payment on Stripe                │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  Stripe sends webhook:                               │
│  checkout.session.completed                          │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  Webhook handler:                                    │
│  1. Verify signature                                 │
│  2. Update payment (status: "completed")             │
│  3. Update appointment (status: "confirmed")         │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  Stripe redirects customer to successUrl             │
│  /booking/success?appointmentId=123                  │
└──────────────────────────────────────────────────────┘
```

---

## Multi-Tenant Isolation

The endpoint enforces multi-tenant isolation at multiple levels:

1. **Customer lookup** - Filtered by `tenantId` + `phone`
2. **Appointment creation** - Includes `tenantId`
3. **Payment record** - Includes `tenantId`
4. **Stripe metadata** - Includes `tenantId` for webhook verification

**Cross-tenant attacks are impossible** because:
- Each tenant's data is isolated by `tenantId`
- Webhook verifies `tenantId` matches before updating records
- Database queries enforce tenant boundaries

---

## Error Handling

### Common Errors

**Service not found**
```typescript
{
  code: "NOT_FOUND",
  message: "Service not found"
}
```

**Database unavailable**
```typescript
{
  code: "INTERNAL_SERVER_ERROR",
  message: "Database not available"
}
```

**Invalid service price**
```typescript
{
  code: "PRECONDITION_FAILED",
  message: "Service price must be greater than zero"
}
```

### Frontend Error Handling

```typescript
const createBookingAndPay = trpc.publicBooking.createBookingAndStartPayment.useMutation({
  onError: (error) => {
    if (error.data?.code === "NOT_FOUND") {
      toast.error("Service not found. Please select a valid service.");
    } else if (error.data?.code === "PRECONDITION_FAILED") {
      toast.error("Invalid service configuration. Please contact support.");
    } else {
      toast.error("Booking failed. Please try again.");
    }
  },
});
```

---

## Testing

### Run Tests

```bash
pnpm test server/publicBookingPayment.test.ts
```

### Test Coverage

- ✅ Booking creation with payment
- ✅ Customer creation (new phone)
- ✅ Customer reuse (existing phone)
- ✅ Invalid service rejection
- ✅ End time calculation

### Manual Testing

1. **Create a booking:**
   ```typescript
   const result = await trpc.publicBooking.createBookingAndStartPayment.mutateAsync({
     tenantId: "your-tenant-id",
     serviceId: 1,
     employeeId: 1,
     date: "2025-12-25",
     time: "14:00",
     customerInfo: {
       firstName: "Test",
       lastName: "Customer",
       phone: "+4712345678",
       email: "test@example.com",
     },
     successUrl: "http://localhost:3000/booking/success",
     cancelUrl: "http://localhost:3000/booking/cancel",
   });
   ```

2. **Verify response:**
   - `appointmentId` is a positive number
   - `checkoutUrl` contains `checkout.stripe.com`
   - `sessionId` starts with `cs_`

3. **Visit checkout URL:**
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

4. **Verify webhook:**
   - Check server logs for `[Stripe Webhook]` entries
   - Verify payment status changed to `"completed"`
   - Verify appointment status changed to `"confirmed"`

---

## Comparison: Option A vs Option B

| Feature | Option A (Combined) | Option B (Two-Step) |
|---------|---------------------|---------------------|
| **API calls** | 1 mutation | 2 mutations |
| **Atomicity** | ✅ Single transaction | ⚠️ Two separate calls |
| **Error handling** | ✅ Simpler | ⚠️ More complex |
| **Code complexity** | ✅ Less code | ⚠️ More code |
| **Flexibility** | ⚠️ Less flexible | ✅ More control |
| **Recommended** | ✅ Yes | ⚠️ Only if needed |

**Recommendation:** Use Option A (combined endpoint) unless you have specific requirements for separating booking and payment logic.

---

## Backward Compatibility

The original `publicBooking.createBooking` endpoint **still works** without payment.

**Use cases:**
- Tenants who don't require prepayment
- Walk-in appointments booked by staff
- Free services or consultations

**Example:**
```typescript
// Original endpoint (no payment)
const result = await trpc.publicBooking.createBooking.mutateAsync({
  tenantId,
  serviceId,
  employeeId,
  date,
  time,
  customerInfo: { firstName, lastName, phone, email },
});

// Appointment created with status "pending"
// No payment required
```

---

## Next Steps

### For Frontend Developers

1. **Update booking form** - Use `createBookingAndStartPayment` mutation
2. **Create success page** - Show booking confirmation at `/booking/success`
3. **Create cancel page** - Handle payment cancellation at `/booking/cancel`
4. **Add loading states** - Show spinner while processing
5. **Add error handling** - Display user-friendly error messages

### For Backend Developers

1. **Monitor webhook logs** - Check `[Stripe Webhook]` entries
2. **Handle edge cases** - Duplicate payments, expired sessions
3. **Add email notifications** - Send confirmation emails after payment
4. **Implement refunds** - Add refund logic for cancellations

---

## Files Created/Modified

| File | Status | Purpose |
|------|--------|---------|
| `server/routers.ts` | MODIFIED | Added `createBookingAndStartPayment` mutation |
| `server/publicBookingPayment.test.ts` | NEW | Comprehensive test suite (5 tests) |
| `PUBLIC_BOOKING_PAYMENT_INTEGRATION.md` | NEW | This documentation |

---

## Support

**Stripe Dashboard:** https://dashboard.stripe.com  
**Webhook Configuration:** See `STRIPE_WEBHOOK_SETUP.md`  
**Payment System Docs:** See `STRIPE_CHECKOUT_INTEGRATION.md`  

**Test the endpoint:**
```bash
pnpm test server/publicBookingPayment.test.ts
```

**Check server logs:**
```bash
# Look for these entries:
[Stripe Webhook] Verified event: checkout.session.completed
[Stripe Webhook] Updated payment X to completed
[Stripe Webhook] Updated appointment Y to confirmed
```
