# Zeshu Green — first 1,000-order, 1–2 tree pilot

Updated 25 October 2026. This supersedes the earlier, unaffordable 1-tree-per-order / 10,000-tree campaign idea.

## Owner's current, affordable plan

- **First milestone:** after 1,000 genuinely eligible delivered live orders, explore planting **1–2** locally suitable trees. Start with an owner's garden only if location, species, permissions, space, watering and long-term care are appropriate, or obtain a small local planter/nursery quote.
- **Planning only, not guaranteed:** owner has not funded or arranged the planting. This is neither an order-linked donation nor an individual tree for each customer.
- **No extra fee** or unapproved business spend. Plant only when money is genuinely available after vendor settlements, refunds, logistics and maintenance.
- Show customers a very small honest message in cart: *“🌱 Zeshu Green — Your shopping helps Zeshu move toward planting trees.”* Do not clutter checkout with finances, tree counters, progress bars or links.
- Optional /green page explains a future goal of 1–2 trees following the first 1,000 qualifying deliveries, subject to actual arrangements. **Never imply a tree has already been funded, reserved, planted or dedicated to one purchase.**
- When planting actually occurs, publish planting date, real location, native/suitable species, photograph/evidence and a care plan. Only then show verified planting counts.
- Never claim an order offset CO₂ or is carbon neutral, or that each order plants one tree.

## Implementation status — safety and legacy pledge system

Production programme is **PLANNING**, with **zero** funded tree commitments and **zero** verified planted trees as checked 25 October 2026. Razorpay remains in TEST mode. No historical/test/refunded/cancelled orders will be backfilled or claimed as environmental contributions.

Zeshu's existing private schema was designed for a **different, now-rejected one-tree-per-order campaign**. It includes `zeshu_green_tree_commitments`, an AFTER UPDATE `record_zeshu_green_delivery()` trigger, quota gates, and a legacy `greenBatchProgress()` counter for funded tree slots. **Those legacy commitment counts are not real counts of delivered customer orders and MUST NOT be used for the new 1,000-order milestone.**

Do **not** activate the existing database programme: its automatic trigger would reserve one funded slot per newly delivered eligible order, which is incompatible with the 1–2-tree pilot and could create a much larger obligation. The owner-only HQ intentionally has no activation control. A future implementation of the new pilot needs a separate, privacy-safe real-deliveries counter (excluding TEST, cancelled and refunded orders), its own opt-in launch approval and documentary planting evidence. This change revises the public/administrative copy and keeps the existing gated programme disabled; it does not fake data or turn any workflow on.

The old owner API's `canAnnouncePerOrderPromise` must return false regardless of old gates until a separately approved design replaces the obsolete one-tree-per-order commitment system. Existing per-order receipts retain access to genuinely verified legacy commitments if any ever existed; unverified claims are prohibited.

## Suggested low-cost planting checklist

1. After eligibility rules and business launch are confirmed, count real qualifying deliveries from an approved start date using immutable order/payment evidence; do not count a test or an abandoned checkout as an order.
2. At the first 1,000-order milestone, check whether 1–2 saplings can be planted safely in an approved, suitable site with real long-term care, or get a written local quote.
3. Obtain consent from landowner, select ecologically appropriate species and budget for watering, maintenance, and replacement.
4. Plant only after owner approval; collect photos, species, planting date, site, and verify they were actually planted.
5. Share a small, honest website update about the real **community** programme, without attributing a tree to each checkout.
6. Never charge a checkout tree fee, enable recurring donations, or commission third-party planting automatically.

Before any actual environmental claim, comply with the applicable consumer protection and environmental advertising standards. No automatic sending, payment, purchases or planting is part of this plan.
