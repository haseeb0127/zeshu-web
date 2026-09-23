# Zeshu Move & Travel Roadmap

## Product decision

Zeshu should remain asset-light and customer-facing. The preferred launch model is to integrate verified, licensed or authorized mobility, logistics and travel providers rather than buying a fleet or onboarding private vehicles before the regulatory and operational model is ready.

Customer-facing groups:

- **Local rides:** Bike, Auto, Cab, Rental Car
- **Send & Cargo:** Bike Courier, Auto / Mini Truck, Shop Delivery
- **Share:** Intercity Car Share
- **Travel:** Bus, Train, Flights, Hotels, Experiences

The initial website experience is discovery-only. No ride, courier or travel booking/payment is enabled by this foundation.

## Network strategy

Prefer interoperable/provider-neutral integrations where possible.

Relevant current ONDC rails:
- Shared Mobility: https://ondc.org/pages/shared-mobility.html
- Mobility resources: https://resources.ondc.org/mobility
- Hyperlocal Logistics / Open Delivery Protocol: https://www.ondc.org/pages/hyperlocal-logistics.html
- Buyer-app model: https://www.ondc.org/pages/how-to-shop.html

Do not couple Zeshu's customer account, rewards, support, search, payment history or core routing logic to a single mobility/logistics provider.

## Current regulatory gate

India's Motor Vehicle Aggregator Guidelines, 2025 are published by MoRTH:
https://morth.nic.in/sites/default/files/circulars_document/MV-Aggregators-Guidelines-2025%20-%20English%20and%20Hindi.pdf

As of August 2026, Telangana is still framing/finalising a state Motor Vehicle Aggregator Policy. Until the applicable Telangana framework and partner licensing are confirmed:

- keep paid Bike/Auto/Cab booking disabled;
- do not onboard private/non-transport motorcycles or cars for paid passenger rides;
- do not market Zeshu as a licensed transport aggregator;
- prefer integration with already licensed/authorized operators or interoperable mobility networks.

## Go-live gates by service

### Local rides
Before enabling Bike, Auto, Cab or Rental booking:
1. Verify operator/aggregator licence and service area.
2. Verify driver/vehicle onboarding responsibilities.
3. Verify insurance and passenger-safety responsibilities.
4. Verify fare display, cancellation and grievance rules.
5. Verify live trip status, driver identity and emergency escalation.
6. Verify settlement, refunds and chargeback handling.
7. Complete Telangana-specific legal/compliance review.
8. Pass staging booking/cancel/refund tests without production money.

### Car Share
Before enabling intercity car sharing:
1. Define whether the service is cost sharing, commercial passenger transport, or a licensed-operator product.
2. Verify driver identity, licence, RC and insurance.
3. Prevent unlicensed commercial-taxi behavior through a cost-sharing label alone.
4. Verify route, seat, cancellation, dispute and emergency flows.
5. Complete state-specific legal review before accepting payment.

### Bike Courier / Hyperlocal logistics
Before enabling courier execution:
1. Verify provider API and serviceability by PIN/location.
2. Require quote before customer confirmation.
3. Support pickup/drop contact masking where available.
4. Track assignment, pickup, live status and delivery proof.
5. Support cancellation, failed pickup, loss/damage and refund paths.
6. Never retry an uncertain dispatch through another provider until the original job is conclusively failed/cancelled.
7. Compare multiple logistics providers on cost, ETA and reliability where contracts allow it.

### Cargo / Mini Truck
Before enabling goods transport:
1. Verify vehicle categories and weight/size limits.
2. Display prohibited/restricted goods rules.
3. Verify quote, waiting charges, loading/unloading terms and proof of delivery.
4. Verify insurance/liability and customer-support escalation.

### Travel
Before enabling bookings:
1. Use authorized providers for rail, flight, bus and hotel distribution.
2. Never scrape or bypass a provider's official booking channel.
3. Show actual supplier/operator before payment.
4. Verify cancellation/refund rules per supplier.
5. Reconcile booking status after payment before confirming a ticket.
6. Keep provider PNR/booking references and customer support handoff available.

## Commercial evaluation

For every provider, compare:
- commission / revenue share;
- customer price and convenience fees;
- setup and monthly fees;
- settlement timing;
- refund/cancellation costs;
- API uptime and response SLA;
- coverage in Jagtial/Telangana/India;
- tracking and webhook quality;
- support escalation;
- data portability;
- exclusivity / lock-in;
- minimum volume or prefunding.

Choose based on **net contribution and customer reliability**, not headline commission.

## Customer-experience rules

- One Zeshu account and one consistent support experience.
- Show the real provider/operator before a customer pays.
- Clearly label services that are not live.
- Never show fake ETA, fake serviceability or fake price.
- Never accept payment before serviceability and provider readiness are confirmed.
- Use multilingual labels on public customer pages.
- Keep safety and refunds clearer than promotional messaging.
- Do not claim "authorized" or "licensed" status unless documentation has been verified.

## Recommended rollout order

1. Discovery-only Move & Travel page.
2. Partner intake for licensed mobility/logistics/travel providers.
3. Courier/logistics sandbox first because it does not carry passengers.
4. Authorized travel integrations.
5. Auto/Cab through licensed partners/interoperable networks.
6. Bike ride only after Telangana-specific legal/licensing readiness.
7. Car Share only after the cost-sharing/commercial-transport model is legally cleared.
