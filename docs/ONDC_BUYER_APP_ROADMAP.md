# Zeshu ONDC Buyer-App Roadmap

## Business decision

Zeshu should remain the customer-facing brand and should not become an inventory-heavy retailer just to expand assortment.

Target model:

- **Zeshu Now:** nearby verified sellers for groceries, snacks, beverages, fresh food and daily essentials.
- **Zeshu Market:** asset-light marketplace assortment such as electronics, fashion, beauty, home and kitchen.
- **Zeshu Digital:** recharge, bills and other regulated/digital services only after the relevant provider and compliance gates pass.
- **ONDC:** use the network behind Zeshu to extend seller/catalogue reach without redirecting customers away from Zeshu.

## ONDC participation direction

The long-term target is for Zeshu to operate as a Buyer Network Participant or equivalent Zeshu-controlled buyer experience.

A technology service provider may accelerate integration, certification and operations, but the architecture should remain portable. Do not couple core Zeshu product, cart, customer, rewards, support or analytics logic to a single TSP-specific storefront.

Official ONDC resources:
- https://www.ondc.org/pages/buyer-network-participants.html
- https://resources.ondc.org/tech-resources
- https://www.ondc.org/pages/ecosystem-participants.html

## Provider evaluation gate

Before signing MystoreNEXT or any other ONDC/TSP provider, obtain a written commercial proposal covering:

1. Setup fee, monthly fee and minimum commitment.
2. Buyer Finder Fee / revenue-share treatment by category.
3. Whether Zeshu keeps its own domain, UI and customer journey.
4. API access and data portability.
5. Seller/category coverage and live serviceability.
6. Multi-seller cart and fulfilment support.
7. Refund, cancellation, return and dispute responsibilities.
8. Settlement timing and reconciliation.
9. Customer-support escalation responsibilities and SLAs.
10. Exit/migration terms with no catalogue/customer lock-in.
11. Sandbox/pre-production access before any production activation.
12. ONDC participant/TSP status and current protocol-version compatibility.

## Commercial planning targets

These are negotiation targets, not guaranteed ONDC commissions:

- Grocery / FMCG: target around 3% gross buyer-side revenue where commercially accepted.
- Fashion / beauty / home: target around 5%.
- General electronics/accessories: target around 3-5%.
- High-value, low-margin mobile phones: target around 2%.

Always compare **net contribution after GST, payment cost, refunds, promotions, support, logistics subsidies and TSP charges**, not headline commission.

## Customer-experience rules

- Never label a seller or brand partner "Authorized" unless evidence has been verified.
- Show the actual seller and expected fulfilment speed before checkout.
- Do not promise 10-minute delivery for nationwide marketplace products.
- Keep unavailable categories visible as launching/coming soon, but never accept payment until fulfilment is verified.
- Never retry an uncertain payment/order through a second provider until the original transaction is conclusively failed.
- Keep sponsored ranking clearly labelled and weaker than product relevance/availability/trust signals.
- Preserve multilingual customer labels for all public catalogue categories.

## Go-live gates

Do not enable ONDC production ordering until:

- commercial contract is approved;
- sandbox search/cart/order/cancel/refund flows pass;
- seller identity/trust mapping is verified;
- payment and settlement reconciliation is verified;
- customer support escalation is operational;
- cancellation/return/refund wording matches the actual network flow;
- nationwide logistics and pincode serviceability are real, not mocked;
- staging QA passes without touching production orders/payments.

## Current preferred approach

Use MystoreNEXT as the **first commercial/technical benchmark** because its dealer-powered, zero-dark-store and white-label buyer-app positioning matches Zeshu's asset-light model. Do not lock the codebase or commercial model to MystoreNEXT until its written pricing, revenue share, data ownership, API access and exit terms are compared with other ONDC ecosystem providers and the official ONDC buyer SDK route.
