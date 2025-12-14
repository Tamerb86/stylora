# Calendar Appointment Display Fix

## Problem
Appointments were not displaying in the calendar despite existing in the database.

## Root Cause
**Timezone issue with Date object creation**

When creating Date objects in JavaScript without setting the time to midnight (00:00:00), the dates were being sent to the server with the current time component. This caused timezone conversion issues:

- Frontend creates: `new Date()` → includes current time (e.g., 14:23:45)
- Server receives and converts to UTC → date shifts by timezone offset
- Example: `2025-11-05 14:23:45 GMT+1` becomes `2025-11-05 13:23:45 UTC`
- When formatting to YYYY-MM-DD, this could shift to `2025-11-04` in some cases

## Solution
Set all Date objects to midnight local time before sending to server:

```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);  // Set to midnight
today.setDate(today.getDate() - 30);

const futureDate = new Date();
futureDate.setHours(0, 0, 0, 0);  // Set to midnight
futureDate.setDate(futureDate.getDate() + 60);
```

## Files Changed
- `client/src/pages/Appointments.tsx` - Fixed date creation in query parameters

## Additional Changes
- Extended lookback period from 7 days to 30 days for better appointment visibility
- Removed debug logging from production code

## Testing
Verified that:
1. Appointments now display correctly in the calendar
2. Date range query works as expected
3. No timezone-related off-by-one errors
