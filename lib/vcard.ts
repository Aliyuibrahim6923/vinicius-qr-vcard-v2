import type { Employee } from "./types";

export function escapeVCard(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildVCard(employee: Employee) {
  const fullName = `${employee.first_name} ${employee.last_name}`;
  const lines = [
    "BEGIN:VCARD",
    "VERSION:4.0",
    `N:${escapeVCard(employee.last_name)};${escapeVCard(employee.first_name)};;;`,
    `FN:${escapeVCard(fullName)}`,
    "ORG:Vinicius Group"
  ];
  
  if (employee.department) lines.push(`X-DEPARTMENT:${escapeVCard(employee.department)}`);
  lines.push(`TITLE:${escapeVCard(employee.job_title)}`);
  
  if (employee.phone) lines.push(`TEL;TYPE=work;VALUE=text:${escapeVCard(employee.phone)}`);
  if (employee.email) lines.push(`EMAIL;TYPE=work:${escapeVCard(employee.email)}`);
  if (employee.website) lines.push(`URL;TYPE=work:${escapeVCard(employee.website)}`);
  if (employee.linkedin_url) lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${escapeVCard(employee.linkedin_url)}`);
  if (employee.address) lines.push(`ADR;TYPE=work:;;${escapeVCard(employee.address)};;;;`);
  if (employee.bio) lines.push(`NOTE:${escapeVCard(employee.bio)}`);
  
  lines.push("END:VCARD");
  return `${lines.join("\r\n")}\r\n`;
}
