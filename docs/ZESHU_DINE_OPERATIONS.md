# Zeshu Dine operating rules (10 October 2026)

## What is shipped
- Customer: `/dine` – request a real table, optionally choose verified menu dishes and a preferred serving time; view and cancel own requests.
- Restaurant applications: public opt-in form, private owner contact and declared 14-digit FSSAI number.
- Operator: `/admin/dine` – admin-only partner, physical table, menu, request and kitchen scheduling console.
- The booking API returns `REQUESTED` until admin explicitly calls a serialised capacity-check transaction to assign a specific available table.
- Estimated kitchen start and serving times appear *only after human confirmation*, and kitchen stage is manually updated. No real-time ETA guarantee, no food stored ready long before arrival.
- No sample restaurants, fake prices, reviews, customer texts or fake inventory.
- No card payment, charges, deposits, WhatsApp messages or checkout integrations are enabled.
- The customer and restaurant must agree to any changed serving time; if food cannot be fresh and on time, decline or offer a different time rather than promise zero wait.
- Once a table is CONFIRMED, the guest may voluntarily share an approximate **on-my-way** ETA or report **I have arrived**. Both are customer-submitted indications, not location-tracking, automatic food firing, or proof the host has seated them.
- Zeshu staff see guest-reported journey status in Dining HQ. Staff may revise a serving estimate only after checking kitchen capacity and affirming they have directly agreed the new estimate with the guest. A new estimate is visible on the guest's status page (30-second in-page refresh); no SMS or WhatsApp is sent.
- The kitchen's suggested prep-start timestamp is calculated using the confirmed serving time, longest individual dish prep estimate and restaurant buffer; it is not a substitute for human judgement of concurrent orders, menu complexity, food freshness or late arrivals.

## Deployment and operational gate
`DINE_OPERATIONS_APPROVED` must remain missing/false on production until the business has assessed and satisfied applicable food-marketplace/FSSAI, payments, GST, consent, refund and partner contract requirements. Only then may the owner set it to `true` as a private Cloudflare Worker environment variable (not a secret and not browser-public). The admin activation route enforces this server-side.

Each restaurant MUST have independently verified valid FSSAI credentials, contact, address, business hours, and actual table inventory. Food pre-orders additionally need current restaurant-verified menu prices, dish prep estimates, kitchen acknowledgement, allergen procedures and a cancellations/no-show policy.

Do not show customer-bookable restaurant inventory without these checks. Restaurant leads do not make a listing active. Staff must monitor pending requests; customer currently checks the status page (no proactive notifications).
 
## How service works
1. Onboard real restaurant; verify FSSAI details via official channel; add its actual seating tables, hours and optional menu.
2. After platform compliance clearance, admin confirms restaurant activation explicitly. Request a table from `/dine` using a signed-in customer account.
3. Kitchen/admin views pending request, checks staffing and dishes, chooses a realistic time, then confirms. A database function serialises assignments to avoid concurrent double-allocation of tables with overlapping 90-minute seating windows.
4. Customer refreshes their bookings; only `CONFIRMED` means a real table was assigned. Admin updates `PREPARING`, `READY`, `SERVED` only for genuinely prepared meals. Arrival delays require direct human coordination.
5. Customer pays restaurant directly under restaurant's own payment and receipt process. Zeshu must not collect restaurant payments or process deposits without a separate approved legal, settlement and provider integration.

## Next improvements after pilots
Restaurant-owner role-scoped console instead of central Zeshu admin; reliable availability calendars, closed dates, customer-verified acceptance of changed serving times beyond admin attestation, consented SMS/push updates, optional venue-verified arrival/check-in, pickup/prepay when licensed and integrated, refund/no-show safeguards, table joins, kitchen load scheduling, performance analytics (actual wait vs promised ETA), Telugu/Hindi/Urdu localization and user-reviewed order fees. Avoid turning on autonomous kitchen timing promises.
