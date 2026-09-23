# Zeshu Customer Support Operations

## Goal

Give customers one support experience across every Zeshu service while keeping money, safety and provider disputes protected by human review.

Supported customer topics:

- Shopping & Orders
- Marketplace / sellers
- Delivery & Address
- Rides
- Courier & Cargo
- Car Share
- Travel
- Pharmacy & Health
- Recharge & Bills
- Zeshu Cash & Referrals
- Payments & Refunds
- Account & Safety

## Support layers

### 1. Zeshu Assistant

The assistant should resolve informational and read-only questions first.

Safe self-service examples:

- service availability and Coming Soon status;
- product discovery, stock and current catalog price when live context is available;
- recent order status for a signed-in customer;
- order-status meanings and tracking guidance;
- Zeshu Cash balance/history for a signed-in customer;
- delivery-area/address guidance;
- marketplace trust labels, invoice and warranty guidance;
- Move & Travel availability, provider-readiness rules and launch-gate explanations;
- recharge/bill service availability;
- app installation, language, referral and policy questions.

The assistant must not invent:

- live fare or ETA;
- driver, vehicle or provider assignment;
- booking/payment/refund success;
- stock, price or serviceability when no live context exists;
- launch dates;
- provider-specific baggage, parcel, cancellation or warranty terms that have not been verified.

### 2. Automatic human handoff

The assistant should create or route a signed-in support conversation when the case requires protected review.

Always hand off:

- safety incident or emergency-related platform report;
- money debited / duplicate charge / uncertain payment;
- refund, replacement or cancellation decision on a specific order;
- missing, wrong, damaged or spoiled item claim;
- lost/damaged parcel or courier claim;
- ride, courier, travel or recharge/bill provider dispute;
- protected account change;
- explicit request for a human;
- repeated failure where self-service did not solve the issue.

The customer should not have to repeat the issue after automatic handoff.

## Queue priority

1. **URGENT** — safety, accident, threat, harassment, assault, danger.
2. **HIGH** — payment/refund disputes, duplicate debit, provider money dispute, lost/damaged parcel.
3. **SERVICE** — rides, courier/cargo, car share, travel, recharge/bills, marketplace/seller, pharmacy and delivery service questions.
4. **NORMAL** — routine account, rewards, navigation and general questions.

These are internal queue priorities, not a public response-time promise.

## Service-specific support ownership

### Shopping / marketplace
Support should be able to see the relevant order, seller, fulfilment class, payment reference and product snapshot. Seller/manufacturer warranty terms remain authoritative where applicable.

### Delivery
Support should distinguish product-delivery tracking from future on-demand courier jobs. Never treat a marketplace courier quote as proof that Zeshu Bike Courier is live.

### Rides / Car Share
Until customer booking is enabled, answer availability and safety/process questions only. Do not invent drivers, fares or ETAs.

### Courier / Cargo
Until the on-demand provider is verified, explain the planned pickup → quote → confirmation → tracking → proof-of-delivery flow. Provider-specific limits remain authoritative.

### Travel
Until booking is live, explain the planned service and authorized-provider requirement. Supplier fare, baggage, room, ticket, cancellation and refund rules become authoritative once a real supplier is shown.

### Recharge / Bills
If a transaction is uncertain, do not retry through another provider until the original status is conclusively failed/reversed/cancelled. Reconcile first.

### Pharmacy
Prescription medicine fulfilment remains disabled until the licensed-pharmacy and prescription/compliance flow is approved.

## Security

Support must never request:

- OTP;
- password;
- full card number;
- CVV;
- UPI PIN;
- API key;
- access token;
- provider secret.

Secrets detected in chat should be rejected/redacted before model use.

## AI production mode

Guided/rules-based support should remain useful even when the external AI model is off.

Real model mode requires:

- server-side OPENAI_API_KEY;
- SUPPORT_AI_ENABLED=true;
- approved privacy/cost controls;
- successful informational QA;
- successful signed-in automatic handoff QA.

Do not put the key in source code or any NEXT_PUBLIC variable.

## Remaining external launch gates

The following cannot be completed only in code:

- mobility/logistics/travel commercial agreements;
- provider sandbox and production credentials;
- provider settlement and commission terms;
- live serviceability, quote, cancel/refund and webhook tests;
- Telangana/India transport compliance for paid rides and car sharing;
- licensed pharmacy partner and prescription workflow;
- authorized recharge/bill production integration;
- a staffed support owner/escalation rota.

Until those exist, customer UI must continue to show the affected service as Coming Soon or discovery-only and must not accept payment.
