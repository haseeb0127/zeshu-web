# Zeshu Unified Customer Support

## Objective

Zeshu should present one support experience across every customer-facing service while keeping operational risk low.

Customer support coverage includes:

- Shopping and grocery orders
- Marketplace sellers and nationwide products
- Local delivery and rider tracking
- Payments, refunds and payment reconciliation
- Recharge and bill services
- Pharmacy & Health
- Bike Ride, Auto, Cab and Rental Car
- Bike Courier, parcel, cargo and Shop Delivery
- Car Share
- Bus, Train, Flights, Hotels and Experiences
- Account/login/OTP, addresses, referrals and Zeshu Cash
- Safety and grievance handling

A service may be Coming Soon and still have customer support. Informational support must never imply that booking, payment or fulfilment is live.

## Assistant-first model

Use Zeshu Assistant for high-volume, low-risk questions:

- feature availability and Coming Soon status;
- order status and read-only totals;
- current catalog/stock/price where live context is available;
- Zeshu Cash balance/activity;
- delivery/service-area questions;
- seller trust labels and marketplace fulfilment;
- login/OTP navigation;
- referral and app-navigation help;
- ride/courier/car-share/travel launch and safety explanations;
- general refund/cancellation policy explanations;
- pharmacy/digital-service availability.

The assistant should match the customer's language where possible and keep answers concise.

## Human-review cases

Human support is mandatory for:

- money debited / duplicate / disputed payment;
- specific refund, replacement or cancellation decisions;
- wrong, missing, damaged, spoiled or materially different item claims;
- lost/damaged parcel or provider-service dispute;
- ride/courier/travel charge dispute;
- safety, harassment, accident, threat or emergency-related platform record;
- protected account changes;
- explicit request for a human;
- repeated failure of assistant guidance.

The assistant must not turn these into a self-service resolution even if an external AI model suggests otherwise.

## No-repeat handoff

When automatic handoff is available, Zeshu should create the support conversation with:

1. the customer's original question;
2. the assistant response/context;
3. a useful subject/category;
4. WAITING/OPEN state for admin attention.

The customer should not need to retype the issue.

## Admin priority

Inbox order should prioritize:

1. **URGENT** — safety, accident, emergency, harassment, threat, assault or danger.
2. **HIGH** — payment/refund/debit/provider dispute, lost/damaged parcel.
3. **SERVICE** — rides, courier/cargo, Car Share, travel, recharge/bills.
4. **NORMAL** — routine support.

Resolved conversations remain below unresolved conversations.

## AI availability

The support API supports two modes:

- **guided** — deterministic Zeshu knowledge and read-only account/catalog context;
- **ai** — the same guardrails plus the configured language model.

Core support must remain useful in guided mode so model downtime or a disabled AI flag does not break customer service.

Real AI mode requires both:
- `SUPPORT_AI_ENABLED=true`
- a server-side `OPENAI_API_KEY`

Do not put the API key in browser code or source control.

## Security

Never request or repeat:
- OTP;
- password;
- card number;
- CVV;
- UPI PIN;
- API key;
- access token;
- secret key.

Do not claim a payment, refund, booking, recharge, cancellation, account change or provider fulfilment was completed unless authoritative read-only context proves it.

## WhatsApp

Transactional WhatsApp support updates remain gated behind the existing readiness checks and feature flags. Do not enable customer-facing WhatsApp support until Meta credentials, phone/business verification, template readiness and sending tests are complete.

## Go-live checklist

Before increasing AI automation:

- confirm the support assistant GET readiness response;
- verify automatic handoff creates a real support conversation;
- test safety, payment and refund prompts always escalate;
- test routine order/catalog/reward questions resolve without a ticket;
- test Ride/Courier/Car Share/Travel questions never imply booking is live;
- test Telugu, Hindi and Urdu storefront support labels;
- verify admin inbox priority order;
- verify support notifications distinguish urgent safety cases;
- run staging browser QA and production smoke;
- enable AI mode only after server-side key and cost/usage monitoring are ready.
