# Zeshu — Meta WhatsApp integration checklist (pre-launch)

This is a **read-only / no-send** setup checklist. The Zeshu WhatsApp sender and customer opt-in UI MUST remain off until the owner explicitly approves a consented pilot.

## What the existing Meta screenshot proves
Meta WhatsApp Manager shows three templates with an **Active** UI badge, including a first support-named **Marketing** template and a support-named **Utility** template. Template names are truncated, so we cannot yet safely choose exact API names, language codes, or supported parameters. "Active" on Meta does **not** prove the Cloud API phone ID, access token, webhook subscription, or delivery status.

## Finish configuration (secrets never go in ChatGPT or GitHub)
1. Open Meta WhatsApp Manager, select Zeshu's business account and inspect **each template**. Copy the *exact* name, language locale, category, and body into your own secure setup notes. For support replies/resolutions, use an approved **Utility** template. If a template includes `{{1}}`/dynamic fields, the current Zeshu sender cannot send it until parameter mapping is implemented.
2. In Meta for Developers / WhatsApp API Setup, identify the **WhatsApp Business Account ID (WABA ID)**, sending **Phone Number ID**, and app. Use a valid **system-user Cloud API token** with appropriate permissions; do not use an expiring development/test token for production.
3. Configure the Cloudflare Worker secrets/variables for Zeshu: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_GRAPH_API_VERSION`, both `WHATSAPP_SUPPORT_*_TEMPLATE_*` pairs, `WHATSAPP_APP_SECRET`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `CRON_SECRET`. Enter credential values in Cloudflare only, never upload screenshots displaying them. Keep `SUPPORT_WHATSAPP_SENDER_ENABLED=false` and `NEXT_PUBLIC_SUPPORT_WHATSAPP_UI_ENABLED=false`.
4. Configure Meta webhooks: callback URL **https://zeshu.in/api/webhooks/meta-whatsapp**, verification token matching the Cloudflare secret, subscribe to the WhatsApp **messages** field and subscribe the Zeshu WABA to the app. The GET verification endpoint echoes Meta's challenge only when the configured token matches. The signed POST handler verifies `x-hub-signature-256` and records delivery statuses.
5. Open Zeshu's private **/admin/whatsapp** status page, sign in as a Zeshu admin and press **Refresh**. Its Meta checks list the exact two configured templates (read-only). Both must show approved Utility without unsupported placeholders. Check that the cron secret is present; this alone does not prove a scheduler is running.
6. Before enabling sender: verify a real system-user token, ownership of sender phone, completed webhook handshake/subscription, observed webhook delivery in test environment, one *explicitly opted-in* test recipient with a verified phone number, and no unexpected outbox backlog. Obtain the owner's separate approval to send the first test and to turn on messaging.
7. Once an approved pilot has succeeded, schedule the authenticated `/api/cron/support-whatsapp` endpoint securely. Do not expose `CRON_SECRET` in logs. Customer opt-in must be transparent and revocable. Enable the sender and later the UI in separate controlled releases.

The status page does **not** send WhatsApp messages, subscribe apps, write templates or turn on any flag.
