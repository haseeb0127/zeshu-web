# Zeshu Move: quote-first operations and approved district supply (23 Nov 2026)

## State verified before this change
- Production `move_quote_enquiries`: 0 customer enquiries.
- Production `driver_service_eligibility`: 0 approved/verified/active records.
- All 4 `move_dispatch_settings` categories: request_enabled=false and matching_enabled=false.
- Zeshu is NOT ready to promise an instant auto/cab/courier/truck. An interest registration is not a signed operating contract.

## Existing no-cost operator acquisition
The site already has `/earn#join` and secure `/earn/onboard` driver document verification. Do not create a duplicate app or ask drivers for confidential KYC files in marketing forms.

- Cabs and charter bus operators: `/earn?role=PASSENGER_FLEET_OPERATOR#join`
- Mini and large goods trucks: `/earn?role=LOGISTICS_FLEET_OPERATOR#join`
- Individual eligible drivers: `/earn/onboard`
- Start with verified operators in Jagtial and Dharmaram, then Korutla/Metpally, then Dharmapuri.
- Capture business name, real home town, operating towns/routes, vehicle class and fleet size, service availability, contact and opt-in before asking for secure document proof.
- Verify yellow-board / commercial registration when required, DL, RC, insurance, fitness, goods/passenger permit, and operator contract. Do not display a verified badge before checks pass.

## Internal manual quote service-level targets (not public guarantees)
- Review new enquiries within **4 staffed working hours**, ideally sooner for next-day trips. Admin highlights unreviewed cases aged >=4 hours and trips within 48 hours.
- Contact the requester with their consent; log `last_customer_contact_at` and private case notes.
- Source provider quotes only from genuinely verified vehicle owners after document checks. The absence of a suitable provider must be communicated honestly; never fabricate prices, availability or 2-3 competing quotes.
- Written quote should capture named operator, vehicle class, seating/load, GST classification, fixed package/included kilometres/hours, waiting/loading, extra stops, helpers, tolls/parking/taxes, full expected amount, payment recipient, validity, cancellation/refund and fallback.
- Only mark an enquiry **QUOTED** once itemized operator evidence has been recorded privately and the customer has been told the real terms. The API requires substantive private notes; do not enter licence numbers, Aadhaar, bank details, OTPs or full private documents.
- Enquiries do not create automatic bookings or monetary liabilities. Bus advances must not be requested by Zeshu; owner-direct payments require clear owner identity, genuine written customer agreement and applicable tax compliance.

## Admin flow
1. Open `/admin/move/quotes` with an authorised administrator account.
2. Work the “Needs attention” queue first; filter by pickup town/status as supply grows.
3. NEW: validate trip and contact consent. REVIEWING: confirm scope and date. SOURCING: check verified operator availability. QUOTED: enter actual written operator quote and proof of a communicated breakdown, not an illustrative estimate. CLOSED/CANCELLED: final case outcome.
4. Use the contact attempt action only after actually calling/messaging the customer. Operator callbacks may not be shared with the public without consent.
5. Review daily demand per town/category alongside verified fleet applications. The matching fields remain OFF until separate legal, provider, payout and driver-online QA proves instant serviceability.

## Business model
- Fleet application, interest registration and quotation request: **free** at launch.
- No daily ₹50–₹100 passes, ₹299 subscriptions, per-trip commission, unverified driver revenue promise or seller payout modifications are activated by this code.
- Once demonstrated demand exists, separately approve a transparent monthly partner plan or optional clearly labelled featured placement. Confirm GST treatment, cancellations, invoices, driver welfare contributions and fair operator terms before activation.
- Do not add automatic personal-phone dissemination to operators. Owner/staff manually review and contact vetted providers.

## Regulatory, safety and cost guardrails
- Telangana Gig Workers Rules G.O.Ms.No.18 published 14 Nov 2026; assess registration/data reporting, welfare contribution, grievance and fair payout duties with counsel; do not treat worker interest as a transport permit.
- Passenger bike taxi and unrelated per-seat stranger pooling: held pending proper Telangana authorisations.
- District instant hubs need observed active supply, legal documents, pickup-time evidence, support coverage and test cancellations; 10–15 sign-ups alone are not permission to launch.
- Google Maps: use SKU-specific India billing eligibility/quotas. Do not promise a universal 70,000 free call pool or ₹0 cost.
- Courier national checkout, Razorpay LIVE, Cashfree split payout and local pilot handling fees remain separately blocked under their existing rollout flags.
- Customer privacy requests go through `privacy@zeshu.in`; no quote-admin notes are returned to public clients.

## Final verification
- Migration `supabase/migrations/20261123020000_move_quote_admin_followup.sql` applied to staging and production with protected `admin_notes` and `last_customer_contact_at`. No public table-read grants.
- CI checks: `.github/scripts/move-operator-triage-qa.ts`, existing Move matching, move district quote, homepage, build and Cloudflare checks.
- Check production deployment URL and test admin auth with real logged-in account before public promotion. A successful GitHub merge alone does not prove Cloudflare production traffic has promoted.
