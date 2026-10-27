# Zeshu WhatsApp — free-first messaging policy

Updated 27 October 2026.

## Live state

The Zeshu Cloud API business number remains connected. Signed incoming callbacks and private inbound message storage work. Admins can save **unsent drafts only**. We have deliberately **not** enabled Cloud API sending, AI-generated customer sends, template senders, marketing blasts, cron sends or mobile-app Coexistence.

## Price facts (India, effective 1 October 2026)

Meta's WhatsApp Business Platform bills delivered outgoing messages as follows, before applicable GST and any provider markups:

| Type | Indian recipient |
|---|---:|
| Inbound messages the customer sends to Zeshu | Free |
| Service replies (non-template, within 24h after the customer messages) | First 1,000 per business number per month free; thereafter ₹0.115 each |
| Utility templates | ₹0.115 each |
| Authentication templates | ₹0.115 each |
| Marketing templates | ₹0.8631 each |

Meta's authoritative current rate card: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing

The 1,000-free allowance applies to the Meta phone number across sending sources; the current Zeshu private Inbox does not have a provider-verified remaining-quota counter. Therefore neither a local database counter nor a manually entered usage estimate can **guarantee** that a send is free. A pre-filled draft, visible phone number, message preview or send button is not proof of zero price.

## Non-negotiable controls

- **No paid sends without fresh, explicit spending approval from the owner** with a maximum budget. The statement “enable it, if sending/receiving are free” does **not** authorize chargeable templates or service messages beyond the free tier.
- Inbound webhook access remains active. Outbound Inbox API continues to permit `save_draft` only and returns `canSend:false`; never turn on an API/cron sender or public UI using a frontend toggle alone.
- Do not represent all customer replies as free; the allowance resets per Meta calendar month and billable service messages can start beyond 1,000.
- No proactive marketing, bulk broadcasts, campaigns, promotion charges, utility order alerts or authentication template charges without the owner's approval.
- Future controlled-send implementation needs correct 24h-window checks, admin-only authentication, opt-in audit, provider-verified billing/free quota and fail-closed spending limits; require a reviewed test and separate go-live permission.
- Do not deregister the current number to try WhatsApp Business mobile login or Coexistence. It is an independent Meta registration project.

## Tree campaign

Tree planting is parked. The production Zeshu Green program is `PAUSED`, with zero funded quota and no tree commitments. Do not create a checkout tree charge or plant/sponsor anything without later owner authorization.
