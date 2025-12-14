import { describe, expect, it, beforeEach } from "vitest";
import { 
  createTestTenant, 
  createTestService, 
  createTestEmployee,
  createTestCustomer,
  cleanupTestTenant 
} from "./test-helpers";
import { appRouter } from "./routers";

describe("appointments.reschedule", () => {
  let testTenantId: string;
  let testCustomerId: number;
  let testEmployeeId: number;
  let testServiceId: number;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(async () => {
    // Create test tenant
    const { tenantId } = await createTestTenant();
    testTenantId = tenantId;

    // Create test customer
    const { customerId } = await createTestCustomer(testTenantId, {
      firstName: "Test",
      lastName: "Customer",
      phone: "+4712345678",
      email: "test@example.com",
    });
    testCustomerId = customerId;

    // Create test employee
    const { userId, user } = await createTestEmployee(testTenantId);
    testEmployeeId = userId;

    // Create test service
    const { serviceId } = await createTestService(testTenantId, {
      name: "Haircut",
      description: "Standard haircut",
      durationMinutes: 30,
      price: "350",
    });
    testServiceId = serviceId;

    // Create context and caller
    caller = appRouter.createCaller({
      user: {
        id: user.id,
        tenantId: user.tenantId,
        openId: user.openId,
        email: user.email,
        name: user.name,
        role: "owner",
        loginMethod: "manus",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as any,
      res: {} as any,
    });
  });

  it("should reschedule an appointment to a new date and time", async () => {
    // Create an appointment
    const createResult = await caller.appointments.create({
      customerId: testCustomerId,
      employeeId: testEmployeeId,
      appointmentDate: "2025-12-01",
      startTime: "10:00",
      endTime: "10:30",
      serviceIds: [testServiceId],
      notes: "Test appointment",
    });

    expect(createResult.success).toBe(true);
    expect(createResult.appointmentId).toBeDefined();

    // Reschedule the appointment
    const rescheduleResult = await caller.appointments.reschedule({
      id: createResult.appointmentId!,
      newDate: "2025-12-02",
      newTime: "14:00",
    });

    expect(rescheduleResult.success).toBe(true);

    // Verify the appointment was rescheduled
    const rescheduled = await caller.appointments.getById({
      id: createResult.appointmentId!,
    });

    expect(rescheduled).toBeDefined();
    // Check time was updated
    expect(rescheduled!.startTime.substring(0, 5)).toBe("14:00");
    expect(rescheduled!.endTime.substring(0, 5)).toBe("14:30"); // Duration preserved (30 min)
  });

  it("should preserve appointment duration when rescheduling", async () => {
    // Create an appointment with 60-minute duration
    const createResult = await caller.appointments.create({
      customerId: testCustomerId,
      employeeId: testEmployeeId,
      appointmentDate: "2025-12-05",
      startTime: "09:00",
      endTime: "10:00",
      serviceIds: [testServiceId],
    });

    expect(createResult.success).toBe(true);

    // Reschedule to different time
    await caller.appointments.reschedule({
      id: createResult.appointmentId!,
      newDate: "2025-12-06",
      newTime: "15:30",
    });

    // Verify duration is preserved
    const rescheduled = await caller.appointments.getById({
      id: createResult.appointmentId!,
    });

    expect(rescheduled!.startTime.substring(0, 5)).toBe("15:30");
    expect(rescheduled!.endTime.substring(0, 5)).toBe("16:30"); // 60 minutes later
  });
});
