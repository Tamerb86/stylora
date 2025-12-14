import { describe, it, expect } from "vitest";
import { sendSMS, formatAppointmentReminder } from "./sms";

describe("SMS Settings (Per-Tenant)", () => {
  
  it("should send SMS with mock provider (no tenantId)", async () => {
    const result = await sendSMS({
      to: "+4798765432",
      message: "Test message without tenant",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(result.messageId).toContain("mock_");
  });

  it("should send SMS with tenantId parameter", async () => {
    const result = await sendSMS({
      to: "+4798765432",
      message: "Test message with tenant",
      tenantId: "test-tenant-id",
    });

    // Should succeed even if tenant doesn't exist (falls back to global settings)
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it("should reject invalid phone number format", async () => {
    const result = await sendSMS({
      to: "12345678", // Missing + prefix
      message: "Test message",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("E.164 format");
  });

  it("should format appointment reminder message correctly", () => {
    const message = formatAppointmentReminder({
      customerName: "Ola Nordmann",
      salonName: "Test Salong",
      appointmentDate: new Date("2025-12-10"),
      appointmentTime: "14:00",
      serviceName: "Herreklipp",
    });

    expect(message).toContain("Ola Nordmann");
    expect(message).toContain("Test Salong");
    expect(message).toContain("14:00");
    expect(message).toContain("Herreklipp");
    expect(message).toContain("Vi gleder oss til å se deg!");
  });

  it("should format appointment reminder without service name", () => {
    const message = formatAppointmentReminder({
      customerName: "Kari Hansen",
      salonName: "Barbershop",
      appointmentDate: new Date("2025-12-15"),
      appointmentTime: "10:30",
    });

    expect(message).toContain("Kari Hansen");
    expect(message).toContain("Barbershop");
    expect(message).toContain("10:30");
    expect(message).not.toContain("Tjeneste:");
  });
});
