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
 * Strips all non-digit characters from a string
 * @param phone - Any phone number string
 * @returns Only the digits from the input
 * @example
 * extractDigits("+91 98765-43210") // "919876543210"
 * extractDigits("(+91) 98765 43210") // "919876543210"
 */
export function extractDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Checks if a string is already in Twilio WhatsApp format
 * @param phone - Phone string to check
 * @returns true if already formatted as "whatsapp:+XXXXXXXXXXX"
 * @example
 * isWhatsAppFormatted("whatsapp:+919876543210") // true
 * isWhatsAppFormatted("9876543210") // false
 */
export function isWhatsAppFormatted(phone: string): boolean {
  return /^whatsapp:\+\d{10,15}$/.test(phone);
}

/**
 * Normalizes an Indian phone number to its 10-digit form
 * @param digits - Digits-only phone string
 * @returns 10-digit Indian mobile number or null if invalid
 */
function normalizeToTenDigits(digits: string): string | null {
  // Already 10 digits
  if (digits.length === 10) {
    return digits;
  }
  
  // 12 digits starting with 91 (country code)
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  
  // 11 digits starting with 0 (trunk prefix)
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  
  return null;
}

// ─────────────────────────────────────────────────────────────
// Main Functions
// ─────────────────────────────────────────────────────────────

/**
 * Converts any Indian phone number format to Twilio WhatsApp format
 * @param phone - Phone number in any common Indian format
 * @returns Twilio WhatsApp format: "whatsapp:+91XXXXXXXXXX"
 * @throws {PhoneFormatError} If phone number cannot be parsed
 * @example
 * formatWhatsApp("9876543210") // "whatsapp:+919876543210"
 * formatWhatsApp("+91 98765 43210") // "whatsapp:+919876543210"
 * formatWhatsApp("09876543210") // "whatsapp:+919876543210"
 */
export function formatWhatsApp(phone: string): string {
  // Already formatted — return as is
  if (isWhatsAppFormatted(phone)) {
    return phone;
  }

  const trimmed = phone.trim();
  
  if (!trimmed) {
    throw new PhoneFormatError(
      "Phone number cannot be empty",
      "INVALID_FORMAT",
      phone
    );
  }

  const digits = extractDigits(trimmed);
  
  if (!digits) {
    throw new PhoneFormatError(
      "Phone number contains no valid digits",
      "INVALID_FORMAT",
      phone
    );
  }

  // Normalize to 10 digits
  const tenDigits = normalizeToTenDigits(digits);
  
  if (!tenDigits) {
    throw new PhoneFormatError(
      `Invalid phone number length: expected 10, 11 (with 0), or 12 (with 91) digits, got ${digits.length}`,
      "INVALID_LENGTH",
      phone
    );
  }

  // Validate Indian mobile prefix (6, 7, 8, 9)
  const firstDigit = tenDigits[0];
  if (!["6", "7", "8", "9"].includes(firstDigit)) {
    throw new PhoneFormatError(
      `Invalid Indian mobile number — must start with 6, 7, 8, or 9, got ${firstDigit}`,
      "INVALID_PREFIX",
      phone
    );
  }

  return `whatsapp:+91${tenDigits}`;
}

/**
 * Validates if a phone number is a valid Indian mobile number
 * @param phone - Phone number in any format
 * @returns Validation result with formatted number or error message
 * @example
 * validateIndianMobile("9876543210")
 * // { valid: true, formatted: "+919876543210", error: null }
 * 
 * validateIndianMobile("1234567890")
 * // { valid: false, formatted: null, error: "Invalid Indian mobile number — must start with 6, 7, 8, or 9" }
 */
export function validateIndianMobile(phone: string): ValidationResult {
  const trimmed = phone.trim();
  
  if (!trimmed) {
    return {
      valid: false,
      formatted: null,
      error: "Phone number cannot be empty",
    };
  }

  const digits = extractDigits(trimmed);
  
  if (!digits) {
    return {
      valid: false,
      formatted: null,
      error: "Phone number contains no valid digits",
    };
  }

  // Normalize to 10 digits
  const tenDigits = normalizeToTenDigits(digits);
  
  if (!tenDigits) {
    return {
      valid: false,
      formatted: null,
      error: "Phone number must be 10 digits",
    };
  }

  // Check for valid Indian mobile prefix
  const firstDigit = tenDigits[0];
  if (!["6", "7", "8", "9"].includes(firstDigit)) {
    return {
      valid: false,
      formatted: null,
      error: "Invalid Indian mobile number — must start with 6, 7, 8, or 9",
    };
  }

  // Check for all identical digits (e.g., 9999999999)
  if (/^(\d)\1{9}$/.test(tenDigits)) {
    return {
      valid: false,
      formatted: null,
      error: "Phone number cannot be all identical digits",
    };
  }

  return {
    valid: true,
    formatted: `+91${tenDigits}`,
    error: null,
  };
}

/**
 * Formats a phone number for display in the UI
 * @param phone - Phone number in any format
 * @returns Formatted display string: "+91 XXXXX XXXXX"
 * @example
 * formatPhoneDisplay("+919876543210") // "+91 98765 43210"
 * formatPhoneDisplay("9876543210") // "+91 98765 43210"
 */
export function formatPhoneDisplay(phone: string): string {
  const digits = extractDigits(phone);
  const tenDigits = normalizeToTenDigits(digits);
  
  if (!tenDigits || tenDigits.length !== 10) {
    // Return original if can't parse
    return phone;
  }

  const firstPart = tenDigits.slice(0, 5);
  const secondPart = tenDigits.slice(5);
  
  return `+91 ${firstPart} ${secondPart}`;
}
