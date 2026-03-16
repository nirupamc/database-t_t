/**
 * Phone number utilities for Indian mobile numbers
 * Used for Twilio WhatsApp API formatting and validation
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

/** Error codes for phone formatting failures */
export type PhoneErrorCode = "INVALID_FORMAT" | "INVALID_LENGTH" | "INVALID_PREFIX";

/** Result of phone number validation */
export type ValidationResult = {
  valid: boolean;
  /** E.164 format: +91XXXXXXXXXX, or null if invalid */
  formatted: string | null;
  /** Descriptive error message, or null if valid */
  error: string | null;
};

// ─────────────────────────────────────────────────────────────
// Custom Error Class
// ─────────────────────────────────────────────────────────────

/**
 * Custom error for phone number formatting failures
 */
export class PhoneFormatError extends Error {
  readonly code: PhoneErrorCode;
  readonly originalInput: string;

  constructor(message: string, code: PhoneErrorCode, originalInput: string) {
    super(message);
    this.name = "PhoneFormatError";
    this.code = code;
    this.originalInput = originalInput;
    
    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PhoneFormatError);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────

/**
 * Extract only digits from a string
 */
export function extractDigits(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Check if a phone number is already in WhatsApp format
 */
export function isWhatsAppFormatted(phone: string): boolean {
  return /^whatsapp:\+91\d{10}$/.test(phone);
}

/**
 * Validate an Indian mobile number
 * 
 * Valid formats:
 * - 10 digits starting with 6/7/8/9 (e.g., 9876543210)
 * - 11 digits with leading 0 (e.g., 09876543210)
 * - 12 digits with 91 prefix (e.g., 919876543210)
 * - With +91 prefix (e.g., +919876543210)
 * - With spaces/dashes (e.g., +91 98765 43210)
 * 
 * Invalid:
 * - Numbers not starting with 6/7/8/9 (after country code)
 * - All same digits (e.g., 9999999999)
 * - Wrong length
 */
export function validateIndianMobile(phone: string | null | undefined): ValidationResult {
  if (!phone) {
    return { valid: false, formatted: null, error: "Phone number is required" };
  }

  const digits = extractDigits(phone);

  // Determine the 10-digit number
  let tenDigit: string;
  
  if (digits.length === 10) {
    tenDigit = digits;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    tenDigit = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith("91")) {
    tenDigit = digits.slice(2);
  } else {
    return {
      valid: false,
      formatted: null,
      error: `Invalid length: expected 10 digits, got ${digits.length}`,
    };
  }

  // Validate first digit (must be 6, 7, 8, or 9 for Indian mobile)
  const firstDigit = tenDigit[0];
  if (!["6", "7", "8", "9"].includes(firstDigit)) {
    return {
      valid: false,
      formatted: null,
      error: `Invalid mobile prefix: must start with 6, 7, 8, or 9`,
    };
  }

  // Check for all same digits (spam indicator)
  if (/^(\d)\1{9}$/.test(tenDigit)) {
    return {
      valid: false,
      formatted: null,
      error: "Invalid number: all digits are the same",
    };
  }

  return {
    valid: true,
    formatted: `+91${tenDigit}`,
    error: null,
  };
}

/**
 * Format a phone number for WhatsApp API (Twilio format)
 * Throws PhoneFormatError if the number is invalid
 * 
 * @example
 * formatWhatsApp("9876543210")     // "whatsapp:+919876543210"
 * formatWhatsApp("+91 98765 43210") // "whatsapp:+919876543210"
 */
export function formatWhatsApp(phone: string | null | undefined): string {
  if (!phone) {
    throw new PhoneFormatError(
      "Phone number is required",
      "INVALID_FORMAT",
      phone ?? ""
    );
  }

  // Already formatted
  if (isWhatsAppFormatted(phone)) {
    return phone;
  }

  const result = validateIndianMobile(phone);
  
  if (!result.valid || !result.formatted) {
    throw new PhoneFormatError(
      result.error ?? "Invalid phone number",
      result.error?.includes("length") ? "INVALID_LENGTH" : "INVALID_PREFIX",
      phone
    );
  }

  return `whatsapp:${result.formatted}`;
}

/**
 * Format phone number for display in UI
 * 
 * @example
 * formatPhoneDisplay("9876543210")      // "+91 98765 43210"
 * formatPhoneDisplay("+919876543210")   // "+91 98765 43210"
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return "";

  const result = validateIndianMobile(phone);
  
  if (!result.valid || !result.formatted) {
    // Return original if invalid, let caller decide how to handle
    return phone;
  }

  // Format as: +91 XXXXX XXXXX
  const tenDigit = result.formatted.slice(3); // Remove +91
  return `+91 ${tenDigit.slice(0, 5)} ${tenDigit.slice(5)}`;
}
