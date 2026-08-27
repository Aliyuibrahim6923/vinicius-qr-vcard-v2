# Vinicius Group QR vCards

A responsive managed QR platform backed by Supabase Postgres and Supabase Auth. Every printed QR resolves through a permanent `/q/{code}` URL whose destination can be reassigned to an employee profile, employee vCard, website, document, or another approved HTTPS URL.

## Set up Supabase

1. Create a Supabase project (or add Supabase from the Vercel Marketplace).
2. Apply every SQL file in `supabase/migrations` in filename order using the Supabase CLI, or run them in the Supabase SQL editor.
3. Create an administrator in **Authentication → Users**.
4. In the SQL editor, assign that user the admin application role:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'admin@example.com';
   ```

5. Copy `.env.example` to `.env.local` and fill in the project URL, publishable key, secret key, and canonical production URL. Never expose the secret key to the browser.
6. Install dependencies and run the app:

   ```bash
   npm install
   npm run dev
   ```

## Production configuration

- Set the Supabase JWT expiry to **28,800 seconds (8 hours)** under Authentication settings.
- Disable public sign-ups; create admin accounts through the dashboard only.
- Keep leaked-password protection enabled and require strong passwords/MFA for admins.
- The application enforces five failed sign-in attempts per hashed source IP per 15 minutes. Supabase Auth's own rate limits remain a second layer.
- Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin before printing QR codes.
- Optionally set `QR_ALLOWED_HOSTS` to a comma-separated list of approved external destination domains.
- Use Supabase database backups and document a restore drill and retention policy.
- Run the physical QR and iOS/Android/Outlook vCard compatibility matrix before launch.

## WhatsApp company assistant

The admin dashboard includes a company assistant setup screen. It can index approved HTTPS pages, pasted text, PDF, TXT, and Markdown documents. When enabled, every employee card shows a compact on-page chat icon. A separate **Ask company assistant** WhatsApp action appears when a business number is configured. Employee addresses also open in Google Maps.

1. Apply `supabase/migrations/20260827000000_whatsapp_ai_agent.sql` in the Supabase SQL editor. The migration creates the private knowledge store, vector search, message deduplication, and storage bucket.
2. Add the AI and Meta placeholders from `.env.example` to `.env.local` and to the Vercel project. `AI_GATEWAY_API_KEY` is needed for local development; Vercel deployments may use Vercel OIDC instead.
3. In Meta for Developers, configure the WhatsApp callback URL as `https://YOUR-DOMAIN/api/whatsapp/webhook`. Use the same private value for Meta's verify token and `WHATSAPP_VERIFY_TOKEN`, then subscribe to the `messages` webhook field.
4. Add the permanent WhatsApp access token, phone number ID, Meta app secret, and Graph API version. Redeploy after changing Vercel environment variables.
5. Open **Admin → Company assistant**, add approved knowledge, enter the WhatsApp business number in international format, test the webhook, and then enable the assistant.

The access token, app secret, Supabase secret, and AI key are server-only variables. Never prefix them with `NEXT_PUBLIC_` or expose them in browser code.

## Commands

```bash
npm run dev
npm run build
npm test
npm run lint
```

The database uses RLS: anonymous clients can resolve active employee and QR records only; authenticated users need immutable `app_metadata.role = admin` to read all rows or write. Employee and QR deletion are intentionally not granted. The updated product requirements are documented in `docs/PRODUCT_REQUIREMENTS.md`.
