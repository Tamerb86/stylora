import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely formats a number using toFixed, handling non-numeric values
 * @param value - The value to format
 * @param decimals - Number of decimal places (default: 2)
 * @param defaultValue - Default value to return if conversion fails (default: "0")
 * @returns Formatted string with specified decimal places
 */
export function safeToFixed(
  value: any,
  decimals: number = 2,
  defaultValue: string = "0"
): string {
  // Check if value is already a number
  if (typeof value === "number") {
    // Check if it's NaN or Infinity
    if (isNaN(value) || !isFinite(value)) {
      return defaultValue;
    }
    return value.toFixed(decimals);
  }

  // Try to parse the value
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);

  // Check if parsing was successful and result is a valid number
  if (typeof parsed === "number" && !isNaN(parsed) && isFinite(parsed)) {
    return parsed.toFixed(decimals);
  }

  // Return default value if conversion failed
  return defaultValue;
}
