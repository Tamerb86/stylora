import { describe, it, expect } from "vitest";
import { getSupabaseAdmin } from "../_core/supabase";

describe("Supabase Connection", () => {
  it("should connect to Supabase with valid credentials", async () => {
    const supabase = getSupabaseAdmin();

    // Test connection by trying to get auth users (should not throw)
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });

    // Should not have an error
    expect(error).toBeNull();

    // Data should be defined (even if empty)
    expect(data).toBeDefined();
    expect(data.users).toBeDefined();
    expect(Array.isArray(data.users)).toBe(true);
  }, 10000); // 10 second timeout for network request

  it("should have correct environment variables", () => {
    expect(process.env.SUPABASE_URL).toBeDefined();
    expect(process.env.SUPABASE_URL).toContain("supabase.co");
    expect(process.env.SUPABASE_ANON_KEY).toBeDefined();
    expect(process.env.SUPABASE_SERVICE_KEY).toBeDefined();
    expect(process.env.SUPABASE_SERVICE_KEY).toContain("sb_secret_");
  });
});
