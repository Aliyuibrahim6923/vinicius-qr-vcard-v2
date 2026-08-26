import { describe, expect, it } from "vitest";
import { employeeSchema, qrCodeSchema } from "./validation";

describe("managed QR validation", () => {
  it("accepts an approved public HTTPS destination", () => {
    expect(qrCodeSchema.safeParse({ name: "Annual report", active: true, category: "Document", destination_type: "external", destination_url: "https://example.com/report.pdf" }).success).toBe(true);
  });
  it.each(["http://example.com", "https://localhost/file", "https://127.0.0.1/file", "https://user:pass@example.com/file"])("rejects unsafe destination %s", (destination_url) => {
    expect(qrCodeSchema.safeParse({ name: "Unsafe", active: true, destination_type: "external", destination_url }).success).toBe(false);
  });
  it("requires an employee for employee destinations", () => {
    expect(qrCodeSchema.safeParse({ name: "Profile", active: true, destination_type: "employee_profile" }).success).toBe(false);
  });
});

describe("employee URL validation", () => {
  it("accepts a valid employee without an administrator-provided slug", () => {
    const result = employeeSchema.safeParse({ first_name: "Ada", last_name: "Lovelace", job_title: "Director" });
    expect(result.success).toBe(true);
  });
  it("reports malformed optional URLs without throwing", () => {
    const result = employeeSchema.safeParse({ first_name: "Ada", last_name: "Lovelace", job_title: "Director", website: "example.com" });
    expect(result.success).toBe(false);
  });
  it("accepts the administrator's phone action choice", () => {
    const result = employeeSchema.safeParse({ first_name: "Ada", last_name: "Lovelace", job_title: "Director", phone: "+234 800 000 0000", phone_action: "whatsapp" });
    expect(result.success).toBe(true);
  });
  it("rejects unsupported phone actions", () => {
    const result = employeeSchema.safeParse({ first_name: "Ada", last_name: "Lovelace", job_title: "Director", phone_action: "sms" });
    expect(result.success).toBe(false);
  });
});
