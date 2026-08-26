import { signIn } from "./actions";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message = error === "too-many-attempts" ? "Too many attempts. Try again in 15 minutes." : error ? "Email or password is incorrect." : null;
  return <main className="center-page"><form action={signIn} className="panel form-card"><div className="brand">VG</div><h1>Administrator sign in</h1>{message && <p className="error" role="alert">{message}</p>}<label>Email<input name="email" type="email" autoComplete="username" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label><button className="button" type="submit">Sign in</button></form></main>;
}
