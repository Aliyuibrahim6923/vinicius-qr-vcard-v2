import { z } from "zod";

const optionalText = z.string().trim().max(500).optional().or(z.literal(""));
const optionalUrl = z.string().trim().url().refine((v) => ["http:", "https:"].includes(new URL(v).protocol), "Use an http(s) URL").optional().or(z.literal(""));

export const employeeSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(80),
  last_name: z.string().trim().min(1, "Last name is required").max(80),
  job_title: z.string().trim().min(1, "Job title is required").max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
  department: optionalText,
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,25}$/, "Enter a valid phone number").optional().or(z.literal("")),
  website: optionalUrl,
  linkedin_url: optionalUrl,
  address: optionalText,
  bio: z.string().trim().max(600).optional().or(z.literal("")),
  photo_url: optionalUrl,
  active: z.boolean().default(true)
});

export type EmployeeInput = z.infer<typeof employeeSchema>;

export function normalizeEmployee(input: EmployeeInput) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, value === "" ? null : value]));
}

function isSafeExternalUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || host === "0.0.0.0" || host === "::1") return false;
    const parts = host.split(".").map(Number);
    if (parts.length === 4 && parts.every(Number.isInteger)) {
      if (parts[0] === 10 || parts[0] === 127 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168)) return false;
    }
    const allowlist = process.env.QR_ALLOWED_HOSTS?.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
    return !allowlist?.length || allowlist.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
  } catch { return false; }
}

export const qrCodeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  active: z.boolean().default(true),
  destination_type: z.enum(["employee_profile", "employee_vcard", "external"]),
  employee_id: z.string().uuid().nullable().optional(),
  destination_url: z.string().trim().nullable().optional()
}).superRefine((value, context) => {
  if (value.destination_type === "external") {
    if (!value.destination_url || !isSafeExternalUrl(value.destination_url)) context.addIssue({ code: "custom", path: ["destination_url"], message: "Use an approved public HTTPS URL" });
  } else if (!value.employee_id) context.addIssue({ code: "custom", path: ["employee_id"], message: "Choose an employee" });
});

export function normalizeQRCode(input: z.infer<typeof qrCodeSchema>) {
  return {
    ...input,
    category: input.category || null,
    employee_id: input.destination_type === "external" ? null : input.employee_id,
    destination_url: input.destination_type === "external" ? input.destination_url : null
  };
}
