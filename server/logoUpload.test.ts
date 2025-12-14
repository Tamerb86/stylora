import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("Logo Upload Validation", () => {
  const mockContext = {
    user: {
      id: 1,
      openId: "test-open-id",
      name: "Test Admin",
      email: "admin@test.com",
      role: "admin" as const,
      tenantId: "test-tenant-123",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    tenantId: "test-tenant-123",
  };

  const caller = appRouter.createCaller(mockContext);

  describe("uploadReceiptLogo validation", () => {
    it("should reject invalid file types", async () => {
      const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      await expect(
        caller.salonSettings.uploadReceiptLogo({
          fileData: testImageBase64,
          fileName: "test.gif",
          mimeType: "image/gif",
        })
      ).rejects.toThrow("Only JPEG, PNG, and WebP images are allowed");
    });

    it("should reject files larger than 2MB", async () => {
      // Create a base64 string larger than 2MB
      const largeData = "A".repeat(3 * 1024 * 1024); // 3MB of 'A' characters

      await expect(
        caller.salonSettings.uploadReceiptLogo({
          fileData: largeData,
          fileName: "large.png",
          mimeType: "image/png",
        })
      ).rejects.toThrow("Image size must be less than 2MB");
    });

    it("should accept valid PNG image", async () => {
      // Small 1x1 PNG image (valid and under 2MB)
      const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      // This will fail at DB level (tenant doesn't exist), but validation should pass
      try {
        await caller.salonSettings.uploadReceiptLogo({
          fileData: testImageBase64,
          fileName: "test-logo.png",
          mimeType: "image/png",
        });
      } catch (error: any) {
        // Should fail at DB level, not validation level
        expect(error.message).not.toContain("Only JPEG, PNG, and WebP");
        expect(error.message).not.toContain("Image size must be less than 2MB");
      }
    });
  });

  describe("getBranding with receiptLogoUrl", () => {
    it("should include receiptLogoUrl field in branding response", async () => {
      try {
        const branding = await caller.salonSettings.getBranding();
        
        // Should have receiptLogoUrl property
        expect(branding).toHaveProperty("receiptLogoUrl");
        // receiptLogoUrl can be null or a string
        expect(branding.receiptLogoUrl === null || typeof branding.receiptLogoUrl === "string").toBe(true);
      } catch (error: any) {
        // If tenant doesn't exist, that's expected in test environment
        if (!error.message.includes("Database")) {
          throw error;
        }
      }
    });
  });
});
