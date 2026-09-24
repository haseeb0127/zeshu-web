# Zeshu Delivery, Rider, Mobility & Courier Licensing Roadmap

**Planning date:** 24 September 2026  
**Launch posture:** interest/onboarding discovery only unless a service is explicitly marked live after all gates pass.

This file is an operational checklist, not legal advice. Before Zeshu accepts a passenger ride, on-demand courier/cargo job or vehicle-based payment, confirm the exact licence/permit position with the Telangana Transport Department/RTA and qualified legal/tax advisers.

## Recommended business model

Zeshu should begin asset-light:

1. **Zeshu Delivery** — local seller-to-customer delivery using verified partner-owned bikes/riders.
2. **Zeshu Courier** — documents and small parcels after the goods-agent/provider model is cleared.
3. **Zeshu Cargo** — auto/mini-truck goods movement using appropriately permitted goods vehicles.
4. **Zeshu Auto & Cab** — initially connect customers to an already licensed mobility operator/interoperable network rather than immediately operating Zeshu as the direct passenger aggregator.
5. **Own passenger aggregator licence** — consider only after Telangana's state framework is final and projected ride volume justifies the fixed compliance/security cost.
6. **Bike Taxi and private-car Car Share** — keep disabled until the exact Telangana treatment of non-transport/private vehicles and the cost-sharing model is legally clear.

Zeshu should not buy a fleet at launch. Keep vehicles with riders/drivers/fleet partners and invest first in software, support, verification, dispatch, tracking and customer demand.

## Passenger mobility: Bike / Auto / Cab / Rental

India's Motor Vehicle Aggregator Guidelines, 2025 are the central planning baseline for passenger aggregation. Their licence framework includes a ₹5,00,000 grant fee, ₹25,000 renewal fee and security deposits that scale from ₹10 lakh to ₹50 lakh based on fleet size. States implement the framework and may add/modify requirements.

For direct Zeshu passenger aggregation, plan for:

- eligible legal entity under the applicable state/central framework;
- Section 93 / state aggregator licence when applicable;
- vehicle registration and the applicable contract-carriage/transport permit;
- driver licence/transport endorsement as applicable;
- fitness certificate, insurance, tax and PUC;
- passenger-safety and emergency features;
- grievance/support system;
- fare/cancellation transparency;
- driver agreement and earnings disclosures;
- passenger and driver insurance required by the applicable aggregator rules;
- cybersecurity/app-security requirements required by the applicable framework;
- Telangana gig-worker/platform obligations;
- GST/tax review.

### Telangana-specific hold

As of 8 September 2026, public statements indicated Telangana was still studying/finalising its dedicated app-based aggregator policy, including questions around white-plate/private vehicles.

**Therefore:**
- do not enable paid Zeshu Bike/Auto/Cab bookings merely because the central guidelines exist;
- do not onboard a private/non-transport bike or car for paid passenger service unless Telangana's applicable framework clearly permits it;
- prefer already licensed operators/interoperable networks for the first passenger launch.

## Auto and Cab vehicle-level readiness

Before an Auto or Cab can be dispatched for passengers, verify at least:

- valid driving licence for the relevant class;
- RC;
- applicable transport/contract-carriage permit;
- valid insurance;
- fitness certificate where applicable;
- road tax/other vehicle tax;
- PUC;
- driver identity/background/safety checks required by law/contract;
- service area/route eligibility.

The public interest form must not be treated as verification.

## Delivery Rider

A Zeshu Delivery Rider carrying Zeshu/local-seller orders should have a separate operational onboarding flow from passenger mobility.

Before activation:

- secure identity/KYC;
- driving licence where a motor vehicle is used;
- RC/insurance/PUC and any other vehicle documents required for the use;
- payout/bank verification in a secured flow;
- rider agreement;
- accident/safety response;
- order handling and proof-of-delivery rules;
- customer contact/privacy rules;
- Telangana gig-worker/platform registration/reporting duties;
- live-location consent and retention policy.

Do not collect Aadhaar/PAN/DL/RC/bank data through the public interest form.

## Bike Courier / Parcel

Treat customer parcel/courier booking separately from marketplace shipping.

Before activation verify:

- whether Zeshu is acting as principal carrier, intermediary, collecting/forwarding agent, or API marketplace;
- provider/vehicle serviceability;
- applicable goods-agent licence under Telangana Motor Vehicles Rules Rule 297 where the operating model falls within collecting/forwarding/distributing goods carried by public carriers;
- any approved premises/loading/storage requirement that applies to the chosen model;
- goods insurance/liability requirements;
- prohibited/restricted goods;
- parcel weight/dimensions;
- pickup/drop tracking;
- cancellation;
- failed pickup;
- lost/damaged parcel claims;
- proof of delivery;
- support escalation.

Rule 297 specifically regulates agents engaged in collecting, forwarding and distributing goods carried by public carriers and provides for an Agent's Licence (Form L.Ag.). Confirm the exact applicability to Zeshu's app-only/local-last-mile model with the local RTA before commercial launch.

## Goods Auto / Mini Truck / Cargo

Before enabling a goods vehicle:

- valid goods-carriage registration/permit for the intended operation;
- driver licence/transport requirements;
- RC;
- insurance;
- fitness;
- tax/green-tax where applicable;
- PUC;
- load/weight limits;
- goods restrictions;
- loading/unloading terms;
- waiting charges;
- liability/insurance;
- proof of delivery.

