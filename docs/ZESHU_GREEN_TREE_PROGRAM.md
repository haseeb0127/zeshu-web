# Zeshu Green — honest one-tree-per-delivered-order rollout

## Current position (14 October 2026)

**PLANNING, not a live tree promise.** The production website may publish the
programme plan and verified-only counters, but MUST NOT say that trees have
already been planted, funded or offset emissions.

Razorpay remains in TEST mode. Historical orders in the database include
delivered TEST activity. **Do not backfill** any old delivered orders, and do
not turn the programme ACTIVE before real paid fulfilment and planting capacity
are independently verified.

## Customer proposition

> Our goal: one native tree for each eligible delivered Zeshu order.

The on-site `/green` page distinguishes:
- **Reserved tree slots:** future qualifying order commitments, NOT trees planted.
- **Reported plantings:** physically planted as reported by the partner, not yet
  independently evidence-backed.
- **Verified planted:** partner reference, location, native species, planting
  date, verification date and a link to trustworthy planting evidence recorded.
- **Programme status:** PLANNING, ACTIVE or PAUSED.

Neither placing an order nor payment confirmation automatically means a tree
has been planted. Cancellations, test orders, reversed payments and returns
are ineligible. Delivered→cancelled transitions void only unplanted pledges.
The owner must reconcile refunds before moving commitments to PLANTED/VERIFIED.

## Low-cost launch — do this BEFORE activation

1. Identify a real planting partner in Jagtial/Telangana that can plant
   ecologically suitable indigenous/native species in an approved site.
2. Obtain a written partner agreement: actual planting/care cost per tree,
   survival monitoring and replacement policy, proof availability, maintenance
   period, planting season, logistics and reporting frequency.
3. Confirm Zeshu's *net contribution margin per delivered order*. Fund the
   actual number of trees that can be sustained without compromising vendor,
   rider, customer refunds or necessary business cash flows. If needed, add
   a sponsor; don't quietly add a checkout tree fee.
4. Verify compliant live payments and non-test order fulfilment before
   activating. Confirm the no-retroactive-order rule.
5. Record real funds committed, eligible quota and a real verified partner.
   The programme SQL refuses ACTIVE status without these fields and
   auto-pauses when the preapproved quota is exhausted.
6. Reconcile order returns/refunds. Only after external evidence is checked
   should an authorized operator move a record to VERIFIED, with native
   species, planting location, dates, proof URL and partner reference.
7. Publish monthly *verified* reports; disclose failed saplings and replacement
   policies, not guessed survival rates.

Do not report guessed carbon absorbed, offsets, carbon neutrality, a tree
planted when only pledged, or "eco-friendly" blanket claims. The Central
Consumer Protection Authority's 2024 greenwashing guidelines require
substantiated environmental claims and clear disclosures.

## Technical safeguards

- `public.zeshu_green_program`: singleton PLANNING by default; activation
  requires a verified planting agreement, partner website, verified live order
  operation, real per-tree budget and a funded maximum tree quota.
- `public.zeshu_green_tree_commitments`: private, one unique future order per
  tree. All order-linked data protected by RLS and no anon/authenticated grants.
- `record_zeshu_green_delivery()`: an AFTER UPDATE trigger on actual
  DELIVERED transitions. It ignores pre-activation orders and locks the
  programme row to avoid overspending the funded tree quota. The initial
  programme remains disabled.
- `GET /api/green/impact`: aggregate-only; no customer/order IDs, no contract
  prices or partner internal details. Does not count unverified trees as planted.
- `/green`: mobile-friendly multilingual customer programme page, clearly
  labeling planning status and the difference between a pledge and a planted
  tree. The homepage shows the *goal*, not a planting claim.
- Neither API nor trigger invokes payment, makes charitable donations, sends
  WhatsApp messages or activates the programme.
- No app UI exists to switch the programme to ACTIVE. Activation must remain
  a separately approved, evidence-backed operation.

## Future work after approval

- Staff dashboard with signed proof uploads, multi-person verification,
  explicit refund/replacement reviews, campaign quota replenishment,
  planting cohort reports, photos with permission and supplier compliance.
- Signed customer order-level progress cards only after the programme is
  active and the ownership check is enforced.
- Sponsor partnership contracts and recipient audit reports.

**Activation requires a separate explicit business decision on the vetted
partner, funded order volume and actual tree unit economics.**
