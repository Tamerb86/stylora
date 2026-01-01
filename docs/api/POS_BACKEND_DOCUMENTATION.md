# POS Backend Documentation

## Overview

This document describes the Point of Sale (POS) backend implementation for in-salon sales. The POS system supports walk-in customers, appointment-linked sales, and manual payment recording (cash/card).

---

## What Was Implemented

### Database Helpers (`server/db.ts`)

**New Functions:**

1. **`createOrderWithItems(orderData, items)`**
   - Creates an order with multiple items in a single transaction
   - Ensures atomicity (all or nothing)
   - Returns `{ order, items }`

2. **`updateOrderStatus(orderId, status)`**
   - Updates order status: `"pending"` → `"completed"` → `"refunded"`
   - Returns updated order

3. **`getOrderById(orderId)`**
   - Fetches a single order by ID

4. **`getOrdersByTenant(tenantId)`**
   - Lists all orders for a tenant

5. **`getOrderItems(orderId)`**
   - Fetches all items for an order

### tRPC Router (`server/routers.ts`)

**New Router: `pos`**

Three mutations for POS operations:

1. **`pos.createOrder`** - Create order with items
2. **`pos.recordCashPayment`** - Record cash payment
3. **`pos.recordCardPayment`** - Record card payment (external terminal)

### Test Coverage (`server/pos.test.ts`)

**10 comprehensive tests:**

✅ Create order with service items  
✅ Create order with multiple items (service + product)  
✅ Create walk-in order without customer/appointment  
✅ Reject order with no items  
✅ Record cash payment and mark order completed  
✅ Reject payment with incorrect amount  
✅ Reject payment for non-existent order  
✅ Record card payment with card details  
✅ Record card payment without card details  
✅ Multi-tenant isolation (prevent cross-tenant access)

All tests pass successfully.

---

## API Reference

### 1. Create Order

**Endpoint:** `trpc.pos.createOrder.useMutation()`

**Input:**

```typescript
{
  appointmentId?: number;        // Optional: link to appointment
  customerId?: number;            // Optional: link to customer
  employeeId: number;             // Required: who processed the sale
  orderDate: string;              // Required: YYYY-MM-DD
  orderTime: string;              // Required: HH:MM
  items: Array<{
    itemType: "service" | "product";
    itemId: number;               // Service or product ID
    quantity: number;             // Default: 1
    unitPrice: number;            // Price per unit
    vatRate: number;              // VAT percentage (e.g., 25 for 25%)
  }>;                             // At least 1 item required
}
```

**Output:**

```typescript
{
  order: {
    id: number;
    tenantId: string;
    appointmentId: number | null;
    customerId: number | null;
    employeeId: number;
    orderDate: Date;
    orderTime: string;
    subtotal: string;             // Decimal string
    vatAmount: string;            // Decimal string
    totalAmount: string;          // Decimal string
    status: "pending";            // Always "pending" initially
    createdAt: Date;
    updatedAt: Date;
  };
  items: Array<{
    id: number;
    orderId: number;
    itemType: "service" | "product";
    itemId: number;
    quantity: number;
    unitPrice: string;
    vatRate: string;
    lineTotal: string;
  }>;
}
```

**Example:**

```typescript
const createOrder = trpc.pos.createOrder.useMutation();

const result = await createOrder.mutateAsync({
  employeeId: 1,
  customerId: 42,
  orderDate: "2025-12-01",
  orderTime: "14:30",
  items: [
    {
      itemType: "service",
      itemId: 5,              // Haircut service
      quantity: 1,
      unitPrice: 400,
      vatRate: 25,
    },
    {
      itemType: "product",
      itemId: 12,             // Hair gel product
      quantity: 2,
      unitPrice: 150,
      vatRate: 25,
    },
  ],
});

// result.order.totalAmount = "875.00"
// (400 + 150*2) * 1.25 = 875
```

---

### 2. Record Cash Payment

**Endpoint:** `trpc.pos.recordCashPayment.useMutation()`

**Input:**

```typescript
{
  orderId: number;              // Required: order to pay
  amount: number;               // Required: payment amount
}
```

**Output:**

