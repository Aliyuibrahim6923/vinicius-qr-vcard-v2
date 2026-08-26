"use client";
import { useMemo, useState } from "react";
import type { Employee, QRCodeRecord } from "@/lib/types";

const blank = { name: "", category: "", active: true, destination_type: "external" as const, employee_id: "", destination_url: "" };

export function QRCodeManager({ initialQRCodes, employees }: { initialQRCodes: QRCodeRecord[]; employees: Employee[] }) {
  const [qrCodes, setQRCodes] = useState(initialQRCodes);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<QRCodeRecord | null>(null);
  const [destinationType, setDestinationType] = useState<QRCodeRecord["destination_type"]>("external");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const filtered = useMemo(() => qrCodes.filter((qr) => `${qr.name} ${qr.category ?? ""} ${qr.code}`.toLowerCase().includes(query.toLowerCase())), [qrCodes, query]);
  const employeeNames = useMemo(() => new Map(employees.map((employee) => [employee.id, `${employee.first_name} ${employee.last_name}`])), [employees]);
  function beginCreate() { setEditing(null); setDestinationType("external"); setError(""); setOpen(true); }
  function beginEdit(qr: QRCodeRecord) { setEditing(qr); setDestinationType(qr.destination_type); setError(""); setOpen(true); }
  async function save(formData: FormData) {
    setError("");
    const payload = { ...Object.fromEntries(formData), active: formData.get("active") === "on", employee_id: formData.get("employee_id") || null, destination_url: formData.get("destination_url") || null };
    const response = await fetch(editing ? `/api/qr-codes/${editing.id}` : "/api/qr-codes", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) { setError(result.error ?? "Unable to save QR code"); return; }
    setQRCodes((current) => editing ? current.map((item) => item.id === result.id ? result : item) : [...current, result]); setOpen(false); setEditing(null);
  }
  async function toggle(qr: QRCodeRecord) {
    const response = await fetch(`/api/qr-codes/${qr.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...qr, active: !qr.active }) });
    if (response.ok) { const result = await response.json(); setQRCodes((current) => current.map((item) => item.id === result.id ? result : item)); }
  }
  const values = editing ?? blank;
  return <section className="admin-section qr-section"><div className="section-heading"><div><span className="eyebrow">Permanent redirects</span><h2>Managed QR codes</h2><p>Printed codes always resolve through a permanent Vinicius Group URL.</p></div></div><section className="toolbar"><label className="search"><span>Search QR codes</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, category, or code" /></label><button className="button" onClick={beginCreate}>Create QR code</button></section><section className="directory" aria-live="polite">{filtered.map((qr) => <article className="employee-row" key={qr.id}><div className="qr-mark">QR</div><div className="employee-copy"><strong>{qr.name}</strong><span>{qr.destination_type === "external" ? qr.destination_url : `${qr.destination_type === "employee_vcard" ? "vCard" : "Profile"}: ${employeeNames.get(qr.employee_id ?? "") ?? "Unavailable employee"}`}</span><small>{qr.active ? "Active" : "Disabled"} · /q/{qr.code}{qr.category ? ` · ${qr.category}` : ""}</small></div><div className="row-actions"><a href={`/q/${qr.code}`} target="_blank" rel="noreferrer">Preview</a>{qr.active && <a href={`/q/${qr.code}/image`} download>SVG</a>}<button onClick={() => beginEdit(qr)}>Edit</button><button onClick={() => toggle(qr)}>{qr.active ? "Disable" : "Enable"}</button></div></article>)}</section>{open && <div className="modal" role="dialog" aria-modal="true" aria-labelledby="qr-title"><form action={save} className="panel employee-form"><div className="form-heading"><div><h2 id="qr-title">{editing ? "Edit QR code" : "Create QR code"}</h2>{editing && <small className="permanent-url">Permanent URL: /q/{editing.code}</small>}</div><button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close">×</button></div>{error && <p className="error" role="alert">{error}</p>}<div className="form-grid"><label>Name<input name="name" defaultValue={values.name} required maxLength={120} /></label><label>Category<input name="category" defaultValue={values.category ?? ""} placeholder="Business card, document…" /></label><label className="full">Destination type<select name="destination_type" value={destinationType} onChange={(event) => setDestinationType(event.target.value as QRCodeRecord["destination_type"])}><option value="external">Approved website or document URL</option><option value="employee_profile">Employee public profile</option><option value="employee_vcard">Employee vCard download</option></select></label>{destinationType === "external" ? <label className="full">Destination URL<input name="destination_url" type="url" defaultValue={values.destination_url ?? ""} placeholder="https://…" required /></label> : <label className="full">Employee<select name="employee_id" defaultValue={values.employee_id ?? ""} required><option value="">Choose an employee</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.first_name} {employee.last_name}{employee.active ? "" : " (disabled)"}</option>)}</select></label>}<label className="check full"><input name="active" type="checkbox" defaultChecked={values.active} /> QR code is active</label></div><div className="form-actions"><button type="button" className="button secondary" onClick={() => setOpen(false)}>Cancel</button><button className="button" type="submit">Save QR code</button></div></form></div>}</section>;
}
