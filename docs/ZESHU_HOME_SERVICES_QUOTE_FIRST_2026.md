# Zeshu Home Services — Jagtial quote-first pilot
Last reviewed: 23 November 2026

## True current state
- Services hub already exists at `/professional-services`, alongside Weddings, Interiors and Dine. `/services` currently navigates to Pay (digital bills): do not hijack this legacy URL.
- First-wave local-service enquiries are now staged at `/professional-services/home-services`. This reuses the existing private `professional_service_enquiries` and admin triage system, with a new `HOME_SERVICES` type, category field and strict Jagtial town control.
- Product provides **free enquiry only**. It does **not** assign a verified technician, quote a fixed visit cost, collect money, confirm booking, schedule a visit, start child/domestic placement or activate real-time dispatch.
- Provider recruitment uses the existing `/partners?type=HOME_SERVICE_PRO#partner-apply` lead form. Interest is free. Provider application must not be displayed as approval or a Verified badge.

## Wave 1 — enquiry intake (Jagtial only)
- AC service and repairs (no unauthorised refrigerant handling)
- Electrician / plumber
- RO purifier and household appliance repairs
- Salon appointments, beautician, mehndi and event makeup (customer needs and suitability matter; do not enforce a universal exclusionary gender rule)
- No fabricated pricing or provider ratings; only display a named professional with verified identity and credentials.

## Held until specific safeguards and operational capacity
- Babysitting/childcare, in-home tutoring involving minors, and full-time domestic staff or placement;
- Deep cleaning by unvetted teams and unattended/overnight access;
- Online teaching involving children (online does **not** remove safeguarding/privacy concerns);
- Highly regulated home services requiring specialist licences;
- Work outside approved service town, including nationwide bookings without qualified remote providers.

## Provider-set service menus and plans (proposals, NOT LIVE)
- A shared service-menu catalogue now defines standard scope units per eligible Jagtial category; qualified providers enter *their own* proposed labour prices. No rate, work photo, review, provider verification or availability is published on this basis. Unknown materials and complex work must use a written quote.
- Provider application `/partners?type=HOME_SERVICE_PRO#partner-apply` now captures private primary category, optional menu prices, chosen free travel radius (0/3/5/10/15 km), optional additional per-km travel charge, materials/brand exclusions and preferred future plan; these fields become a structured proposal in the existing private admin lead inbox. No public provider profile/instant-bookable price is created.
- **Free pilot:** signup and review remain free; customers may submit free manual enquiries. No wallet, monthly subscription or lead fee is charged.
- **Future pay-as-you-go:** proposed ₹15 for accepted qualified quick opportunities and ₹50 for accepted qualified premium opportunities. Eligibility must require genuine, reachable, serviceable non-duplicate customer requests. Define fair time windows for failed/no-contact/disputed lead credits.
- **Future subscription:** ₹299 per month (proposed GST-inclusive, subject to confirmation) for eligible qualified opportunities without per-lead fee during subscription period, subject to published fair-use, cancellation, invoice and explicit opt-in. No automatic conversion or renewal.
- **Future seasonal ₹200 credit pack:** proposed nonexpiring credits solely against Zeshu's own platform charges; **do not activate, sell, escrow, display a balance, top up or deduct** until PSP, RBI/PPI, GST, customer contract, refund and accounting/legal review. Unused prepaid balances are liabilities until fees are earned. Any rollover/expiry rights must be formalised under applicable law.
- Menu cards must disclose provider-defined included work, travel radius/extra travel, visit charges, minimum home-visit order if any, brand/parts line items, applicable taxes, written approval before extras and complaint handling. No fabricated Jagtial market rates or fake ratings.
- Customer household help and childcare/domestic placements remain held; these were NOT added to booking.
- Direct Cash/UPI collection by professionals is NOT assumed to eliminate Zeshu's service-operator GST obligations. Obtain a category-specific Section 9(5) review and assess Telangana gig-worker obligations before enabling real bookings.

## Illustrative tax-exclusive figures (assuming prices include 18% output GST)
- ₹15 lead = ₹12.71 revenue + ₹2.29 GST
- ₹50 lead = ₹42.37 revenue + ₹7.63 GST
- ₹199 subscription = ₹168.64 revenue + ₹30.36 GST
- ₹299 subscription = ₹253.39 revenue + ₹45.61 GST
- ₹200 credits, if ever approved, cannot be recognised as Zeshu's profit when merely loaded.
- ₹65 digital screening is an assumption, not provider quote; at ₹10 GST-inclusive per booking Zeshu receives ₹8.47 ex-GST and ~7.7 bookings are needed just to recover ₹65 before payment/support/operations. ₹250 hypothetical deeper screening needs ~29.5.

## Worker and consumer protection gates
- Telangana's 14-Nov-2026 Platform Based Gig Workers Rules: counsel/CA to determine applicability by actual engagement model, platform and worker registration/reporting, welfare contributions, and grievance duties. Home services explicitly deserves separate compliance assessment.
- Identity, work qualifications, safe handling training, valid address/contact, references and job-specific background/police clearance should be documented, with enhanced screening for roles involving vulnerable people or private-home access. A court-name match or digital API result never proves a clean police verification. Offer fair human review of potential mismatches.
- Privacy: collect minimum necessary data, keep home-visit locations and private notes inside admin, explicit enquiry contact consent, separate marketing consent, secure document upload only through a purpose-built protected process, suitable data retention/delete process. Do not collect Aadhaar/OTP on public forms.
- Customer safety: show real worker's matched photo once verified, any relevant qualifications, accurate rate card and inspection-fee terms. Provide easy rescheduling, complaint escalation and faults/cancellation/refund rules. Do not force women customers into a specific provider gender without a lawful and practical customer preference option.
- Before booking/payout activation: provider agreement, liability and insurance assessment, genuine tested availability, support team, documented customer feedback and refund/dispute operating procedure, CA-confirmed GST treatment.

## Code & launch verification
- Home-service web form uses `GET /api/professional-services/enquiries` as a fail-closed schema/readiness check, and `POST` validates approved categories, Jagtial, consent, genuine phone and dates. Shared per-process rate limiter plus DB daily contact cap. No payment/wallet endpoint.
- Private table adds `service_category`; constrained to eight safe pilot services. Keeps existing RLS; anonymous and authenticated roles have no direct table privileges. Admin inbox sees the category and retains current authorised-only status updates.
- Partner application `HOME_SERVICE_PRO` type is recognised both by API and DB constraints; no partner gets auto-approved.
- Verify schema in staging before production and run `.github/scripts/home-services-quote-first-qa.ts`, full Next.js build, Cloudflare compatibility, staging/browser QA and exact-SHA production promotion.
- Test real customer enquiry -> private admin queue with a **consented internal QA record only**; do not create fake customer reviews, paid bookings, or invented verified providers.
