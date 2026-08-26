import Link from "next/link";

export default function Home() {
  return <main className="center-page"><div className="brand">VG</div><h1>Vinicius Group</h1><p>Official digital contact cards.</p><Link className="button" href="/login">Administrator sign in</Link></main>;
}
