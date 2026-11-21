# Zeshu Green — paused by owner, no customer promotions

**Owner instruction: 21 November 2026 — stop Zeshu Green until the owner explicitly authorises restarting. No reminder should be scheduled unless separately requested.**

The production programme is `PAUSED`, customer homepage promotion/cart/order copy is removed and no new tree pledges, payments, planting activity or promotional promises are allowed. Keep the programme in admin-only archival state and preserve historical audit evidence. Do not automatically reactivate even if other launch gates later become true.

The sections below describe a **deferred historical proposal, not an active or advertised programme**.

## Owner's current goal

- **Goal:** fund one locally suitable tree for each eligible, completed customer delivery order.
- **Customer price:** no additional tree fee at checkout. The tree cost must be funded by Zeshu from an explicitly budgeted share of sustainable contribution margin after seller/provider settlements, fulfilment, payment costs, cashback, refunds, support and maintenance.
- **Not live yet:** no per-order funding reserve, verified planting partner, land permissions, aftercare agreement or new order-level tracker has been confirmed. Until all gates pass, customer copy may describe this as a goal being prepared, but must not claim that an individual order has funded, reserved or planted a tree.
- **Eligibility:** only genuine paid, successfully delivered, non-refunded orders after an explicitly approved programme start. Exclude TEST orders, cancelled orders, failed payments, full refunds and duplicate/replacement records. Decide partial refund treatment in the written programme policy.
- **Batching:** reconcile eligible orders monthly and plant in practical local batches with a vetted partner. A monthly batch is an operational convenience; it must still reconcile one funded tree per qualifying order. Publish counts only after funding and planting evidence reconcile.
- **Evidence and care:** obtain written partner agreement, landowner permission, locally suitable species, planting date/site evidence, survival/aftercare plan, watering, replacement policy and periodic verification. Never equate a sapling purchased with a tree successfully planted or surviving.
- **No misleading environmental claims:** do not claim carbon offsets, emissions reductions, carbon neutrality or a guaranteed survival rate. Do not use stock photos as proof.
- **No hidden charges:** do not add a customer checkout fee, opt-in donation, subscription or automatic payment. No third-party spend without owner approval.

## Business economics and launch gates

Before activating one-tree-per-order:
1. Obtain at least two local nursery/planting partner quotes for per-tree planting plus aftercare and evidence. Compare total lifecycle cost, not only sapling purchase price.
2. Calculate a conservative per-order contribution after seller/provider settlement, delivery, payment fees, refunds, cashback, support and taxes. Set a per-order tree budget that does not make negative-margin orders more loss-making.
3. Have the owner approve a monthly spending cap and cash reserve. If the cap is reached, pause new qualifying commitments transparently before the next order; do not retroactively cancel already-funded commitments.
4. Sign the partner agreement and verify planting permissions, species, site, care, replacement and evidence.
5. Implement a new idempotent order eligibility ledger and reconciliation that is separate from the legacy tree-commitment trigger. Record order ID, delivery timestamp, payment/refund state, per-order amount reserved, partner batch ID, planting status, proof and aftercare checks. Enforce unique order attribution.
6. Add admin approval and audit trail for programme start/pause, funding reconciliation and evidence verification. No automated payments or planting activation without separate approval.

## Existing database safety — do not reuse blindly

Zeshu's older private schema was designed for a different one-tree-per-order campaign and includes `zeshu_green_tree_commitments`, an AFTER UPDATE `record_zeshu_green_delivery()` trigger, quota gates and a legacy `greenBatchProgress()` counter. These records are not a trusted order-level ledger for the new campaign.

**Keep the existing programme PAUSED and its activation gates closed.** Do not turn the legacy trigger back on: first review its exact SQL, idempotency, funding quota and RLS with a separate migration and tests. The old commitment count must never be reported as qualifying delivered orders. The new public API explicitly reports `fundingConfirmed:false` and `trackingEnabled:false` until the new ledger is implemented and verified.

## Customer communication

Approved planning copy:
- Cart/banner: “Zeshu Green 🌱 Our goal: one tree for every eligible delivered order. Funding and local planting are being prepared; no extra fee.”
- /green page: explain that this is a goal, not yet a live funded promise; count only genuine eligible delivered orders after launch; publish partner and evidence only when verified.
- Order receipt: do not say “your order planted a tree” unless the order's funded commitment and planting evidence have actually been verified. Until then say the programme is being prepared.
- If the programme is paused or funding is unavailable, disclose that clearly and do not claim new orders have a tree reserved.

## Current implementation status

- Owner pause supersedes the earlier planning copy: homepage Green promotion, cart impact and order impact UI are hidden. `/green` displays only an on-hold notice.
- Cart/order copy remains explicit that funding and planting are not yet live.
- Public impact API exposes the goal while stating that tracking and funding are not confirmed.
- Private Green HQ shows the same goal and the missing gates.
- Legacy tree trigger and all automated spending/planting remain disabled.
- No historic, test, refunded or cancelled orders are backfilled.