```typescript
{
  payment: {
    id: number;
    tenantId: string;
    orderId: number;
    appointmentId: number | null;
    paymentMethod: "cash";
    paymentGateway: null;
    amount: string;
    currency: "NOK";
    status: "completed";
    processedBy: number;        // Employee who processed payment
    processedAt: Date;
    // Card fields are null for cash
    lastFour: null;
    cardBrand: null;
  };
  order: {
    // ... order fields
    status: "completed";        // Updated to completed
  };
}
```

**Validation:**
- Order must exist and belong to tenant
- Amount must match order total (within 0.01 tolerance)

**Example:**

```typescript
const recordCash = trpc.pos.recordCashPayment.useMutation();

const result = await recordCash.mutateAsync({
  orderId: 123,
  amount: 875.00,
});

// Order status changed to "completed"
// Payment record created with status "completed"
```

---

### 3. Record Card Payment

**Endpoint:** `trpc.pos.recordCardPayment.useMutation()`

**Input:**

```typescript
{
  orderId: number;              // Required: order to pay
  amount: number;               // Required: payment amount
  cardBrand?: string;           // Optional: "Visa", "Mastercard", etc.
  lastFour?: string;            // Optional: last 4 digits (exactly 4 chars)
}
```

**Output:**

```typescript
{
  payment: {
    id: number;
    tenantId: string;
    orderId: number;
    appointmentId: number | null;
    paymentMethod: "card";
    paymentGateway: null;       // POS terminal, not Stripe
    amount: string;
    currency: "NOK";
    status: "completed";
    processedBy: number;
    processedAt: Date;
    lastFour: string | null;
    cardBrand: string | null;
  };
  order: {
    // ... order fields
    status: "completed";
  };
}
```

**Example:**

```typescript
const recordCard = trpc.pos.recordCardPayment.useMutation();

const result = await recordCard.mutateAsync({
  orderId: 123,
  amount: 875.00,
  cardBrand: "Visa",
  lastFour: "4242",
});

// Order status changed to "completed"
// Payment record includes card details
```

---

## Frontend Integration Examples

### Example 1: Simple POS Checkout

```typescript
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export function POSCheckout({ employeeId }: { employeeId: number }) {
  const [cart, setCart] = useState<{
    items: Array<{
      itemType: "service" | "product";
      itemId: number;
      name: string;
      quantity: number;
      unitPrice: number;
    }>;
  }>({ items: [] });

  const createOrder = trpc.pos.createOrder.useMutation();
  const recordCash = trpc.pos.recordCashPayment.useMutation();
  const recordCard = trpc.pos.recordCardPayment.useMutation();

  async function handleCheckout(paymentMethod: "cash" | "card") {
    const now = new Date();
    const orderDate = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const orderTime = now.toTimeString().slice(0, 5); // HH:MM

    try {
      // Step 1: Create order
      const orderResult = await createOrder.mutateAsync({
        employeeId,
        orderDate,
        orderTime,
        items: cart.items.map((item) => ({
          itemType: item.itemType,
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          vatRate: 25, // 25% VAT
        })),
      });

      const orderId = orderResult.order.id;
      const totalAmount = Number(orderResult.order.totalAmount);

      // Step 2: Record payment
      if (paymentMethod === "cash") {
        await recordCash.mutateAsync({
          orderId,
          amount: totalAmount,
        });
      } else {
        await recordCard.mutateAsync({
          orderId,
          amount: totalAmount,
          // Optionally collect card details from terminal
        });
      }

      // Success: show receipt
      alert(`Order completed! Total: ${totalAmount} NOK`);
      setCart({ items: [] }); // Clear cart
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Checkout failed. Please try again.");
    }
  }

  return (
    <div>
      {/* Cart UI */}
      <button onClick={() => handleCheckout("cash")}>Pay Cash</button>
      <button onClick={() => handleCheckout("card")}>Pay Card</button>
    </div>
  );
}
```

---

### Example 2: Appointment Checkout

