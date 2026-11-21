# Zeshu Pay: safe provider-first launch plan

Updated 21 November 2026. Zeshu is an asset-light Indian marketplace/service platform.

## Current honest state
- `/pay` gives customers one mobile-first entry page for prepaid, electricity, DTH, FASTag, LPG, water, broadband and information-only UPI tools.
- Discovery tools previously existed inside the Zeshu storefront `/?view=services&service=<id>`; no real charge or transaction is initiated by the new Pay page.
- Real recharge fulfilment remains intentionally unavailable (`/api/process-recharge` fails closed). Utility payments, UPI merchant acceptance and cashback execution are NOT active.
- PlanAPI-based read-only plan discovery is conditional on an approved, configured credential; an earlier exposed credential must be rotated before further partner testing. A1Topup execution stays OFF.
- Existing Razorpay mobile recharge TEST path is not a telecom recharge; a successful test gateway response never proves provider fulfilment.
- Zeshu must not claim real transaction success, money transfer, bank status or bill receipt without a signed provider reference and settled status.

## Provider selection and legal review
1. Verify potential counterparty's legal name, licensed BBPS/Bharat Connect role (COU, authorised BBPOU, certified Agent Institution or appropriately integrated TSP), business agreement, KYC, current account / GST details and onboarding fees.
2. Ask for a **sandbox** with verified supported categories/biller list and availability in all India where licensed; verify mobile recharge partner scope separately.
3. Obtain fee schedule **in writing** (commissions by operator/biller, MDR/service fee, GST basis, settlement cycle, minimum balance/deposit, refund fees, and available free tier). Don't advertise cashback before contribution margin is proven.
4. Establish non-custodial payments wherever possible: provider/authorised participant handles regulated collection and settlement. Confirm actual Zeshu legal role with CA/legal counsel.
5. Do not enable customer charging until merchant KYB/provider contracts, applicable GST invoicing, privacy and grievance policies are approved.

## Transactions: non-negotiable safeguards
- Server-controlled prices, verified bill amount, biller/reference lookup, clear pre-payment fee/amount and customer confirmation.
- Server-side authentication and rate limiting, idempotency keyed by `user + biller + consumer reference + invoice version` or a bounded recharge request. Reject duplicate active attempts.
- Create a pending ledger with unique references before gateway requests; redirect callbacks never mark success on their own.
- Verify gateway and provider signatures independently; ledger state machines treat `PENDING` and `UNKNOWN` as **do not retry/charge again**.
- Provider success proof and transaction receipt; delayed reversals and reconciliation from both systems.
- Show failed, pending and completed states clearly without inventing a completed recharge.
- Refund/reversal request and SLA, human support escalation and consumer grievance route.
- Store secrets only as Cloudflare server-side secrets; redact telephone/account references in analytics/logs.
- Real-money launch requires explicit owner approval and staged rollout by one provider/category.

## Recommended sequence
1. **Now / safe:** Make Pay discoverable as a dedicated customer-facing section, with clear no-transaction status and multilingual labels; maintain original read-only service tools.
2. **Provider onboarding:** Compare certified Bharat Connect partner and telecom recharge providers including A1Topup and other candidates only after written commercial terms. Validate the old exposed PlanAPI credential has been rotated.
3. **Staging:** Complete a dummy-only end-to-end bill fetch/checkout/fulfilment/reconciliation/refund suite without real customer funds. Include failure, timeout, duplicate requests, negative callbacks and late successes.
4. **Pilot:** After approval, one low-risk category, tight test limits, customer support and manual reconciliation daily. Grow only when proven.
5. **Later:** DTH/FASTag/electricity categories, broad BBPS, merchant QR/UPI only with appropriately authorised partners, Zeshu Cash funded rewards when unit economics are positive.

## Separate Zeshu Green programme
The `/green` goal (one verified planted tree per eligible completed order) is in planning only. Do not advertise trees as planted or promise automatic 1:1 planting until an independently verified and funded planting partner, land permission, species/care plan, and fulfilment evidence are approved. Never add a tree surcharge by default.

References:
- RBI Master Direction (Bharat Bill Payment System) Directions, 2024: https://rbi.org.in/SCRIPTs/BS_ViewMasDirections.aspx?id=12616
- NPCI Bharat Connect official participants and programme: https://www.bharat-connect.com/about/
- Internal Zeshu gates: `docs/EXTERNAL_LAUNCH_GATES.md`, `docs/WEB_LAUNCH_CHECKLIST.md`.
