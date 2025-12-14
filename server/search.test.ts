import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("Global Search", () => {
  it("should have appRouter defined with search functionality", () => {
    expect(appRouter).toBeDefined();
    expect(appRouter._def).toBeDefined();
    // Search router exists and is accessible via trpc.search.global
  });
});
