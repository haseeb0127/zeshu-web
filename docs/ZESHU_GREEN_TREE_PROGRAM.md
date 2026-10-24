# Zeshu Green — honest one-tree-per-delivered-order rollout

## Current position (14 October 2026)

**PLANNING, not a live tree promise.** The production website may publish the
programme plan and verified-only counters, but MUST NOT say that trees have
already been planted, funded or offset emissions.

Razorpay remains in TEST mode. Historical orders in the database include
delivered TEST activity. **Do not backfill** any old delivered orders, and do
not turn the programme ACTIVE before real paid fulfilment and planting capacity
are independently verified.

## Storefront, bill and order-tracking customer experience (25 October 2026)

- **Cart:** a compact `Zeshu Green · 10,000 orders, 10,000 trees goal` card near the actual price breakdown, not a fake environmental discount or item-by-item tree multiplier. A cart of 1, 5 or 50 products remains **one order**, and does not create a tree during checkout.
- **After checkout/order tracking:** customer-owned order bill displays a clear planting status pulled from private, authenticated per-order records. In PLANNING without a commitment the text says planning only (zero trees); PLEDGED means a real funded slot is reserved for a future tree; PLANTED is partner-reported but awaiting proof review; VERIFIED unlocks a one-tree verified message and evidence URL; VOID means no current commitment.
- **10,000 order milestone:** every funded, eligible, delivered order after explicit programme activation adds one tree commitment toward a coordinated future 10,000-tree planting campaign. A batch can take multiple days and must be scheduled appropriately; reaching 10,000 is **not** a trigger for automatic purchasing/planting or a survival guarantee.
- **Security:** `GET /api/green/order?orderId=...` confirms the customer's auth session and checks `orders.user_id` before fetching any order-linked tree record using a server-only key. The public aggregate `/api/green/impact` must not disclose individual customers. No TEST order, historic order, cancelled/refunded order or payment event alone counts as a tree. No checkout price/tax changes and no additional customer charge.
- These words appear in the cart, order tracking bill and supported customer languages. Avoid `You planted one tree` until the status is genuinely VERIFIED and independent evidence is recorded.

## Customer proposition

> Our goal: one native tree for each eligible delivered Zeshu order.

## Approved planning direction: 10,000-order planting batches

Zeshu's owner prefers **one coordinated mass tree-planting drive after every
10,000 genuinely eligible delivered orders**, rather than physically planting
one tree on the day of every delivery. The **target** remains one tree per
qualifying order: at the first completed 10,000-order milestone, plan to plant
10,000 locally suitable trees. Planting may be scheduled across several days or
sites in one appropriate planting season; never imply the entire campaign can
be completed in a single day without partner capacity evidence.

This is **a planning target, not a funded/live planting promise**. A future
qualified order can reserve one funded commitment only once the existing
STRICT budget + verified partner + live fulfilment activation gates have been
met. Customer progress shows the number of non-void funded commitments
toward the next 10,000-order milestone. While still PLANNING, the counter stays
at zero regardless of prior historical/TEST orders. Voided commitments are
excluded. Earlier commitments must not be retroactively manufactured.

Before promoting any "10,000 orders = 10,000 planted trees" guarantee:
- Confirm a vetted partner, land-owner permission and sufficient nursery stock,
  native species suitability, seasonal planting schedule and **multi-year
  aftercare** for 10,000 individual trees.
- Secure the **entire campaign funding or a legally committed sponsorship**
  without relying on unearned customer order volume, future margins or unverified
  income. Budget for lost saplings and replacements.
- Decide how refunds and returns affect unplanted commitments, confirm no
  duplicative counting, and record partner tree IDs/site/date/evidence.
- Commission a smaller capacity test **only if separately approved and funded**;
  it should never be represented as planting from pending Zeshu orders.
- Bulk planting is human-organized and separately approved: the order counter
  does **not** move money, plant trees, or move commitment records to VERIFIED.
  The existing manual VERIFIED evidence controls still apply.

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
  tree. Displays the aspirational 10,000-order planting-drive milestone, using
  **only recorded post-activation non-void commitments**, and explains that
  planting might occur across several seasonal days. The homepage shows the
  *goal*, not a planting claim.
