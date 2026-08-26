import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { canonicalUrl, getActiveEmployee } from "@/lib/employees";

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const employee = await getActiveEmployee(slug);
  if (!employee) return { title: "Card unavailable", robots: { index: false, follow: false } };
  const name = `${employee.first_name} ${employee.last_name}`;
  return { title: name, description: `${employee.job_title} at Vinicius Group`, alternates: { canonical: canonicalUrl(slug) }, robots: { index: false, follow: false } };
}

export default async function Profile({ params }: Props) {
  const { slug } = await params; const employee = await getActiveEmployee(slug); if (!employee) notFound();
  const name = `${employee.first_name} ${employee.last_name}`;
  return <main className="profile-page"><article className="profile-card"><div className="profile-top"><div className="wordmark"><span className="brand small">VG</span><span>VINICIUS GROUP</span></div>{employee.photo_url ? <Image className="photo" src={employee.photo_url} alt={name} width={128} height={128} priority /> : <div className="photo placeholder">{employee.first_name[0]}{employee.last_name[0]}</div>}<h1>{name}</h1><p className="role">{employee.job_title}</p>{employee.department && <p className="department">{employee.department}</p>}{employee.bio && <p className="bio">{employee.bio}</p>}</div><div className="contact-actions">{employee.phone && <a href={`tel:${employee.phone}`}>Call</a>}{employee.email && <a href={`mailto:${employee.email}`}>Email</a>}{employee.website && <a href={employee.website} target="_blank" rel="noopener noreferrer">Website</a>}{employee.linkedin_url && <a href={employee.linkedin_url} target="_blank" rel="noopener noreferrer">LinkedIn</a>}</div>{employee.address && <div className="detail"><span>Office</span><p>{employee.address}</p></div>}<a className="button save-contact" href={`/p/${slug}/vcard`}>Save contact</a><p className="privacy-note">Official Vinicius Group contact card</p></article></main>;
}
