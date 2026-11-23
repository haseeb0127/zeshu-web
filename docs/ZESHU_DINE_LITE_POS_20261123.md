# Zeshu Dine Lite POS — Jagtial pilot (23 November 2026)

## What has been built
- Existing /dine real table bookings and optional preordered food retained.
- /dine/table?restaurant=UUID&table=UUID&key=UUID offers a public, responsive restaurant QR menu only for explicitly activated, verified restaurants and enabled tables. No login needed to browse. Guests make a PENDING_APPROVAL request that never automatically creates a KOT.
- /dine/kitchen requires the existing Zeshu Supabase customer sign-in AND an explicit restaurant-specific membership (OWNER, MANAGER, WAITER or KITCHEN). Orders refresh every 10s, optional chime requires user activation, staff can approve/reject QR requests and advance ACCEPTED -> PREPARING -> READY -> SERVED.
- Staff-assisted orders are entered by approved staff, not anonymous guests. Existing table/preordered bookings can be confirmed against the real inventory and updated by restaurant staff.
- Stock and table availability controls update all future menu orders; existing accepted orders remain visible.
- Local MIT QR generator (Project Nayuki); print table standees with browser Print / Save as PDF; browser-printed internal KOT, explicitly not a GST invoice. No external QR image API.
- Admin /admin/dine can create private restaurants, real tables and real menu items, assign known signed-in customer user IDs to a restaurant role, revoke membership, enable the QR pilot only after operational checks, pause, and rotate a compromised printed QR token.
- Delivery view is a disabled readiness placeholder. No paid order, payment gateway, rider assignment, SMS/WhatsApp send, subscription activation or 0%-commission promotion.

## Schema & safety
Migration: supabase/migrations/20261123220000_dine_lite_pos_table_qr_kds.sql.
Tables: dine_restaurant_staff, dine_table_orders, dine_table_order_events; existing dine_restaurants.qr_order_enabled defaults false and each dine_tables.qr_token is random UUID.
All new tables are RLS-enabled, explicitly deny anon/authenticated direct access and grant private service-role access only. Restaurant authorization is validated on the server, never based on a client-provided role. Guest creation uses an atomic locked PostgreSQL routine, table-token validation, per-table/requester throttles, server-side menu price snapshots and idempotent request IDs. Public status checks require an unguessable second receipt key.

## Launch checklist (manual verification before any customer QR standee is printed)
1. Confirm Zeshu's food-platform FSSAI e-commerce licensing position and local tax/payment responsibilities with a qualified adviser. The original DINE_OPERATIONS_APPROVED backend switch is an additional deliberate admin approval gate. Do not turn it on prematurely.
2. Verify the restaurant's real FSSAI number, address, seating layout, operational hours, menu prices and kitchen contact.
3. Restaurant owner signs in to existing Zeshu OTP (the dashboard shows their user ID). Zeshu Admin adds the actual ID and OWNER/MANAGER role, then adds KITCHEN/WAITER roles only as needed.
4. Admin enables real bookings, adds verified dishes and tables, then reviews/activates QR pilot. All these conditions must pass; default remains OFF.
5. From a registered kitchen phone: print a sample table QR standee, scan it with a fresh guest phone, submit a low-value request, verify it remains PENDING_APPROVAL, approve it, print KOT, advance kitchen statuses. Verify waiter ordering, stock toggle, expired QR after rotation, no repeated duplicate order, and lost connectivity recovery.
6. Train staff to reject prank orders, give a clear payable bill at their own counter, manually reconcile payments, and keep a paper/manual fallback if the internet fails.
7. Pilot with five Jagtial venues, collect measured successful order and service timings, staff feedback, and issue reports. Do not charge the proposed ₹299/mo until an owner-approved commercial plan with taxes, subscription terms and support limits exists.

## Boundaries
- Pay-at-restaurant is a workflow label, NOT a payment confirmation; no automatic receipts, settlement or GST invoice.
- This is not Petpooja replacement or offline POS, and a printed QR code proves only the table token, not physical presence. All public requests wait for staff approval.
- QR tokens can be rotated by Zeshu Admin; reprint whenever one is copied or misused. Keep orders private to assigned restaurant staff and retain as little customer information as practical.
- Meal pre-order checkout/deposits, real-time delivery tracking, rider allocation, WhatsApp messages, formal bills and Bluetooth print integration remain gated for later verified launch.
- Local QR renderer: https://github.com/nayuki/QR-Code-generator (MIT license retained in app/lib/dine-qr-code.ts).

## QA
Run node .github/scripts/dine-lite-pos-qa.mjs and existing Dine booking/arrival QA; GitHub Build check and OpenNext/Cloudflare staging compatibility must pass.
