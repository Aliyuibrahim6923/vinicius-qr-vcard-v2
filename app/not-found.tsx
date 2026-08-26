import Link from "next/link";
export default function NotFound() {
  return <main className="center-page"><div className="brand">VG</div><h1>Card unavailable</h1><p>This contact card does not exist or is no longer active.</p><Link href="/">Return home</Link></main>;
}