```typescript
import { trpc } from "@/lib/trpc";

export function AppointmentCheckout({
  appointmentId,
  customerId,
  employeeId,
  services,
}: {
  appointmentId: number;
  customerId: number;
  employeeId: number;
  services: Array<{ id: number; price: number }>;
}) {
  const createOrder = trpc.pos.createOrder.useMutation();
  const recordCard = trpc.pos.recordCardPayment.useMutation();

  async function handleCheckout() {
    const now = new Date();

    try {
      // Create order linked to appointment
      const orderResult = await createOrder.mutateAsync({
        appointmentId,
        customerId,
        employeeId,
        orderDate: now.toISOString().slice(0, 10),
        orderTime: now.toTimeString().slice(0, 5),
        items: services.map((service) => ({
          itemType: "service",
          itemId: service.id,
          quantity: 1,
          unitPrice: service.price,
          vatRate: 25,
        })),
      });

      // Record card payment
      await recordCard.mutateAsync({
        orderId: orderResult.order.id,
        amount: Number(orderResult.order.totalAmount),
        cardBrand: "Visa", // From terminal
        lastFour: "4242",  // From terminal
      });

      alert("Payment successful!");
    } catch (error) {
      console.error("Checkout failed:", error);
    }
  }

  return <button onClick={handleCheckout}>Complete Appointment & Pay</button>;
}
```

---

### Example 3: Walk-in Sale (No Appointment)

```typescript
import { trpc } from "@/lib/trpc";

export function WalkInSale({ employeeId }: { employeeId: number }) {
  const createOrder = trpc.pos.createOrder.useMutation();
  const recordCash = trpc.pos.recordCashPayment.useMutation();

  async function handleQuickSale(serviceId: number, price: number) {
    const now = new Date();

    try {
      // Create order without customer or appointment
      const orderResult = await createOrder.mutateAsync({
        employeeId,
        orderDate: now.toISOString().slice(0, 10),
        orderTime: now.toTimeString().slice(0, 5),
        items: [
          {
            itemType: "service",
            itemId: serviceId,
            quantity: 1,
            unitPrice: price,
            vatRate: 25,
          },
        ],
      });

      // Record cash payment
      await recordCash.mutateAsync({
        orderId: orderResult.order.id,
        amount: Number(orderResult.order.totalAmount),
      });

      alert("Walk-in sale completed!");
    } catch (error) {
      console.error("Sale failed:", error);
    }
  }

  return (
    <div>
      <button onClick={() => handleQuickSale(1, 400)}>
        Quick Haircut (400 NOK)
      </button>
    </div>
  );
}
```

---

## POS Flow Diagram

```
┌──────────────────────────────────────────────────────┐
│  Employee adds items to cart                         │
│  (services, products)                                │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  Frontend calls: pos.createOrder                     │
│  - Calculate totals (subtotal + VAT)                 │
│  - Create order (status: "pending")                  │
│  - Create order items                                │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  Customer chooses payment method                     │
│  - Cash                                              │
│  - Card (external terminal)                          │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  Frontend calls:                                     │
│  - pos.recordCashPayment (if cash)                   │
│  - pos.recordCardPayment (if card)                   │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  Backend:                                            │
│  1. Validate order exists and belongs to tenant      │
│  2. Validate payment amount matches order total      │
│  3. Create payment record (status: "completed")      │
│  4. Update order status to "completed"               │
└──────┬───────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────┐
│  Show receipt / success message                      │
│  Print receipt (optional)                            │
└──────────────────────────────────────────────────────┘
```

---

## Multi-Tenant Isolation

All POS operations enforce multi-tenant isolation:

1. **Order creation** - Includes `tenantId` from context
2. **Payment recording** - Validates order belongs to tenant
3. **Database queries** - Filter by `tenantId`

**Cross-tenant attacks are impossible** because:
- Orders are filtered by `tenantId` in payment procedures
- Database helpers include tenant boundaries
- tRPC context provides authenticated `tenantId`

---

## Error Handling

### Common Errors

**Order not found**
```typescript
{
  code: "NOT_FOUND",
  message: "Order not found"
}
```

**Payment amount mismatch**
```typescript
{
  code: "PRECONDITION_FAILED",
  message: "Payment amount (300) does not match order total (500)"
}
```

**No items in order**
```typescript
{
  code: "BAD_REQUEST",
  message: "At least one item is required"
}
```

### Frontend Error Handling

