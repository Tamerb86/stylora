# Time Clock System Audit - Findings Report

**Date:** December 7, 2025  
**System:** Stylora Time Clock (Timeregistrering)  
**Status:** 🔍 **Under Investigation**

---

## Executive Summary

Comprehensive audit of the Time Clock system to identify and fix all errors reported by the user.

---

## 1. Database Schema Review

### ✅ Timesheets Table Structure
```sql
CREATE TABLE timesheets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenantId VARCHAR(36) NOT NULL,
  employeeId INT NOT NULL,
  clockIn TIMESTAMP NOT NULL,
  clockOut TIMESTAMP NULL,
  totalHours DECIMAL(5,2) NULL,
  workDate DATE NOT NULL,
  notes TEXT NULL,
  editReason TEXT NULL,
  editedBy INT NULL,
  editedAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

**Status:** ✅ Schema is correct

**Indexes:**
- `tenant_employee_timesheet_idx` on (tenantId, employeeId, workDate)
- `timesheet_work_date_idx` on (workDate)

---

## 2. Current Data Analysis

### Database Query Results:
- **Total Records:** 3 timesheets
- **Active Shifts:** Need to verify
- **Employees with PIN:** 5 employees

### Data Sample:
```
Records found but need detailed analysis of:
- Clock-in times
- Clock-out times
- Total hours calculation
- Work dates
- Employee associations
```

---

## 3. Backend Code Review

### ✅ ClockIn Procedure (`server/routers.ts:2329`)
```typescript
clockIn: publicProcedure
  .input(z.object({
    pin: z.string().length(4).or(z.string().length(5)).or(z.string().length(6)),
    tenantId: z.string(),
  }))
```

**Logic:**
1. Validates PIN and finds employee
2. Checks for existing open shifts (ANY date, not just today)
3. Creates new timesheet with `CURDATE()` for workDate
4. Uses `NOW()` for clockIn timestamp

**Potential Issues:**
- ⚠️ Uses `CURDATE()` for workDate which may have timezone issues
- ⚠️ No validation of tenant existence
- ⚠️ Error message in Norwegian only

---

### ✅ ClockOut Procedure (`server/routers.ts:2387`)
```typescript
clockOut: publicProcedure
  .input(z.object({
    pin: z.string().length(4).or(z.string().length(5)).or(z.string().length(6)),
    tenantId: z.string(),
  }))
```

**Logic:**
1. Validates PIN and finds employee
2. Finds active shift (ANY date - allows late clock-out)
3. Updates with `NOW()` for clockOut
4. Calculates totalHours using `TIMESTAMPDIFF(SECOND, clockIn, NOW()) / 3600`

**Calculation Method:**
```sql
UPDATE timesheets 
SET clockOut = NOW(),
    totalHours = TIMESTAMPDIFF(SECOND, clockIn, NOW()) / 3600
WHERE id = ?
```

**Potential Issues:**
- ⚠️ Time calculation uses SQL TIMESTAMPDIFF - should be accurate
- ⚠️ No validation of reasonable shift length (e.g., > 24 hours)
- ⚠️ Returns totalHours as float which may have precision issues

---

### ✅ GetActiveEmployees Procedure (`server/routers.ts:2530`)
```typescript
getActiveEmployees: publicProcedure
  .input(z.object({
    tenantId: z.string(),
  }))
