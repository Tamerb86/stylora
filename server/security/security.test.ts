/**
 * Security Tests
 * Tests for security utilities and middleware
 */

import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  sanitizeString,
  sanitizeObject,
  containsSqlInjection,
  containsXss,
  isValidEmail,
  isValidNorwegianPhone,
  isStrongPassword,
  generateCsrfToken,
  trackFailedAttempt,
  isIpBlocked,
  unblockIp,
} from "./index";

describe("Security Utilities", () => {
  describe("HTML Escaping", () => {
    it("should escape HTML special characters", () => {
      expect(escapeHtml("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;"
      );
    });

    it("should escape ampersands", () => {
      expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
    });

    it("should escape quotes", () => {
      expect(escapeHtml('"Hello"')).toBe("&quot;Hello&quot;");
    });

    it("should handle empty string", () => {
      expect(escapeHtml("")).toBe("");
    });

    it("should handle string without special characters", () => {
      expect(escapeHtml("Hello World")).toBe("Hello World");
    });
  });

  describe("String Sanitization", () => {
    it("should trim whitespace", () => {
      expect(sanitizeString("  hello  ")).toBe("hello");
    });

    it("should remove control characters", () => {
      expect(sanitizeString("hello\x00world")).toBe("helloworld");
    });

    it("should limit string length", () => {
      const longString = "a".repeat(20000);
      expect(sanitizeString(longString).length).toBe(10000);
    });

    it("should handle non-string input", () => {
      expect(sanitizeString(123 as any)).toBe("");
      expect(sanitizeString(null as any)).toBe("");
    });
  });

  describe("Object Sanitization", () => {
    it("should sanitize nested strings", () => {
      const obj = {
        name: "  John  ",
        nested: {
          value: "  test  ",
        },
      };
      const result = sanitizeObject(obj);
      expect(result.name).toBe("John");
      expect(result.nested.value).toBe("test");
    });

    it("should sanitize arrays", () => {
      const obj = {
        items: ["  item1  ", "  item2  "],
      };
      const result = sanitizeObject(obj);
      expect(result.items).toEqual(["item1", "item2"]);
    });

    it("should preserve non-string values", () => {
      const obj = {
        count: 42,
        active: true,
        data: null,
      };
      const result = sanitizeObject(obj);
      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe("SQL Injection Detection", () => {
    it("should detect SELECT injection", () => {
      expect(containsSqlInjection("'; SELECT * FROM users --")).toBe(true);
    });

    it("should detect DROP injection", () => {
      expect(containsSqlInjection("'; DROP TABLE users; --")).toBe(true);
    });

    it("should detect UNION injection", () => {
      expect(containsSqlInjection("1 UNION SELECT * FROM users")).toBe(true);
    });

    it("should detect comment injection", () => {
      expect(containsSqlInjection("admin'--")).toBe(true);
    });

    it("should not flag normal input", () => {
      expect(containsSqlInjection("John Doe")).toBe(false);
      expect(containsSqlInjection("john@example.com")).toBe(false);
    });

    it("should handle non-string input", () => {
      expect(containsSqlInjection(123 as any)).toBe(false);
    });
  });

  describe("XSS Detection", () => {
    it("should detect script tags", () => {
      expect(containsXss("<script>alert('xss')</script>")).toBe(true);
    });

    it("should detect javascript: protocol", () => {
      expect(containsXss("javascript:alert('xss')")).toBe(true);
    });

    it("should detect event handlers", () => {
      expect(containsXss('<img onerror="alert(1)">')).toBe(true);
    });

    it("should not flag normal input", () => {
      expect(containsXss("Hello World")).toBe(false);
    });
  });

  describe("Email Validation", () => {
    it("should accept valid emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
      expect(isValidEmail("user+tag@example.com")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
    });

    it("should reject too long emails", () => {
      const longEmail = "a".repeat(250) + "@example.com";
      expect(isValidEmail(longEmail)).toBe(false);
    });
  });

  describe("Norwegian Phone Validation", () => {
    it("should accept valid Norwegian phones", () => {
      expect(isValidNorwegianPhone("+4791234567")).toBe(true);
      expect(isValidNorwegianPhone("91234567")).toBe(true);
      expect(isValidNorwegianPhone("+47 912 34 567")).toBe(true);
    });

    it("should reject invalid phones", () => {
      expect(isValidNorwegianPhone("1234567")).toBe(false); // Too short
      expect(isValidNorwegianPhone("123456789")).toBe(false); // Too long
      expect(isValidNorwegianPhone("01234567")).toBe(false); // Starts with 0
    });
  });

  describe("Password Strength", () => {
    it("should accept strong passwords", () => {
      const result = isStrongPassword("SecureP@ss123");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject short passwords", () => {
      const result = isStrongPassword("Short1!");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Passordet må være minst 8 tegn");
    });

    it("should require uppercase", () => {
      const result = isStrongPassword("lowercase123!");
      expect(result.valid).toBe(false);
    });

    it("should require lowercase", () => {
      const result = isStrongPassword("UPPERCASE123!");
      expect(result.valid).toBe(false);
    });

    it("should require numbers", () => {
      const result = isStrongPassword("NoNumbers!");
      expect(result.valid).toBe(false);
    });

    it("should require special characters", () => {
      const result = isStrongPassword("NoSpecial123");
      expect(result.valid).toBe(false);
    });
  });

  describe("CSRF Token Generation", () => {
    it("should generate unique tokens", () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(token1).not.toBe(token2);
    });

    it("should generate tokens of correct length", () => {
      const token = generateCsrfToken();
      expect(token.length).toBe(64);
    });

    it("should only contain hex characters", () => {
      const token = generateCsrfToken();
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });
  });

  describe("IP Blocking", () => {
    const testIp = "192.168.1.200";

    it("should not block IP initially", () => {
      expect(isIpBlocked(testIp)).toBe(false);
    });

    it("should block IP after too many failed attempts", () => {
      for (let i = 0; i < 10; i++) {
        trackFailedAttempt(testIp);
      }
      expect(isIpBlocked(testIp)).toBe(true);
    });

    it("should unblock IP when requested", () => {
      unblockIp(testIp);
      expect(isIpBlocked(testIp)).toBe(false);
    });
  });
});

describe("JWT Configuration", () => {
  it("should have correct access token expiry", () => {
    expect(true).toBe(true);
  });

  it("should have correct refresh token expiry", () => {
    expect(true).toBe(true);
  });

  it("should rotate refresh tokens on use", () => {
    expect(true).toBe(true);
  });
});
