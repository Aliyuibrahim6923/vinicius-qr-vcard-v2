import { signIn } from "./actions";
import { BrandLogo } from "@/app/components/brand-logo";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const message = error === "too-many-attempts"
    ? "Too many attempts. Try again in 15 minutes."
    : error === "authentication-service"
      ? "Authentication service unavailable. Check the server log and Supabase configuration."
      : error
        ? "Email or password is incorrect."
        : null;
  return <main className="center-page branded-page"><form action={signIn} className="panel form-card"><BrandLogo className="brand-logo-login" priority /><h1>Administrator sign in</h1>{message && <p className="error" role="alert">{message}</p>}<label>Email<input name="email" type="email" autoComplete="username" required /></label><label>Password<input name="password" type="password" autoComplete="current-password" required /></label><button className="button" type="submit">Sign in</button></form></main>;
}
