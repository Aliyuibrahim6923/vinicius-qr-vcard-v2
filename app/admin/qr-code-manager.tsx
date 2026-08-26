"use client";
import Image from "next/image";
import { useMemo, useState } from "react";
import type { Employee, QRCodeRecord } from "@/lib/types";
import { getApiErrorMessage, readApiResponse } from "@/lib/api-response";

const blank = { name: "", category: "", active: true, destination_type: "employee_profile" as const, employee_id: "", destination_url: "" };

export function QRCodeManager({ initialQRCodes, employees }: { initialQRCodes: QRCodeRecord[]; employees: Employee[] }) {
  const [qrCodes, setQRCodes] = useState(initialQRCodes);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<QRCodeRecord | null>(null);
  const [destinationType, setDestinationType] = useState<QRCodeRecord["destination_type"]>("external");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const filtered = useMemo(() => qrCodes.filter((qr) => `${qr.name} ${qr.category ?? ""} ${qr.code}`.toLowerCase().includes(query.toLowerCase())), [qrCodes, query]);
  const employeesById = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees]);
  const employeeNames = useMemo(() => new Map(employees.map((employee) => [employee.id, `${employee.first_name} ${employee.last_name}`])), [employees]);
  function destinationPreview(qr: QRCodeRecord) {
    if (qr.destination_type === "external") return qr.destination_url;
    const employee = employeesById.get(qr.employee_id ?? "");
    return employee ? `/p/${employee.slug}` : null;
  }
  function beginCreate() { setEditing(null); setDestinationType("employee_profile"); setError(""); setOpen(true); }
  function beginEdit(qr: QRCodeRecord) { setEditing(qr); setDestinationType(qr.destination_type); setError(""); setOpen(true); }
  async function save(formData: FormData) {
    setError("");
    const payload = { ...Object.fromEntries(formData), active: formData.get("active") === "on", employee_id: formData.get("employee_id") || null, destination_url: formData.get("destination_url") || null };
    const response = await fetch(editing ? `/api/qr-codes/${editing.id}` : "/api/qr-codes", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await readApiResponse<QRCodeRecord>(response);
    if (!response.ok || "error" in result) { setError("error" in result ? getApiErrorMessage(result) : "Unable to save QR code"); return; }
    setQRCodes((current) => editing ? current.map((item) => item.id === result.id ? result : item) : [...current, result]); setOpen(false); setEditing(null);
  }
  async function toggle(qr: QRCodeRecord) {
    const response = await fetch(`/api/qr-codes/${qr.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...qr, active: !qr.active }) });
    const result = await readApiResponse<QRCodeRecord>(response);
    if (response.ok && !("error" in result)) setQRCodes((current) => current.map((item) => item.id === result.id ? result : item));
    else setError("error" in result ? getApiErrorMessage(result) : "Unable to update QR code");
  }
  const values = editing ?? blank;
  return <section className="admin-section qr-section"><div className="section-heading"><div><span className="eyebrow">Permanent redirects</span><h2>Managed QR codes</h2><p>Assign a QR to a contact. Scanning it opens the hosted profile, where the visitor can save the contact.</p></div></div><section className="toolbar"><label className="search"><span>Search QR codes</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, category, or code" /></label><button className="button" onClick={beginCreate}>Generate QR code</button></section><section className="directory" aria-live="polite">{filtered.map((qr) => { const preview = destinationPreview(qr); return <article className="employee-row qr-row" key={qr.id}><a className="qr-preview" href={`/q/${qr.code}/image`} target="_blank" rel="noreferrer" aria-label={`Preview ${qr.name} QR code`}><Image src={`/q/${qr.code}/image`} alt={`${qr.name} QR code`} width={88} height={88} unoptimized /></a><div className="employee-copy"><strong>{qr.name}</strong><span>{qr.destination_type === "external" ? qr.destination_url : `Contact profile: ${employeeNames.get(qr.employee_id ?? "") ?? "Unavailable employee"}`}</span><small>{qr.active ? "Active" : "Disabled"} · /q/{qr.code}{qr.category ? ` · ${qr.category}` : ""}</small></div><div className="row-actions"><a href={`/q/${qr.code}/image`} target="_blank" rel="noreferrer">Preview QR</a>{preview && <a href={preview} target="_blank" rel="noreferrer">Preview profile</a>}<a href={`/q/${qr.code}/image?download=1`} download={`${qr.code}-qr.svg`}>Download SVG</a><button onClick={() => beginEdit(qr)}>Edit</button><button onClick={() => toggle(qr)}>{qr.active ? "Disable" : "Enable"}</button></div></article>; })}</section>{open && <div className="modal" role="dialog" aria-modal="true" aria-labelledby="qr-title"><form action={save} className="panel employee-form"><div className="form-heading"><div><h2 id="qr-title">{editing ? "Edit QR code" : "Generate QR code"}</h2>{editing && <small className="permanent-url">Permanent URL: /q/{editing.code}</small>}</div><button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close">×</button></div>{error && <p className="error" role="alert">{error}</p>}<div className="form-grid"><label>Name<input name="name" defaultValue={values.name} required maxLength={120} /></label><label>Category<input name="category" defaultValue={values.category ?? ""} placeholder="Business card, document…" /></label><label className="full">QR destination<select name="destination_type" value={destinationType} onChange={(event) => setDestinationType(event.target.value as QRCodeRecord["destination_type"])}><option value="employee_profile">Contact profile</option><option value="external">Approved website or document URL</option></select></label>{destinationType === "external" ? <label className="full">Destination URL<input name="destination_url" type="url" defaultValue={values.destination_url ?? ""} placeholder="https://…" required /></label> : <label className="full">Contact<select name="employee_id" defaultValue={values.employee_id ?? ""} required><option value="">Choose a contact</option>{employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.first_name} {employee.last_name}{employee.active ? "" : " (disabled)"}</option>)}</select></label>}<label className="check full"><input name="active" type="checkbox" defaultChecked={values.active} /> QR code is active</label></div><div className="form-actions"><button type="button" className="button secondary" onClick={() => setOpen(false)}>Cancel</button><button className="button" type="submit">Save QR code</button></div></form></div>}</section>;
}
