import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { tenants, emailTemplates } from "../drizzle/schema";
import type { Context } from "./_core/context";
import { randomUUID } from "crypto";

describe("Email Templates", () => {
  let ctx: Context;
  let tenantId: string;
  let templateId: number;

  beforeAll(async () => {
    // Create a test tenant
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const timestamp = Date.now();
    tenantId = randomUUID();
    
    await db.insert(tenants).values({
      id: tenantId,
      name: "Test Salon for Email Templates",
      subdomain: `test-email-${timestamp}`,
      ownerName: "Test Owner",
      ownerEmail: "owner@test.com",
      ownerPhone: "+4712345678",
      address: "Test Address",
      city: "Oslo",
      postalCode: "0001",
      country: "Norway",
      emailVerified: true,
    });

    // Create a test email template
    const [result] = await db.insert(emailTemplates).values({
      tenantId,
      templateType: "reminder_24h",
      subject: "Test påminnelse om din time i morgen",
      bodyHtml: `
        <p>Hei {{customerName}},</p>
        <p>Dette er en påminnelse om din time:</p>
        <ul>
          <li>Tjeneste: {{serviceName}}</li>
          <li>Dato: {{appointmentDate}}</li>
          <li>Tid: {{appointmentTime}}</li>
        </ul>
      `,
      primaryColor: "#4F46E5",
      secondaryColor: "#10B981",
      isActive: true,
    });
    
    templateId = result.insertId;

    // Mock context with admin user
    ctx = {
      user: {
        id: "test-user-id",
        openId: "test-open-id",
        name: "Test Admin",
        email: "admin@test.com",
        role: "admin",
        tenantId: tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };
  });

  it("should list all email templates for tenant", async () => {
    const caller = appRouter.createCaller(ctx);
    const templates = await caller.emailTemplates.list();

    expect(templates).toBeDefined();
    expect(Array.isArray(templates)).toBe(true);
    expect(templates.length).toBeGreaterThanOrEqual(1);
    
    // Check that our test template exists
    const testTemplate = templates.find(t => t.id === templateId);
    expect(testTemplate).toBeDefined();
    expect(testTemplate?.templateType).toBe("reminder_24h");
  });

  it("should get a specific template by type", async () => {
    const caller = appRouter.createCaller(ctx);
    const template = await caller.emailTemplates.getByType({ templateType: "reminder_24h" });

    expect(template).toBeDefined();
    expect(template?.templateType).toBe("reminder_24h");
    expect(template?.subject).toBeDefined();
    expect(template?.bodyHtml).toBeDefined();
    expect(template?.tenantId).toBe(tenantId);
  });

  it("should update a template", async () => {
    const caller = appRouter.createCaller(ctx);
    
    // Update the template
    const updatedTemplate = await caller.emailTemplates.update({
      templateType: "reminder_24h",
      subject: "Updated Subject - Test",
      bodyHtml: "<p>Updated body content with {{customerName}}</p>",
      primaryColor: "#FF0000",
      secondaryColor: "#00FF00",
    });

    expect(updatedTemplate).toBeDefined();
    expect(updatedTemplate.subject).toBe("Updated Subject - Test");
    expect(updatedTemplate.bodyHtml).toBe("<p>Updated body content with {{customerName}}</p>");
    expect(updatedTemplate.primaryColor).toBe("#FF0000");
    expect(updatedTemplate.secondaryColor).toBe("#00FF00");
  });

  it("should reset template to default", async () => {
    const caller = appRouter.createCaller(ctx);
    
    // Reset the template
    const resetTemplate = await caller.emailTemplates.resetToDefault({ templateType: "reminder_24h" });

    expect(resetTemplate).toBeDefined();
    expect(resetTemplate.subject.toLowerCase()).toContain("påminnelse");
    expect(resetTemplate.bodyHtml).toContain("{{customerName}}");
  });

  it("should handle template variables correctly", async () => {
    const caller = appRouter.createCaller(ctx);
    const template = await caller.emailTemplates.getByType({ templateType: "reminder_24h" });

    expect(template).toBeDefined();
    // Check that template contains expected variables
    expect(template?.bodyHtml).toContain("{{customerName}}");
  });
});
