import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { canonicalUrl, getVisibleEmployee } from "@/lib/employees";
import { getPublicBotSettings } from "@/lib/bot";
import { CompanyChat } from "@/app/components/company-chat";

type Props = { params: Promise<{ slug: string }> };
type IconName = "call" | "whatsapp" | "email" | "website" | "linkedin" | "save" | "agent" | "map";

function ActionIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    call: <path d="M7.2 3.5 9.5 8 7.8 9.7a15 15 0 0 0 6.5 6.5l1.7-1.7 4.5 2.3v2.7a2 2 0 0 1-2.2 2C9.9 20.5 3.5 14.1 2.5 5.7a2 2 0 0 1 2-2.2h2.7Z" />,
    whatsapp: <><path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.3-4.3a8.5 8.5 0 1 1 15.7-4.4Z" /><path d="M8.2 7.7c.4 3.5 2.7 5.8 6.2 6.2l1.3-1.3-2.3-1.1-1 1a6.4 6.4 0 0 1-2.9-2.9l1-1-1.1-2.3-1.2 1.4Z" /></>,
    email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    website: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.3 3 14.7 0 18M12 3c-3 3.3-3 14.7 0 18" /></>,
    linkedin: <><rect x="4" y="9" width="3" height="10" /><circle cx="5.5" cy="5.5" r="1.5" /><path d="M11 19V9h3v1.7c1-1.4 5-2 5 3.3v5h-3v-4.5c0-2.4-2-2.2-2 0V19h-3Z" /></>,
    save: <><circle cx="9" cy="8" r="4" /><path d="M2.5 21a6.5 6.5 0 0 1 13 0M19 8v6M16 11h6" /></>,
    agent: <><path d="M4 5h16v12H9l-5 4V5Z" /><path d="M8 10h.01M12 10h.01M16 10h.01" /></>,
    map: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const employee = await getVisibleEmployee(slug);
  if (!employee) return { title: "Card unavailable", robots: { index: false, follow: false } };
  const name = `${employee.first_name} ${employee.last_name}`;
  return { title: name, description: `${employee.job_title} at Vinicius Group`, alternates: { canonical: canonicalUrl(slug) }, robots: { index: false, follow: false } };
}

export default async function Profile({ params }: Props) {
  const { slug } = await params;
  const [employee, botSettings] = await Promise.all([getVisibleEmployee(slug), getPublicBotSettings()]);
  if (!employee) notFound();

  const name = `${employee.first_name} ${employee.last_name}`;
  const phoneAction = employee.phone_action ?? "both";
  const whatsappNumber = employee.phone?.replace(/\D/g, "");
  const canCall = Boolean(employee.phone && (phoneAction === "call" || phoneAction === "both"));
  const canWhatsApp = Boolean(whatsappNumber && (phoneAction === "whatsapp" || phoneAction === "both"));
  const botNumber = botSettings?.whatsapp_number.replace(/\D/g, "");
  const hasBot = Boolean(botNumber);
  const hasActions = canCall || canWhatsApp || Boolean(employee.email || employee.website || employee.linkedin_url || employee.address);

  return <main className="profile-page"><article className="profile-card"><header className="profile-brand"><div className="profile-wordmark"><span className="profile-monogram" aria-hidden="true">VG</span><span><strong>VINICIUS GROUP</strong><small>Digital contact</small></span></div><span className="verified-badge">Official</span></header><section className="profile-top">{employee.photo_url ? <Image className="photo" src={employee.photo_url} alt={name} width={128} height={128} priority /> : <div className="photo placeholder" aria-label={`${name} initials`}>{employee.first_name[0]}{employee.last_name[0]}</div>}<h1>{name}</h1><p className="role">{employee.job_title}</p>{employee.department ? <p className="department">{employee.department}</p> : null}{employee.bio ? <p className="bio">{employee.bio}</p> : null}</section><section className="profile-contact" aria-label="Contact actions"><div className="profile-section-heading"><h2>Contact</h2><span>Tap an option</span></div>{hasActions ? <div className="contact-actions">{canCall ? <a href={`tel:${employee.phone}`}><span className="action-icon"><ActionIcon name="call" /></span><span><strong>Call</strong><small>{employee.phone}</small></span></a> : null}{canWhatsApp ? <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer"><span className="action-icon whatsapp"><ActionIcon name="whatsapp" /></span><span><strong>WhatsApp</strong><small>Message this contact</small></span></a> : null}{employee.email ? <a href={`mailto:${employee.email}`}><span className="action-icon"><ActionIcon name="email" /></span><span><strong>Email</strong><small>{employee.email}</small></span></a> : null}{employee.website ? <a href={employee.website} target="_blank" rel="noopener noreferrer"><span className="action-icon"><ActionIcon name="website" /></span><span><strong>Website</strong><small>Open website</small></span></a> : null}{employee.address ? <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(employee.address)}`} target="_blank" rel="noopener noreferrer"><span className="action-icon map"><ActionIcon name="map" /></span><span><strong>Find us</strong><small>{employee.address}</small></span></a> : null}{employee.linkedin_url ? <a href={employee.linkedin_url} target="_blank" rel="noopener noreferrer"><span className="action-icon"><ActionIcon name="linkedin" /></span><span><strong>LinkedIn</strong><small>View profile</small></span></a> : null}</div> : <p className="no-contact-actions">No direct contact options have been published.</p>}</section><footer className="profile-footer"><div className="assistant-actions">{hasBot ? <a className="profile-assistant-action whatsapp-agent-action" href={`https://wa.me/${botNumber}?text=${encodeURIComponent(botSettings!.greeting_message)}`} target="_blank" rel="noopener noreferrer"><span className="assistant-button-icon"><ActionIcon name="whatsapp" /></span><span><strong>WhatsApp assistant</strong><small>Ask about Vinicius Group</small></span></a> : null}{botSettings ? <CompanyChat companyName={botSettings.company_name} /> : null}</div><a className="button save-contact" href={`/p/${slug}/vcard`}><ActionIcon name="save" /> Save contact</a><p className="privacy-note">Verified by Vinicius Group</p></footer></article></main>;
}
