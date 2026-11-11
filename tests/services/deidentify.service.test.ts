import { deidentifyService } from "../../src/services/deidentify.service";

describe("DeidentifyService", () => {
  describe("deidentifyText", () => {
    describe("EMAIL", () => {
      it("should de-identify standard email addresses", () => {
        const text = "Contact support at test.user+tag@domain.co.in for help.";
        const result = deidentifyService.deidentifyText(text);

        expect(result.deidentifiedText).toBe("Contact support at [EMAIL] for help.");
        expect(result.detectedEntities).toContain("EMAIL");
        expect(result.originalText).toBe(text);
      });

      it("should de-identify multiple different emails", () => {
        const text = "Reach us at alpha@corp.com or beta123@sub.domain.org.";
        const result = deidentifyService.deidentifyText(text);

        expect(result.deidentifiedText).toBe("Reach us at [EMAIL] or [EMAIL].");
        expect(result.detectedEntities.filter((e) => e === "EMAIL")).toHaveLength(1);
      });
    });

    describe("SSN", () => {
      it("should de-identify valid SSNs", () => {
        const text = "Client SSN is 123-45-6789.";
        const result = deidentifyService.deidentifyText(text);

        expect(result.deidentifiedText).toBe("Client SSN is [SSN].");
        expect(result.detectedEntities).toContain("SSN");
      });

      it("should not de-identify SSNs starting with invalid prefixes (000, 666, 9xx)", () => {
        const invalidSSNs = "Cases: 000-12-3456, 666-12-3456, and 912-34-5678";
        const result = deidentifyService.deidentifyText(invalidSSNs);

        expect(result.deidentifiedText).toBe(invalidSSNs);
        expect(result.detectedEntities).not.toContain("SSN");
      });

      it("should not de-identify SSNs with invalid middle or last groups (00 or 0000)", () => {
        const invalidSSNs = "Cases: 123-00-4567 and 123-45-0000";
        const result = deidentifyService.deidentifyText(invalidSSNs);

        expect(result.deidentifiedText).toBe(invalidSSNs);
        expect(result.detectedEntities).not.toContain("SSN");
      });
    });

    describe("DOB", () => {
      it("should de-identify valid dates in MM/DD/YYYY and MM-DD-YYYY formats", () => {
        const text = "Born on 04/18/1992 and renewed on 11-05-2020.";
        const result = deidentifyService.deidentifyText(text);

        expect(result.deidentifiedText).toBe("Born on [DOB] and renewed on [DOB].");
        expect(result.detectedEntities).toContain("DOB");
      });

      it("should de-identify single-digit month and day formats", () => {
        const text = "Recorded on 1/5/1985.";
        const result = deidentifyService.deidentifyText(text);

        expect(result.deidentifiedText).toBe("Recorded on [DOB].");
        expect(result.detectedEntities).toContain("DOB");
      });
    });

    describe("CREDIT_CARD", () => {
      it("should de-identify credit card numbers that pass the Luhn check", () => {
        // Valid Luhn 16-digit card
        const text = "Payment made via 4111 1111 1111 1111.";
        const result = deidentifyService.deidentifyText(text);

        expect(result.deidentifiedText).toBe("Payment made via [CREDIT_CARD].");
        expect(result.detectedEntities).toContain("CREDIT_CARD");
      });

      it("should de-identify valid cards with hyphen separators", () => {
        const text = "Card: 4111-1111-1111-1111.";
        const result = deidentifyService.deidentifyText(text);

        expect(result.deidentifiedText).toBe("Card: [CREDIT_CARD].");
        expect(result.detectedEntities).toContain("CREDIT_CARD");
      });

      it("should not de-identify credit card numbers failing the Luhn check", () => {
        const text = "Invalid card: 4111 1111 1111 1112.";
        const result = deidentifyService.deidentifyText(text);

        expect(result.deidentifiedText).toBe(text);
        expect(result.detectedEntities).not.toContain("CREDIT_CARD");
      });
    });

    describe("IP_ADDRESS", () => {
      it("should de-identify valid IPv4 addresses", () => {
        const text = "Server listening on 192.168.1.1 and 10.0.0.255.";
        const result = deidentifyService.deidentifyText(text);

        expect(result.deidentifiedText).toBe("Server listening on [IP_ADDRESS] and [IP_ADDRESS].");
        expect(result.detectedEntities).toContain("IP_ADDRESS");
      });

      it("should not de-identify strings with out-of-range octets (> 255)", () => {
        const text = "Invalid IP: 999.168.1.1 and 256.0.0.1.";
        const result = deidentifyService.deidentifyText(text);

        expect(result.deidentifiedText).toBe(text);
        expect(result.detectedEntities).not.toContain("IP_ADDRESS");
      });
    });

    describe("Combined & Edge Cases", () => {
      it("should de-identify multiple different entities without duplicating detectedEntities", () => {
        const text =
          "User john@example.com (DOB: 05/12/1990) contacted 555-234-5678 from 192.168.0.1. Also alert support@example.com.";
        const result = deidentifyService.deidentifyText(text);

        expect(result.deidentifiedText).toBe(
          "User [EMAIL] (DOB: [DOB]) contacted [PHONE] from [IP_ADDRESS]. Also alert [EMAIL]."
        );

        expect(result.detectedEntities).toEqual(
          expect.arrayContaining(["EMAIL", "DOB", "PHONE", "IP_ADDRESS"])
        );
        // Ensure no duplicate entity entries
        expect(new Set(result.detectedEntities).size).toBe(result.detectedEntities.length);
      });

      it("should return unchanged text and empty detectedEntities when no PII is present", () => {
        const text = "The quick brown fox jumps over the lazy dog.";
        const result = deidentifyService.deidentifyText(text);

        expect(result.deidentifiedText).toBe(text);
        expect(result.detectedEntities).toEqual([]);
      });

      it("should handle an empty string", () => {
        const result = deidentifyService.deidentifyText("");

        expect(result.originalText).toBe("");
        expect(result.deidentifiedText).toBe("");
        expect(result.detectedEntities).toEqual([]);
      });
    });
  });

  describe("isValidEntity", () => {
    it("should correctly validate IP address ranges", () => {
      expect(deidentifyService.isValidEntity("IP_ADDRESS", "127.0.0.1")).toBe(true);
      expect(deidentifyService.isValidEntity("IP_ADDRESS", "255.255.255.255")).toBe(true);
      expect(deidentifyService.isValidEntity("IP_ADDRESS", "256.0.0.1")).toBe(false);
      expect(deidentifyService.isValidEntity("IP_ADDRESS", "192.168.1.300")).toBe(false);
    });

    it("should correctly validate SSN structural rules", () => {
      expect(deidentifyService.isValidEntity("SSN", "219-45-7890")).toBe(true);
      expect(deidentifyService.isValidEntity("SSN", "000-45-7890")).toBe(false);
      expect(deidentifyService.isValidEntity("SSN", "666-45-7890")).toBe(false);
      expect(deidentifyService.isValidEntity("SSN", "912-45-7890")).toBe(false);
      expect(deidentifyService.isValidEntity("SSN", "219-00-7890")).toBe(false);
      expect(deidentifyService.isValidEntity("SSN", "219-45-0000")).toBe(false);
    });

    it("should return true for unhandled entity validation by default", () => {
      expect(deidentifyService.isValidEntity("EMAIL", "test@test.com")).toBe(true);
      expect(deidentifyService.isValidEntity("DOB", "01/01/2000")).toBe(true);
      expect(deidentifyService.isValidEntity("PHONE", "555-555-5555")).toBe(true);
    });
  });

  describe("luhnCheck", () => {
    it("should validate cards passing checksum with lengths between 13 and 19", () => {
      expect(deidentifyService.luhnCheck("4111 1111 1111 1111")).toBe(true);
      expect(deidentifyService.luhnCheck("49927398716")).toBe(false); // Valid checksum, but length < 13
      expect(deidentifyService.luhnCheck("0000000000000")).toBe(true); // 13 zeros
    });

    it("should fail cards with invalid checksum", () => {
      expect(deidentifyService.luhnCheck("4111 1111 1111 1112")).toBe(false);
    });

    it("should reject inputs with fewer than 13 or more than 19 digits", () => {
      expect(deidentifyService.luhnCheck("123456789012")).toBe(false); // 12 digits
      expect(deidentifyService.luhnCheck("12345678901234567890")).toBe(false); // 20 digits
    });
  });
});