For interstate/national goods operations, verify whether a national goods-carriage permit is required.

## Car Share

Do not launch a paid private-car feature simply under a 'car share' label.

First determine and document whether the model is:

- genuine expense-sharing of a journey already planned by the driver; or
- commercial passenger transportation.

If it is commercial passenger transportation, apply the relevant passenger-transport/aggregator and vehicle-permit rules. Until this is legally cleared, Zeshu Car Share remains discovery-only.

## Telangana gig-worker/platform obligations

Treat riders/drivers as covered by the applicable Telangana platform/gig-worker framework where the statutory definitions apply.

Before operational onboarding:
- register Zeshu/platform as required;
- implement worker registration/data reporting to the Welfare Board as prescribed;
- support required welfare contribution/fee mechanics once the operative rules are confirmed;
- maintain contracts, payout records and worker grievance channels;
- re-check the latest rules before launch because implementation details can change.

## GST and business registrations

Before commercial launch, confirm with a CA/tax professional:

- GST registration of Zeshu/e-commerce operator;
- Section 9(5) treatment where applicable to notified services;
- invoicing/GST responsibility between Zeshu and transport/logistics partner;
- TDS/TCS or other platform obligations applicable to the actual contract model;
- Telangana Shops & Establishments/labour registrations and other entity registrations that apply.

Do not encode tax percentages into the customer app until the actual contract/provider/tax treatment is approved.

## Customer-friendly operating rules

- Show the actual operator/provider before payment.
- Show the real quote, fare, ETA and cancellation terms returned by the live provider.
- Do not advertise fake '10 minute' ride/courier promises.
- Do not expose driver phone numbers when masked calling/in-app contact is available.
- Never ask for OTP, UPI PIN, card CVV or banking password.
- Give customers a visible SOS/support route for passenger services.
- Keep support available for every delivery, ride, courier and travel service.
- Preserve transaction context on human escalation so customers do not repeat the issue.
- Keep provider ratings, driver/vehicle identity and tracking readable on mobile.
- Never retry an uncertain paid booking with a second provider until the first provider transaction is conclusively failed/cancelled.

## Launch gates

### Phase 1 — now
- public Drive & Deliver interest page;
- privacy-safe applicant intake;
- AI/human support;
- provider/fleet partner intake;
- readiness APIs;
- no document upload;
- no driver activation;
- no passenger/courier payment.

### Phase 2 — Zeshu Delivery pilot
- secure rider KYC/document vault;
- rider admin review;
- verified local delivery riders;
- dispatch/availability state;
- location consent;
- order assignment;
- proof of delivery;
- rider support/safety;
- payout ledger;
- Jagtial-only controlled pilot.

### Phase 3 — Courier/Cargo sandbox
- decide Zeshu principal vs intermediary/agent model;
- RTA/legal confirmation of Rule 297 applicability;
- provider serviceability/quote;
- parcel/goods state machine;
- tracking/POD;
- cancellations/claims;
- goods-vehicle document validation;
- sandbox only before customer payment.

### Phase 4 — Auto/Cab partner launch
- licensed operator contract;
- real-time serviceability/fare;
- trip state machine;
- SOS/support;
- cancellations/refunds;
- driver/vehicle identity;
- state-specific legal sign-off.

### Phase 5 — own passenger aggregator
Only if customer demand and unit economics justify:
- state aggregator application;
- licence/security deposit;
- full driver/vehicle onboarding compliance;
- insurance;
- cybersecurity;
- statutory reporting;
- gig-worker/welfare integrations.

### Phase 6 — Bike Taxi / Car Share
Launch only after Telangana-specific legal treatment is clear and written operating controls are approved.


## Primary references to re-check before launch

- Motor Vehicle Aggregator Guidelines, 2025 (Parivahan/MoRTH): https://parivahan.gov.in/sites/default/files/NOTIFICATION%26ADVISORY/MV-Aggregators-Guidelines-2025%20-%20English%20and%20Hindi.pdf
- Telangana Motor Vehicles Rules — Rule 297 goods collecting/forwarding/distributing agents: https://www.transport.telangana.gov.in/html/acts-rules/middle-main-chap-5.htm
- Telangana Auto-rickshaw Pucca Permit: https://transport.telangana.gov.in/html/permits-contractcarriage-autorickshaw-puccapermit.html
- Telangana Motor Cab Pucca Permit: https://transport.telangana.gov.in/html/permits-contractcarriage-motorcab-puccapermit.html
- Telangana Goods Carriage Pucca Permit: https://www.transport.telangana.gov.in/html/permits-goodscarriagepermit-puccapermit.html
- Telangana Goods Carriage National Permit: https://www.transport.telangana.gov.in/html/permits-goodscarriagepermit-nationalpermit.html
- Telangana transport-vehicle driving licence guidance: https://transport.telangana.gov.in/html/driving-licence-made-easy.html
- Telangana Platform Based Gig Workers (Registration, Social Security and Welfare) Act, 2026: https://prsindia.org/files/bills_acts/acts_states/telangana/2026/Act21of2026TG.pdf

### Current Telangana passenger-policy watch

Public reporting on 8 September 2026 said Telangana was still studying its app-based aggregator policy and issues including white-plate vehicles. Re-check the Transport Department/Gazette before enabling passenger booking:
https://www.newindianexpress.com/states/telangana/2026/Sep/08/telangana-mulls-ride-hailing-app-as-auto-unions-warn-of-agitation
