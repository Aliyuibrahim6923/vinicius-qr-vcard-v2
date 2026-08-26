"use client";
import { useMemo, useState } from "react";
import type { Employee } from "@/lib/types";
import { getApiErrorMessage, readApiResponse } from "@/lib/api-response";

const blank = { first_name: "", last_name: "", job_title: "", department: "", email: "", phone: "", website: "", address: "", linkedin_url: "", bio: "", photo_url: "", active: true };

export function AdminDirectory({ initialEmployees }: { initialEmployees: Employee[] }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Employee | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const filtered = useMemo(() => employees.filter((employee) => `${employee.first_name} ${employee.last_name} ${employee.job_title} ${employee.department ?? ""}`.toLowerCase().includes(query.toLowerCase())), [employees, query]);

  async function save(formData: FormData) {
    setError("");
    const payload = Object.fromEntries(formData);
    Object.assign(payload, { active: formData.get("active") === "on" });
    const response = await fetch(editing ? `/api/employees/${editing.id}` : "/api/employees", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await readApiResponse<Employee>(response);
    if (!response.ok || "error" in result) { setError("error" in result ? getApiErrorMessage(result) : "Unable to save"); return; }
    setEmployees((current) => editing ? current.map((item) => item.id === result.id ? result : item) : [...current, result]);
    setOpen(false); setEditing(null);
  }

  async function toggle(employee: Employee) {
    const payload = { ...employee, active: !employee.active };
    const response = await fetch(`/api/employees/${employee.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await readApiResponse<Employee>(response);
    if (response.ok && !("error" in result)) setEmployees((current) => current.map((item) => item.id === result.id ? result : item));
    else setError("error" in result ? getApiErrorMessage(result) : "Unable to update employee");
  }

  const values = editing ?? blank;
  return <><section className="toolbar"><label className="search"><span>Search employees</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, title, or department" /></label><button className="button" onClick={() => { setEditing(null); setOpen(true); }}>Add employee</button></section>
    <section className="directory" aria-live="polite">{filtered.map((employee) => <article className="employee-row" key={employee.id}><div className="avatar">{employee.first_name[0]}{employee.last_name[0]}</div><div className="employee-copy"><strong>{employee.first_name} {employee.last_name}</strong><span>{employee.job_title}{employee.department ? ` · ${employee.department}` : ""}</span><small>{employee.active ? "Active" : "Disabled"} · Public profile managed automatically</small></div><div className="row-actions"><a href={`/p/${employee.slug}`} target="_blank" rel="noreferrer">Preview</a><button onClick={() => { setEditing(employee); setOpen(true); }}>Edit</button><button onClick={() => toggle(employee)}>{employee.active ? "Disable" : "Enable"}</button></div></article>)}</section>
    {open && <div className="modal" role="dialog" aria-modal="true" aria-labelledby="employee-title"><form action={save} className="panel employee-form"><div className="form-heading"><h2 id="employee-title">{editing ? "Edit employee" : "Add employee"}</h2><button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close">×</button></div>{error && <p className="error" role="alert">{error}</p>}<div className="form-grid">{[["first_name","First name","text"],["last_name","Last name","text"],["job_title","Job title","text"],["department","Department","text"],["email","Email","email"],["phone","Phone","tel"],["website","Website","url"],["linkedin_url","LinkedIn URL","url"],["photo_url","Photo URL","url"],["address","Office address","text"]].map(([name,label,type]) => <label key={name}>{label}<input name={name} type={type} defaultValue={String(values[name as keyof typeof values] ?? "")} required={["first_name","last_name","job_title"].includes(name)} /></label>)}<label className="full">Short bio<textarea name="bio" defaultValue={values.bio ?? ""} rows={3} /></label><label className="check full"><input name="active" type="checkbox" defaultChecked={values.active} /> Card is active</label></div><div className="form-actions"><button type="button" className="button secondary" onClick={() => setOpen(false)}>Cancel</button><button className="button" type="submit">Save card</button></div></form></div>}</>;
}
