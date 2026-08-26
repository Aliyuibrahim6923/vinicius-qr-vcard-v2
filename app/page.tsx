import Link from "next/link";
import { BrandLogo } from "@/app/components/brand-logo";

export default function Home() {
  return <main className="center-page branded-page"><BrandLogo className="brand-logo-hero" priority /><h1>Vinicius Group</h1><p>Official digital contact cards and managed QR destinations.</p><Link className="button" href="/login">Administrator sign in</Link></main>;
}
