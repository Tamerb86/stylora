import { describe, it, expect } from "vitest";
import { DEFAULT_BARBER_SERVICES } from "./defaultServices";

describe("Default Barber Services", () => {
  it("should have 10 services", () => {
    expect(DEFAULT_BARBER_SERVICES).toHaveLength(10);
  });

  it("should have valid structure for all services", () => {
    DEFAULT_BARBER_SERVICES.forEach((service) => {
      expect(service).toHaveProperty("name");
      expect(service).toHaveProperty("durationMinutes");
      expect(service).toHaveProperty("priceNok");
      expect(service).toHaveProperty("category");
      expect(service).toHaveProperty("description");
      expect(service).toHaveProperty("isActive");
      expect(service).toHaveProperty("displayOrder");

      // Validate types
      expect(typeof service.name).toBe("string");
      expect(typeof service.durationMinutes).toBe("number");
      expect(typeof service.priceNok).toBe("number");
      expect(typeof service.category).toBe("string");
      expect(typeof service.description).toBe("string");
      expect(typeof service.isActive).toBe("boolean");
      expect(typeof service.displayOrder).toBe("number");

      // Validate values
      expect(service.name.length).toBeGreaterThan(0);
      expect(service.durationMinutes).toBeGreaterThan(0);
      expect(service.priceNok).toBeGreaterThan(0);
      expect(service.isActive).toBe(true);
    });
  });

  it("should be sorted by displayOrder", () => {
    const orders = DEFAULT_BARBER_SERVICES.map((s) => s.displayOrder);
    const sortedOrders = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sortedOrders);
  });

  it("should have unique displayOrder values", () => {
    const orders = DEFAULT_BARBER_SERVICES.map((s) => s.displayOrder);
    const uniqueOrders = new Set(orders);
    expect(uniqueOrders.size).toBe(orders.length);
  });

  it("should have expected service names", () => {
    const expectedNames = [
      "Herreklipp",
      "Skin Fade",
      "Barneklipp (0–12 år)",
      "Skjeggtrim",
      "Klipp + Skjegg",
      "Barbering (Hot Towel)",
      "Full Grooming",
      "Studentklipp",
      "Pensjonistklipp",
      "Vask & Styling",
    ];

    const actualNames = DEFAULT_BARBER_SERVICES.map((s) => s.name);
    expect(actualNames).toEqual(expectedNames);
  });

  it("should have realistic Norwegian prices", () => {
    DEFAULT_BARBER_SERVICES.forEach((service) => {
      // Prices should be between 100 and 1000 NOK
      expect(service.priceNok).toBeGreaterThanOrEqual(100);
      expect(service.priceNok).toBeLessThanOrEqual(1000);
    });
  });

  it("should have realistic durations", () => {
    DEFAULT_BARBER_SERVICES.forEach((service) => {
      // Durations should be between 15 and 90 minutes
      expect(service.durationMinutes).toBeGreaterThanOrEqual(15);
      expect(service.durationMinutes).toBeLessThanOrEqual(90);
    });
  });

  it("should have Norwegian descriptions", () => {
    DEFAULT_BARBER_SERVICES.forEach((service) => {
      // Check for Norwegian characters or common Norwegian words
      const norwegianPattern = /[æøåÆØÅ]|og|med|for|til/;
      expect(service.description).toMatch(norwegianPattern);
    });
  });

  it("should have appropriate categories", () => {
    const validCategories = ["Klipp", "Barn", "Skjegg", "Barbering", "Pakke", "Tillegg"];
    DEFAULT_BARBER_SERVICES.forEach((service) => {
      expect(validCategories).toContain(service.category);
    });
  });
});
