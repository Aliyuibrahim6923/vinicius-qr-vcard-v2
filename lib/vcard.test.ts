import { describe, expect, it } from "vitest";
import { buildVCard, escapeVCard } from "./vcard";
import type { Employee } from "./types";

describe("vCard", () => {
  it("escapes reserved values and line breaks", () => {
    expect(escapeVCard("A; B, C\nD\\E")).toBe("A\\; B\\, C\\nD\\\\E");
  });
  it("omits unavailable optional fields", () => {
    const employee: Employee = { id: "1", active: true, first_name: "Ada", last_name: "Lovelace", job_title: "Director", department: null, email: null, phone: null, phone_action: "both", website: null, address: null, linkedin_url: null, bio: null, photo_url: null, slug: "ada-lovelace", created_at: "", updated_at: "" };
    const card = buildVCard(employee);
    expect(card).toContain("VERSION:3.0\r\n");
    expect(card).toContain("FN:Ada Lovelace");
    expect(card).not.toContain("EMAIL");
  });
});
