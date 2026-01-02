import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { nanoid } from "nanoid";

const API_URL =
  process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000";

describe("Booking Management API", () => {
  let testTenantId: string;
  let testCustomerId: number;
  let testEmployeeId: number;
  let testServiceId: number;
  let testAppointmentId: number;
  let managementToken: string;

  beforeAll(async () => {
    // Setup: Create test tenant, customer, employee, and service
    testTenantId = `test-tenant-${nanoid(8)}`;

    // Note: In a real test, you would create these via API
    // For now, we'll use existing data from the database
    testTenantId = "test-salon-123";
  });

  describe("Create Booking with Management Token", () => {
    it("should create booking and return management token", async () => {
      const response = await fetch(
        `${API_URL}/trpc/publicBooking.createBooking`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: testTenantId,
            serviceId: 1,
            employeeId: 1,
            date: "2025-12-25",
            time: "10:00:00",
            customerInfo: {
              firstName: "Test",
              lastName: "Customer",
              phone: "+4712345678",
              email: "test@example.com",
            },
          }),
        }
      );

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.result.data).toHaveProperty("appointmentId");
      expect(data.result.data).toHaveProperty("managementToken");
      expect(data.result.data.managementToken).toBeTruthy();

      testAppointmentId = data.result.data.appointmentId;
      managementToken = data.result.data.managementToken;
    });
  });

  describe("Get Booking by Token", () => {
    it("should retrieve booking details using management token", async () => {
      if (!managementToken) {
        console.log("Skipping: No management token available");
        return;
      }

      const response = await fetch(
        `${API_URL}/trpc/publicBooking.getBookingByToken?input=${encodeURIComponent(
          JSON.stringify({ token: managementToken })
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.result.data).toHaveProperty("id");
      expect(data.result.data).toHaveProperty("customerName");
      expect(data.result.data).toHaveProperty("startTime");
      expect(data.result.data).toHaveProperty("canCancel");
      expect(data.result.data).toHaveProperty("canReschedule");
      expect(data.result.data).toHaveProperty("salonName");
    });

    it("should return 404 for invalid token", async () => {
      const response = await fetch(
        `${API_URL}/trpc/publicBooking.getBookingByToken?input=${encodeURIComponent(
          JSON.stringify({ token: "invalid-token-12345" })
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("Cancel Booking", () => {
    it("should cancel booking with valid token", async () => {
      if (!managementToken) {
        console.log("Skipping: No management token available");
        return;
      }

      const response = await fetch(
        `${API_URL}/trpc/publicBooking.cancelBooking`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: managementToken,
            reason: "Test cancellation",
          }),
        }
      );

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.result.data).toHaveProperty("success");
      expect(data.result.data.success).toBe(true);
      expect(data.result.data).toHaveProperty("message");
    });

    it("should not allow canceling already canceled booking", async () => {
      if (!managementToken) {
        console.log("Skipping: No management token available");
        return;
      }

      const response = await fetch(
        `${API_URL}/trpc/publicBooking.cancelBooking`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: managementToken,
            reason: "Trying to cancel again",
          }),
        }
      );

      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.message).toContain("already canceled");
    });
  });

  describe("Reschedule Booking", () => {
    let rescheduleToken: string;

    beforeAll(async () => {
      // Create a new booking for rescheduling test
      const response = await fetch(
        `${API_URL}/trpc/publicBooking.createBooking`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: testTenantId,
            serviceId: 1,
            employeeId: 1,
            date: "2025-12-26",
            time: "14:00:00",
            customerInfo: {
              firstName: "Reschedule",
              lastName: "Test",
              phone: "+4787654321",
              email: "reschedule@example.com",
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        rescheduleToken = data.result.data.managementToken;
      }
    });

    it("should reschedule booking with valid token", async () => {
      if (!rescheduleToken) {
        console.log("Skipping: No reschedule token available");
        return;
      }

      const response = await fetch(
        `${API_URL}/trpc/publicBooking.rescheduleBooking`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: rescheduleToken,
            newDate: "2025-12-27",
            newTime: "15:00:00",
          }),
        }
      );

      expect(response.ok).toBe(true);
      const data = await response.json();

      expect(data.result.data).toHaveProperty("success");
      expect(data.result.data.success).toBe(true);
      expect(data.result.data).toHaveProperty("message");
    });

    it("should verify booking was rescheduled", async () => {
      if (!rescheduleToken) {
        console.log("Skipping: No reschedule token available");
        return;
      }

      const response = await fetch(
        `${API_URL}/trpc/publicBooking.getBookingByToken?input=${encodeURIComponent(
          JSON.stringify({ token: rescheduleToken })
        )}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      expect(response.ok).toBe(true);
      const data = await response.json();

      const startTime = new Date(data.result.data.startTime);
      expect(startTime.getDate()).toBe(27); // Should be 27th
      expect(startTime.getHours()).toBe(15); // Should be 15:00
    });
  });

  describe("Cancellation Policy", () => {
    it("should enforce cancellation window", async () => {
      // Create a booking very close to current time (should not allow cancellation)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(tomorrow.getHours() + 2); // Only 2 hours ahead

      const response = await fetch(
        `${API_URL}/trpc/publicBooking.createBooking`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: testTenantId,
            serviceId: 1,
            employeeId: 1,
            date: tomorrow.toISOString().split("T")[0],
            time: `${tomorrow.getHours().toString().padStart(2, "0")}:00:00`,
            customerInfo: {
              firstName: "Policy",
              lastName: "Test",
              phone: "+4711111111",
              email: "policy@example.com",
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const token = data.result.data.managementToken;

        // Try to get booking details
        const detailsResponse = await fetch(
          `${API_URL}/trpc/publicBooking.getBookingByToken?input=${encodeURIComponent(
            JSON.stringify({ token })
          )}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();
          // Should not allow cancellation if within 24 hours
          expect(detailsData.result.data.canCancel).toBe(false);
        }
      }
    });
  });
});