```

**Logic:**
1. Finds all shifts where `clockOut IS NULL`
2. Joins with users table to get employee names
3. Returns: id, employeeId, employeeName, clockIn, workDate

**Potential Issues:**
- ✅ Looks correct - returns all active shifts regardless of date

---

## 4. Frontend Code Review

### TimeClock Component (`client/src/pages/TimeClock.tsx`)

**Features:**
- PIN entry with numeric keypad
- Clock-in/out buttons
- Active employees display
- Fullscreen toggle
- Physical keyboard support

**Active Employees Display:**
```typescript
const { data: activeEmployees } = trpc.employee.getActiveEmployees.useQuery(
  { tenantId: tenantId || "" },
  { 
    enabled: !!tenantId,
    refetchInterval: 30000, // Refresh every 30 seconds
  }
);
```

**Time Calculation (Frontend):**
```typescript
const elapsedHours = ((new Date().getTime() - new Date(emp.clockIn).getTime()) / (1000 * 60 * 60)).toFixed(1);
```

**Potential Issues:**
- ⚠️ Frontend calculates elapsed time separately from backend
- ⚠️ May show different values than backend calculation
- ⚠️ Timezone handling in `new Date(emp.clockIn)` may be incorrect

---

## 5. Identified Issues

### 🔴 **Issue #1: Timezone Inconsistency**
**Severity:** HIGH  
**Location:** Backend clockIn/clockOut procedures

**Problem:**
- `workDate` uses `CURDATE()` which returns server date
- `clockIn/clockOut` use `NOW()` which returns server timestamp
- If server timezone != user timezone, dates may not match

**Example:**
- User clocks in at 23:30 Oslo time (UTC+1)
- Server in UTC records: workDate=2025-12-08, clockIn=2025-12-07 22:30:00
- Date mismatch causes issues

**Impact:**
- Active employees may not show correctly
- Clock-out may fail to find active shift
- Reports show wrong dates

---

### 🔴 **Issue #2: Time Calculation Precision**
**Severity:** MEDIUM  
**Location:** Backend clockOut procedure

**Problem:**
- Uses `TIMESTAMPDIFF(SECOND, clockIn, NOW()) / 3600`
- Result is decimal hours (e.g., 8.5 for 8h 30min)
- Stored as DECIMAL(5,2) - only 2 decimal places
- Frontend shows different calculation

**Example:**
- Clock in: 08:00:00
- Clock out: 16:30:00
- Backend: 8.50 hours
- Frontend: 8.5 hours (recalculated)
- May show different values during active shift

**Impact:**
- Confusion between backend and frontend values
- Rounding errors in reports
- Inconsistent display

---

### 🟡 **Issue #3: No Shift Length Validation**
**Severity:** LOW  
**Location:** Backend clockOut procedure

**Problem:**
- No validation of reasonable shift length
- Employee can clock in Monday, clock out Friday = 96 hours
- No warning for extremely long shifts

**Impact:**
- Unrealistic timesheet data
- Payroll errors
- No protection against forgotten clock-outs

---

### 🟡 **Issue #4: Active Employees Display Timing**
**Severity:** LOW  
**Location:** Frontend TimeClock component

**Problem:**
- Frontend calculates elapsed time on every render
- Uses JavaScript Date which may have timezone issues
- Shows "0.1t" for very short shifts (< 6 minutes)

**Impact:**
- Confusing display for short shifts
- Potential timezone display issues

---

### 🟡 **Issue #5: No Error Recovery**
**Severity:** MEDIUM  
**Location:** Frontend TimeClock component

**Problem:**
- If clock-in fails (network error), no retry mechanism
- If clock-out fails, employee stuck in "clocked in" state
- No manual override for admins

**Impact:**
- Employees cannot clock in/out during network issues
- Requires database manual fix

---

## 6. Testing Plan

### Test Scenarios:

1. **Clock-In Test**
   - [ ] Clock in with valid PIN
   - [ ] Try to clock in twice (should fail)
   - [ ] Clock in with invalid PIN (should fail)
   - [ ] Clock in with non-existent tenant (should fail)

2. **Clock-Out Test**
   - [ ] Clock out after clock-in (same day)
   - [ ] Clock out next day (forgot yesterday)
   - [ ] Try to clock out without clock-in (should fail)
   - [ ] Verify totalHours calculation accuracy

3. **Active Employees Test**
   - [ ] Verify active employees show correctly
   - [ ] Verify elapsed time calculation
   - [ ] Verify auto-refresh works (30 seconds)
   - [ ] Verify display after clock-out (should disappear)

4. **Timezone Test**
   - [ ] Clock in at 23:30 (near midnight)
   - [ ] Verify workDate is correct
   - [ ] Clock out next day at 00:30
   - [ ] Verify totalHours is 1 hour (not 25 hours)

5. **Edge Cases**
   - [ ] Very short shift (< 1 minute)
   - [ ] Very long shift (> 12 hours)
   - [ ] Multiple employees same tenant
   - [ ] Employee with no PIN

---

## 7. Recommended Fixes

### Fix #1: Timezone Handling
**Priority:** HIGH

**Solution:**
1. Store timezone in tenant settings (already exists: `timezone` field)
2. Use tenant timezone for `workDate` calculation
3. Convert `clockIn/clockOut` to tenant timezone for display
4. Keep database timestamps in UTC

**Implementation:**
```typescript
// Get tenant timezone
const tenant = await db.getTenantById(input.tenantId);
const timezone = tenant?.timezone || "Europe/Oslo";

// Calculate workDate in tenant timezone
const workDate = new Date().toLocaleDateString('sv-SE', { timeZone: timezone });

// Insert with proper workDate
await dbInstance.execute(
  sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, workDate) 
      VALUES (${input.tenantId}, ${emp.id}, NOW(), ${workDate})`
);
```

---

### Fix #2: Consistent Time Display
**Priority:** MEDIUM

**Solution:**
1. Use same calculation method in frontend and backend
2. Format hours as "X timer Y minutter" instead of decimal
3. Show both formats: "8 timer 30 minutter (8.50t)"

**Implementation:**
```typescript
function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h} timer ${m} minutter`;
}
```

---

### Fix #3: Shift Length Validation
**Priority:** LOW

**Solution:**
1. Add warning if shift > 12 hours
2. Add confirmation dialog for shifts > 16 hours
3. Add admin setting for max shift length

---

### Fix #4: Error Recovery
**Priority:** MEDIUM

**Solution:**
1. Add retry logic for failed clock-in/out
2. Add admin page to manually fix stuck shifts
3. Add "Force Clock-Out" button for admins

---

## 8. Next Steps

1. ✅ Complete database analysis
2. ✅ Review backend code
3. ✅ Review frontend code
4. ⏳ Run test scenarios
5. ⏳ Implement fixes
6. ⏳ Write unit tests
7. ⏳ Deploy and verify

---

**Status:** 🔍 **Audit in Progress**  
**Next Action:** Run test scenarios to confirm issues
