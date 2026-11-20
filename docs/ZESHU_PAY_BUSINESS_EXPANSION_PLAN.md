# Zeshu Pay — Business Expansion Plan

Status: planning only. This document does not enable any payment provider, biller, wallet, lending, insurance, or collection service.

## Objective

Build Zeshu Pay as a customer-friendly digital-services hub for India, starting with reliable recharge and bill payments, then adding partner-backed payment categories and local institutional collections. Prioritise repeat successful transactions, customer trust, positive contribution margin, and low operational risk over the number of service tiles displayed.

## Verified current baseline

- The public customer policy states that mobile plan discovery may be available, but the exposed Razorpay mobile-recharge flow is TEST-mode only and does not submit a real telecom recharge.
- Real utility bill payments are currently unavailable.
- Read-only discovery may include mobile plans, DTH, electricity, FASTag, piped gas, LPG, water and broadband.
- A1Topup execution is OFF. Its current request helper deliberately throws `A1TOPUP_POST_BODY_UNVERIFIED`; do not enable it until the provider's actual request format and status protocol are verified.
- The existing partner page already invites BBPS/Bharat Connect, recharge and utility providers to propose compliant integrations with settlement, commission and dispute-support terms.
- A previous PlanAPI credential was flagged for rotation. Rotate it before any further provider testing; never put credentials in source control or browser code.

## Recommended service roadmap

### Phase 0 — Trust and commercial foundations

1. Maintain a clear service-availability matrix: discovery-only, sandbox, production-ready, paused.
2. Remove any customer journey that could confuse plan lookup, bill fetch, payment authorisation, provider fulfilment and final settlement.
3. Create a provider scorecard covering authorisation/role, biller coverage, Telangana serviceability, onboarding fees, recurring fees, per-transaction charges, commission, settlement timing, refunds, disputes, support SLAs, uptime and references.
4. Define transaction ledger requirements: unique client reference, provider reference, idempotency, immutable status history, amount/commission/fee/tax, settlement reference, callback verification and reconciliation.
5. Publish customer-facing charges only after the exact provider and legal model are confirmed.

### Phase 1 — Core repeat-use services

Prioritise categories only where a contracted provider confirms production support:
- Mobile prepaid recharge and postpaid bills
- DTH
- Electricity
- Water
- Piped gas and LPG
- Broadband / landline

For each category, require successful sandbox tests, provider UAT approval, production credentials, live serviceability confirmation, verified callbacks/status enquiry, duplicate prevention, reversal/refund handling, reconciliation reports and customer support escalation before launch.

### Phase 2 — Adjacent bill categories

Evaluate through the same authorised partner or a separately verified partner:
- FASTag
- Credit-card bill payments
- Loan repayments
- Insurance premium payments
- Education fees and other institution billers

Do not advertise a category as payable until its specific billers, payment rails, authorisation model, settlement and dispute processes are confirmed. Credit/loan/insurance services must be payment-only unless Zeshu separately obtains the required permissions and agreements for any regulated product distribution.

### Phase 3 — Jagtial institutional partnerships

Pilot with a small number of willing institutions:
- Schools and colleges
- Coaching centres
- Apartment associations
- Local service businesses

Start with institutions that can provide a written collection mandate, verified biller/collection workflow, reconciliation file, refund and dispute process, customer receipt format, data-sharing terms and agreed fee model. Do not collect money into an informal Zeshu account or represent a manual transfer as a regulated bill payment.

### Phase 4 — Assisted digital access

After online flows are stable, assess local Zeshu agent/service points. Before activation, confirm whether the proposed role is permitted under the selected partner's Agent Institution or other approved model, complete onboarding/KYC/training, define cash-handling limits and receipts, and implement daily reconciliation and fraud controls. Do not launch cash collection or cash-out merely as a convenience feature.

## Customer experience requirements

- One clear service search and category list, with unavailable categories labelled accurately.
- Show biller, consumer identifier (masked where appropriate), bill amount, due date and all charges before confirmation.
- Distinguish bill fetch from payment; show pending separately from success or failure.
- Never ask customers to retry while a transaction is pending. Provide status refresh and a support reference.
- Issue a receipt with Zeshu reference, provider reference where safe, biller, amount, date/time and final status.
- Provide a visible complaint/refund route and clear expected timelines.
- Support English, Telugu, Hindi and Urdu; preserve right-to-left layout for Urdu.
- Do not store UPI PIN, card CVV, banking passwords or OTPs.
- Do not add a convenience fee unless contractually permitted, legally compliant and disclosed before payment.

## Commercial model and launch gates

Potential revenue sources, subject to contract and applicable law:
- Provider-paid transaction commission
- Institution-paid collection/service fee under a written agreement
- Merchant/agent service fee only where the partner and applicable rules permit it
- Sponsored placements only if clearly labelled and never used to influence payment outcomes

For every service, calculate contribution per successful transaction:
`provider commission + permitted customer fee - provider charge - payment cost - support/refund/fraud cost - applicable tax`.
Do not launch a category with unknown or negative unit economics unless there is an explicit, capped and approved customer-acquisition pilot budget.

No guaranteed order volume, earnings, commission or serviceability should be promised without written evidence.

## Partner outreach requirements

Ask each candidate to provide:
1. Legal entity details and exact regulatory/network role (including relevant authorisation or sponsor relationship).
2. Supported categories and live biller list, with Telangana/Jagtial coverage.
3. Integration/API documentation, sandbox credentials and UAT checklist.
4. Full pricing schedule: setup, annual/monthly, per-transaction, minimums, deposits, commissions, taxes and settlement deductions.
5. Transaction state machine, callback signing, status enquiry, idempotency, reversals, refunds, disputes and reconciliation samples.
6. Settlement cycle, nodal/escrow or settlement arrangement as applicable, and responsibility for customer complaints.
7. Support contacts and measurable SLAs.
8. Reference customers and permission to contact them.
9. A no/low-upfront Jagtial pilot proposal with measurable success criteria.

Email-first partner evaluation is preferred. No call is required unless Zeshu chooses one later.

## Pilot scorecard

Run a limited pilot only after all launch gates pass. Track:
- Eligible billers and serviceable PIN codes
- Bill fetch success rate
- Payment success and pending rates
- Reversal/refund rate and time to resolution
- Duplicate/unknown transaction count
- Settlement and reconciliation variance
- Support tickets per 100 transactions
- Contribution margin per successful transaction
- 30-day repeat customer rate

Expand only after a review of customer outcomes, compliance, operational reliability and positive unit economics.

## Immediate next actions

1. Continue written negotiation with Adloggs for a detailed business proposal; evaluate it as a possible ONDC/logistics/seller-growth partner, not as a confirmed BBPS bill-payment provider.
2. Shortlist authorised Bharat Connect/BBPS partners and request written commercial + technical proposals.
3. Rotate the previously exposed PlanAPI credential before any provider testing.
4. Keep A1Topup execution and real utility payments OFF until request/response formats, callbacks, status checks, reversals and settlement are verified.
5. Audit the current Zeshu Pay UI and API routes against the availability matrix before changing customer-facing labels or activating services.

## Explicit non-goals for this phase

- No independent BBPS operation or claim of being an authorised Operating Unit.
- No lending, insurance selling, investment advice, wallet issuance, UPI PSP or cash-out activity without the required permissions and agreements.
- No production enablement based only on a successful test payment or bill lookup.
- No production deployment or provider activation from this planning document.
