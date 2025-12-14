import { describe, it, expect } from "vitest";

describe("POS sendReceiptEmail mutation", () => {
  it("should have pos router in appRouter", async () => {
    const { appRouter } = await import("./routers");
    
    // Check that appRouter exists
    expect(appRouter).toBeDefined();
    
    // Get the router definition
    const routerDef = appRouter._def;
    expect(routerDef).toBeDefined();
    
    // Check that pos router exists
    expect(routerDef.record.pos).toBeDefined();
    
    console.log("✅ pos router exists in appRouter");
  });

  it("should have sendReceiptEmail mutation in pos router", async () => {
    const { appRouter } = await import("./routers");
    
    const posRouter = appRouter._def.record.pos;
    expect(posRouter).toBeDefined();
    
    // Log the structure to understand it better
    console.log("pos router type:", posRouter._type);
    console.log("pos router _def keys:", Object.keys(posRouter._def || {}));
    
    // Access procedures correctly based on tRPC structure
    const posDef = posRouter._def;
    
    // Try different possible locations
    const procedures = posDef.record || posDef.procedures || {};
    
    console.log("Available pos procedures:", Object.keys(procedures));
    
    // Check that sendReceiptEmail exists
    expect(procedures.sendReceiptEmail).toBeDefined();
    
    console.log("✅ sendReceiptEmail mutation exists in pos router");
  });
});
