# Zeshu Super-App + district Move quote-first rollout — 23 Nov 2026

## Current honest state
- One Next.js Zeshu website, login, customer location and Zeshu Cash ledger. Dedicated /pay, /move, /dine, /fashion and /professional-services routes already exist.
- Homepage prioritises five everyday categories (Shop, Meat & Fish, Dine, Pay, Move) and separately marks three quote/discovery categories (Weddings, Interiors, Fashion). Meat/Fish tile scrolls to categories where actual stock/seller safety availability is disclosed. Pay remains plan/service discovery until authorised execution is enabled.
- **No transport driver match or paid booking is activated.** /api/move/readiness reports customer_booking_enabled=false, and production move_dispatch_settings have all four request/matching flags false as of review.
- New /move/quote supports opt-in, scheduled **enquiries only** for Outstation Cab, possible Return Cab, Mini Truck, Large Goods Truck and Marriage/Group Bus. Pickup towns: Jagtial, Dharmaram, Korutla, Metpally, Dharmapuri.
- On successful storage, the customer gets ZMQ reference; operator quotations, dispatch, fares, payment and confirmations remain manual/not guaranteed. No false return cab discount or sub-30-minute ETA.
- Private admin quote inbox: /admin/move/quotes, authenticated admin-only; allows NEW -> REVIEWING -> SOURCING -> QUOTED -> CLOSED/CANCELLED statuses. **No automatic message or lead transmission to unverified operators.**
- Private DB table move_quote_enquiries has RLS and no anon/authenticated grants, only service-role access from verified server routes. Per-phone daily cap, server-side validation, honeypot and required contact consent; no bank, Aadhaar or passport information.
- Public quote endpoint checks the private inbox table before advertising it as operational; missing migration/DB leads to unavailable form rather than false success.

## Phase gates
1. **Hub and navigation** — test mobile Android (low bandwidth), categories and policy/discovery labels. Verify there are no dead links or mobile header regressions.
2. **Scheduled request intake** — deploy RLS schema to staging/production, verify public form -> saved row -> private admin inbox -> manual status transitions; prove spam and consent guards. Assign a real internal administrator to review. Do not claim a guaranteed reply time while operator supply is unverified.
3. **Compliance and Jagtial pilot** — evaluate applicability of Telangana Platform Based Gig Workers Rules G.O.Ms.No.18 (14 Nov 2026): registration, onboarded gig worker database, disclosures, payouts, welfare contributions and grievance process. Confirm transport aggregator licences, yellow-plate cab compliance, carrier permits, DL/RC/fitness/insurance, operator contracts, fare quotation, support and cancellation. Do not hardcode a welfare percentage or deduct it from driver payouts.
4. **Hub-by-hub instant bookings only after verified readiness** — Jagtial and realistically reachable Dharmaram first, Korutla/Metpally next, Dharmapuri afterward. Ten-to-fifteen drivers is only a supply target: require repeat online availability, completed test trips, fare/payment settlement, pickup SLA, low cancellations, audit and legal sign-off. No instant activation by merely toggling settings. The existing readiness code intentionally returns customerBookingAvailable=false until a verified provider adapter and safety checks exist.

## Regulatory holds
- Passenger bike taxis: no passenger matching, payment or promised rides until Telangana Transport approval and insurance.
- Stranger per-seat cab pooling and white-plate commercial rides: do not activate or imply legality from a yellow registration plate alone.
- Shared-fare with known passengers of one contracted full cab is a possible later UX, not per-seat resale.
- Do not add pre-ride tip prompts or require routine passenger Aadhaar uploads.
- Direct operator payment does not remove consumer rights, tax/compliance duties or grievances.

## Maps and cost controls
- Google India pricing generally provides 70,000 monthly free *billable events per eligible Essentials India SKU* and 35,000 for Pro for qualifying India-priced billing accounts; NOT a blanket budget or free calls for every API.
- Use pickup/drop text first, lazy-load map only on map-pin action or route confirmation.
- In Google Cloud set API and project quotas and real spend-budget alerts, inspect Dynamic Maps, Geocoding, Autocomplete, Routes and Places SKU separately; a budget alert does not cap spend automatically.

## Business guardrails
- Don't set fixed mini-truck or marriage bus fares before real Jagtial operator contracts and pickup/parking/waiting/permit tax terms are reviewed.
- Operator subscriptions / ₹50–₹100 day passes are only business ideas, not live charges.
- Show one provider-confirmed all-inclusive quote and itemised extras before a true booking.
- Customer transport requests must never mix into the shopping cart.
- Do not promote 10+ listings, active drivers or guaranteed responses when there are none.

## QA and privacy
- Run .github/scripts/move-district-quote-qa.ts and existing homepage, Move matching, driver and mobile performance checks.
- Test production/staging with safe internal synthetic data and clean test records after checking.
- Check private admin auth, table RLS and public API response; never expose all enquiries to a public route or logs.
- Set a defined retention schedule with counsel; allow customer privacy requests and deletion subject to applicable legal requirements.
