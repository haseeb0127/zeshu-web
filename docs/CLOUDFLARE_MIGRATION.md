# Zeshu Cloudflare migration

## Goal

Move the Zeshu Next.js application from Vercel to Cloudflare Workers without changing the production customer experience, payment safety model, Supabase database, Hostinger email, Razorpay configuration, Shiprocket configuration or DNS until staging passes.

## Strategy

1. Keep `zeshu.in` on the current production host while Cloudflare is prepared.
2. Run Cloudflare's current Next.js compatibility check in CI.
3. Use a separate Cloudflare Workers staging deployment.
4. Copy only the required environment variables into Cloudflare's encrypted secrets/build variables. Never commit or paste live secrets into the repository.
5. Test storefront, search, login, cart, saved addresses, admin, vendor, rider, Supabase, Razorpay TEST checkout, webhooks, Shiprocket quote flow, PWA and mobile layouts.
6. Cut over the domain only after staging passes.
7. Keep the previous production deployment available briefly as rollback.

## Next.js path

Cloudflare currently recommends vinext for existing Next.js 16 applications, but vinext is still beta. Zeshu therefore starts with a non-destructive compatibility check before any runtime conversion. If compatibility gaps affect payments, authentication or server routes, use the documented OpenNext adapter instead of forcing a risky migration.

## Production safety gates

- No DNS cutover before payment and webhook tests pass.
- No live payment is required for migration testing; use gateway sandbox/test environments.
- No payment gateway secret is stored in GitHub.
- No customer-facing multi-gateway routing is enabled until each provider has merchant approval, credentials, webhook verification and reconciliation coverage.
- Current Razorpay flow remains the production path until the smart router is explicitly enabled.
