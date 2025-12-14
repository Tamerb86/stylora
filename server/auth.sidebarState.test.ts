import { beforeAll, describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Sidebar State Persistence", () => {
  let ctx: Context;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    // Mock context with authenticated user
    ctx = {
      user: {
        id: 1,
        tenantId: "test-tenant-id",
        openId: "test-open-id",
        email: "test@example.com",
        name: "Test User",
        role: "owner",
        sidebarOpen: false,
      },
      req: {} as any,
      res: {} as any,
    };
    caller = appRouter.createCaller(ctx);
  });

  it("should update sidebar state to open", async () => {
    const result = await caller.auth.updateSidebarState({ sidebarOpen: true });
    expect(result.success).toBe(true);
    expect(result.sidebarOpen).toBe(true);
  });

  it("should update sidebar state to closed", async () => {
    const result = await caller.auth.updateSidebarState({ sidebarOpen: false });
    expect(result.success).toBe(true);
    expect(result.sidebarOpen).toBe(false);
  });

  it("should require authentication", async () => {
    const unauthCtx = {
      user: null,
      req: {} as any,
      res: {} as any,
    };
    const unauthCaller = appRouter.createCaller(unauthCtx);

    await expect(
      unauthCaller.auth.updateSidebarState({ sidebarOpen: true })
    ).rejects.toThrow();
  });
});