- Neither API nor trigger invokes payment, makes charitable donations, sends
  WhatsApp messages or activates the programme.
- No app UI exists to switch the programme to ACTIVE. Activation must remain
  a separately approved, evidence-backed operation.

## Partner leads to verify (research, NOT signed suppliers)

These are **prospects for quotation**, not active Zeshu partners.
No trees have been ordered or paid for. Do not show their names to customers
as Zeshu partners until a real agreement is checked and approved.

1. **SankalpTaru Foundation / Telangana Project Pachadhanam**:
   https://sankalptaru.org/project-pachadhanam/ — public project advertises
   Telangana planting sites, tree photographs/GPS coordinates and a displayed
   individual contribution amount starting at ₹149 (at time of research).
   This is **not** a verified corporate wholesale quote. Its public project
   describes fruit trees on farmer lands; check which species and programme
   actually fit Zeshu's local native-tree commitment.
2. **VATA Foundation / Hyderabad**:
   https://vatafoundation.org/plantation-drive/ — offers partnerships,
   community planting/site sponsorship and states that care/monitoring need
   dedicated funding. Request a Jagtial/Telangana native-species pilot quote.
3. **Telangana Haritha Haram / District Forest Officer**:
   https://www.myscheme.gov.in/schemes/haritha-haram — Telangana tree initiative;
   discuss suitable land, native species, site permissions and local registered
   organizations with the Jagtial Forest Department. Government affiliation
   or a nursery is not proof Zeshu has commissioned any trees.

### Ask every candidate before choosing a partner

- Written **₹ cost per successfully planted and cared-for native tree**,
  including site permission, protection, watering, annual follow-up,
  replacement of saplings that fail to establish, and taxes/fees.
- **Do you support a 50–100 tree funded pilot without a subscription?**
  Is there an approved site in/near Jagtial and how is ecological suitability
  validated? Are species locally indigenous?
- Are payments genuinely for *additional* Zeshu-funded planting, not trees
  already financed by other sponsors or programmes? How do you prevent
  duplicate counting across donors?
- Are species, GPS/site, partner tree ID, planting dates, photos and later
  survival/replacement updates available for customer impact reports?
- What planting season, lead time after a delivered order, maintenance window
  and dispute/shortfall process are contractually guaranteed? What happens if
  the partner cannot plant due to weather or access issues?
- Is a sponsor or matching grant available **without a recurring fee**?
  Do not enter banking/payment information before Zeshu owner approval.

Suggested inquiry (send manually only after reviewing partner details):

> Zeshu.in is a new online marketplace in Jagtial, Telangana. We are planning
> a transparent, independently verifiable pilot of 50–100 locally appropriate
> trees, with potential future growth tied to genuinely fulfilled customer
> orders. Please quote a fully inclusive per-tree price for planting, aftercare,
> replacement, proof (native species, site/date, GPS/photo and unique
> references), monitoring reports and any tax or administration charges.
> Please confirm site permission, minimum pilot size, availability in Telangana
> and whether the evidence can be linked in a public impact report. We are
> gathering quotes only, not authorizing an order or payment yet.

## Green HQ for Zeshu owner

- `/admin/green` is private and **read-only**. It shows each launch prerequisite,
  checked payout/partner metadata, quota totals and real VERIFIED counts.
- The **LIVE checkout** gate reflects the configured Razorpay key mode; a
  manually checked programme flag must not silently substitute for real live
  payments, so payment readiness is displayed independently.
- The dashboard cannot activate the programme, spend, change existing partner
  details, backfill history or fabricate verification proof.
- Evidence guard hardening prevents SQL NULLs from bypassing verified-photo
  evidence rules, and requires partner-reported trees to carry a real
  species/site/date/reference before they enter public reported counts.

## Future work after approval

- Staff dashboard with signed proof uploads, multi-person verification,
  explicit refund/replacement reviews, campaign quota replenishment,
  planting cohort reports, photos with permission and supplier compliance.
- Signed customer order-level progress cards only after the programme is
  active and the ownership check is enforced.
- Sponsor partnership contracts and recipient audit reports.

**Activation requires a separate explicit business decision on the vetted
partner, funded order volume and actual tree unit economics.**