```typescript
const createOrder = trpc.pos.createOrder.useMutation({
  onError: (error) => {
    if (error.data?.code === "NOT_FOUND") {
      toast.error("Order not found");
    } else if (error.data?.code === "PRECONDITION_FAILED") {
      toast.error("Payment amount does not match order total");
    } else {
      toast.error("Checkout failed. Please try again.");
    }
  },
});
```

---

## VAT Calculation

The system calculates VAT automatically:

**Formula:**
```
subtotal = sum(item.unitPrice * item.quantity)
vatAmount = sum(item.unitPrice * item.quantity * (item.vatRate / 100))
totalAmount = subtotal + vatAmount
```

**Example:**
```
Service: 400 NOK × 1 = 400 NOK
Product: 150 NOK × 2 = 300 NOK
Subtotal: 700 NOK
VAT (25%): 175 NOK
Total: 875 NOK
```

**Note:** VAT rate is configurable per item (default 25% in Norway).

---

## Testing

### Run Tests

```bash
pnpm test server/pos.test.ts
```

### Test Coverage

- ✅ Order creation (service only, mixed items, walk-in)
- ✅ Payment recording (cash, card with/without details)
- ✅ Validation (amount mismatch, non-existent order)
- ✅ Multi-tenant isolation

### Manual Testing

1. **Create an order:**
   ```typescript
   const result = await trpc.pos.createOrder.mutateAsync({
     employeeId: 1,
     orderDate: "2025-12-01",
     orderTime: "14:30",
     items: [
       { itemType: "service", itemId: 1, quantity: 1, unitPrice: 400, vatRate: 25 },
     ],
   });
   ```

2. **Record payment:**
   ```typescript
   await trpc.pos.recordCashPayment.mutateAsync({
     orderId: result.order.id,
     amount: Number(result.order.totalAmount),
   });
   ```

3. **Verify in database:**
   ```sql
   SELECT * FROM orders WHERE id = ?;
   SELECT * FROM orderItems WHERE orderId = ?;
   SELECT * FROM payments WHERE orderId = ?;
   ```

---

## Comparison: POS vs Stripe Checkout

| Feature | POS (Manual) | Stripe Checkout |
|---------|--------------|-----------------|
| **Use case** | In-salon sales | Online prepayment |
| **Payment method** | Cash, card terminal | Stripe (card/wallet) |
| **Order creation** | `pos.createOrder` | `publicBooking.createBookingAndStartPayment` |
| **Payment recording** | Manual (cash/card) | Automatic (webhook) |
| **Payment status** | Immediately "completed" | "pending" → "completed" |
| **Gateway** | None (POS terminal) | Stripe |
| **Appointment link** | Optional | Required |
| **Customer link** | Optional | Required |

---

## Files Created/Modified

| File | Status | Purpose |
|------|--------|---------|
| `server/db.ts` | MODIFIED | Added order helpers (createOrderWithItems, updateOrderStatus, etc.) |
| `server/routers.ts` | MODIFIED | Added `pos` router with 3 mutations |
| `server/pos.test.ts` | NEW | Comprehensive test suite (10 tests) |
| `POS_BACKEND_DOCUMENTATION.md` | NEW | This documentation |

---

## Next Steps

### For Frontend Developers

1. **Build POS UI** - Create cart interface with item selection
2. **Add payment buttons** - Cash/Card payment options
3. **Implement receipt printing** - Generate PDF receipts
4. **Add order history** - List completed orders
5. **Integrate with appointments** - Link orders to appointments

### For Backend Developers

1. **Add refund support** - Implement `pos.refundOrder` mutation
2. **Add partial payments** - Support split payments
3. **Add order search** - Filter orders by date, customer, employee
4. **Add daily reports** - Generate sales summaries
5. **Add receipt templates** - Customizable receipt formats

---

## Support

**Run tests:**
```bash
pnpm test server/pos.test.ts
```

**Check order status:**
```sql
SELECT o.*, p.status as payment_status
FROM orders o
LEFT JOIN payments p ON p.orderId = o.id
WHERE o.tenantId = 'your-tenant-id'
ORDER BY o.createdAt DESC;
```

**Common issues:**
- Payment amount mismatch → Verify cart total calculation
- Order not found → Check tenantId and orderId
- Multi-tenant errors → Verify user context has correct tenantId
