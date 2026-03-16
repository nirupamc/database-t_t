/**
 * Jest unit tests for phone-utils.ts
 */
import {
  formatWhatsApp,
  validateIndianMobile,
  formatPhoneDisplay,
  extractDigits,
  isWhatsAppFormatted,
  PhoneFormatError,
} from "./phone-utils";

// ─────────────────────────────────────────────────────────────
// extractDigits
// ─────────────────────────────────────────────────────────────

describe("extractDigits", () => {
  it("strips all non-digit characters", () => {
    expect(extractDigits("+91 98765-43210")).toBe("919876543210");
    expect(extractDigits("(+91) 98765 43210")).toBe("919876543210");
    expect(extractDigits("abc123def456")).toBe("123456");
    expect(extractDigits("")).toBe("");
  });
});

// ─────────────────────────────────────────────────────────────
// isWhatsAppFormatted
// ─────────────────────────────────────────────────────────────

describe("isWhatsAppFormatted", () => {
  it("returns true for valid WhatsApp format", () => {
    expect(isWhatsAppFormatted("whatsapp:+919876543210")).toBe(true);
    expect(isWhatsAppFormatted("whatsapp:+14155238886")).toBe(true);
  });

  it("returns false for other formats", () => {
    expect(isWhatsAppFormatted("9876543210")).toBe(false);
    expect(isWhatsAppFormatted("+919876543210")).toBe(false);
    expect(isWhatsAppFormatted("whatsapp:9876543210")).toBe(false);
    expect(isWhatsAppFormatted("")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// formatWhatsApp
// ─────────────────────────────────────────────────────────────

describe("formatWhatsApp", () => {
  describe("handles all input formats correctly", () => {
    it("10-digit number", () => {
      expect(formatWhatsApp("9876543210")).toBe("whatsapp:+919876543210");
    });

    it("10-digit with leading 0", () => {
      expect(formatWhatsApp("09876543210")).toBe("whatsapp:+919876543210");
    });

    it("with +91 prefix", () => {
      expect(formatWhatsApp("+919876543210")).toBe("whatsapp:+919876543210");
    });

    it("with 91 prefix (no +)", () => {
      expect(formatWhatsApp("919876543210")).toBe("whatsapp:+919876543210");
    });

    it("with spaces", () => {
      expect(formatWhatsApp("98765 43210")).toBe("whatsapp:+919876543210");
    });

    it("with dashes", () => {
      expect(formatWhatsApp("98765-43210")).toBe("whatsapp:+919876543210");
    });

    it("with +91 and spaces", () => {
      expect(formatWhatsApp("+91 98765 43210")).toBe("whatsapp:+919876543210");
    });

    it("with parentheses and special chars", () => {
      expect(formatWhatsApp("(+91) 98765-43210")).toBe("whatsapp:+919876543210");
    });
  });

  describe("returns same value for already formatted input", () => {
    it("already WhatsApp-formatted", () => {
      expect(formatWhatsApp("whatsapp:+919876543210")).toBe("whatsapp:+919876543210");
    });
  });

  describe("throws PhoneFormatError for invalid input", () => {
    it("empty string", () => {
      expect(() => formatWhatsApp("")).toThrow(PhoneFormatError);
      expect(() => formatWhatsApp("")).toThrow("Phone number cannot be empty");
    });

    it("only whitespace", () => {
      expect(() => formatWhatsApp("   ")).toThrow(PhoneFormatError);
    });

    it("invalid length (too short)", () => {
      expect(() => formatWhatsApp("98765")).toThrow(PhoneFormatError);
      expect(() => formatWhatsApp("98765")).toThrow(/Invalid phone number length/);
    });

    it("invalid length (too long)", () => {
      expect(() => formatWhatsApp("919876543210123")).toThrow(PhoneFormatError);
    });

    it("non-numeric garbage", () => {
      expect(() => formatWhatsApp("abcdefghij")).toThrow(PhoneFormatError);
      expect(() => formatWhatsApp("abcdefghij")).toThrow("Phone number contains no valid digits");
    });

    it("invalid prefix (starts with 1)", () => {
      expect(() => formatWhatsApp("1234567890")).toThrow(PhoneFormatError);
      expect(() => formatWhatsApp("1234567890")).toThrow(/must start with 6, 7, 8, or 9/);
    });

    it("invalid prefix (starts with 5)", () => {
      expect(() => formatWhatsApp("5555555555")).toThrow(PhoneFormatError);
    });
  });

  describe("error has correct properties", () => {
    it("includes code and originalInput", () => {
      try {
        formatWhatsApp("12345");
      } catch (error) {
        expect(error).toBeInstanceOf(PhoneFormatError);
        expect((error as PhoneFormatError).code).toBe("INVALID_LENGTH");
        expect((error as PhoneFormatError).originalInput).toBe("12345");
      }
    });
  });
});

// ─────────────────────────────────────────────────────────────
// validateIndianMobile
// ─────────────────────────────────────────────────────────────

describe("validateIndianMobile", () => {
  describe("valid numbers", () => {
    it("10-digit starting with 6", () => {
      const result = validateIndianMobile("6123456789");
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe("+916123456789");
      expect(result.error).toBeNull();
    });

    it("10-digit starting with 7", () => {
      const result = validateIndianMobile("7123456789");
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe("+917123456789");
    });

    it("10-digit starting with 8", () => {
      const result = validateIndianMobile("8123456789");
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe("+918123456789");
    });

    it("10-digit starting with 9", () => {
      const result = validateIndianMobile("9876543210");
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe("+919876543210");
    });

    it("with country code prefix", () => {
      const result = validateIndianMobile("+919876543210");
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe("+919876543210");
    });

    it("with 91 prefix (no +)", () => {
      const result = validateIndianMobile("919876543210");
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe("+919876543210");
    });

    it("with spaces and formatting", () => {
      const result = validateIndianMobile("+91 98765 43210");
      expect(result.valid).toBe(true);
      expect(result.formatted).toBe("+919876543210");
    });
  });

  describe("invalid numbers", () => {
    it("starts with 1", () => {
      const result = validateIndianMobile("1234567890");
      expect(result.valid).toBe(false);
      expect(result.formatted).toBeNull();
      expect(result.error).toBe("Invalid Indian mobile number — must start with 6, 7, 8, or 9");
    });

    it("starts with 2", () => {
      const result = validateIndianMobile("2345678901");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("must start with 6, 7, 8, or 9");
    });

    it("starts with 3", () => {
      const result = validateIndianMobile("3456789012");
      expect(result.valid).toBe(false);
    });

    it("starts with 4", () => {
      const result = validateIndianMobile("4567890123");
      expect(result.valid).toBe(false);
    });

    it("starts with 5", () => {
      const result = validateIndianMobile("5678901234");
      expect(result.valid).toBe(false);
    });

    it("less than 10 digits", () => {
      const result = validateIndianMobile("987654321");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Phone number must be 10 digits");
    });

    it("more than 10 digits (not 12 with 91)", () => {
      const result = validateIndianMobile("98765432101");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Phone number must be 10 digits");
    });

    it("all same digits", () => {
      const result = validateIndianMobile("9999999999");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Phone number cannot be all identical digits");
    });

    it("all same digits (with country code)", () => {
      const result = validateIndianMobile("+919999999999");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Phone number cannot be all identical digits");
    });

    it("empty string", () => {
      const result = validateIndianMobile("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Phone number cannot be empty");
    });

    it("no valid digits", () => {
      const result = validateIndianMobile("abcdefghij");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Phone number contains no valid digits");
    });
  });
});

// ─────────────────────────────────────────────────────────────
// formatPhoneDisplay
// ─────────────────────────────────────────────────────────────

describe("formatPhoneDisplay", () => {
  it("raw 10-digit number", () => {
    expect(formatPhoneDisplay("9876543210")).toBe("+91 98765 43210");
  });

  it("number with country code", () => {
    expect(formatPhoneDisplay("+919876543210")).toBe("+91 98765 43210");
    expect(formatPhoneDisplay("919876543210")).toBe("+91 98765 43210");
  });

  it("already formatted number", () => {
    expect(formatPhoneDisplay("+91 98765 43210")).toBe("+91 98765 43210");
  });

  it("with leading 0", () => {
    expect(formatPhoneDisplay("09876543210")).toBe("+91 98765 43210");
  });

  it("returns original for unparseable input", () => {
    expect(formatPhoneDisplay("invalid")).toBe("invalid");
    expect(formatPhoneDisplay("12345")).toBe("12345");
  });
});
