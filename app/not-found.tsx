import Link from "next/link";
import { BrandLogo } from "@/app/components/brand-logo";
export default function NotFound() {
  return <main className="center-page branded-page"><BrandLogo className="brand-logo-state" /><h1>Card unavailable</h1><p>This contact card does not exist or is no longer active.</p><Link className="text-link" href="/">Return home</Link></main>;
}
