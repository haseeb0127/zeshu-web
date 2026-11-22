# Zeshu local pricing / 0%-commission rollout

## Agreed commercial direction (not live)
- Jagtial: verified Zeshu Move riders only. Fresh fish/meat/chicken remain local pending cold chain.
- Seller subscription proposed at ₹299/month including applicable tax, 14-day trial, zero sales commission. No subscription billing/settlement changes in this PR.
- Customers cover transparent local delivery; local pilot includes ₹10 tax-inclusive handling, no automatic free delivery at basket ₹299.
- Tiered existing Zeshu Cash remains intact. No new flat reward.
- National: Shipmozo prepaid pilot, iThink COD candidate, Shiprocket manual fallback; national checkout remains disabled.

## Local fee pilot staged safely
- Server-only environment flag ZESHU_LOCAL_PAID_DELIVERY_PILOT defaults OFF, and requires exact value true.
- Pilot quote uses Jagtial-centre straight-line proxy 18.80/78.93; this is NOT seller-to-customer road distance or verified rider cost.
- Within 0–2 km: ₹29 delivery + ₹10 platform. Within >2–4 km: ₹39 delivery + ₹10 platform. Within >4–6 km: ₹49 delivery + ₹10 platform.
- Missing confirmed saved GPS or outside supported service area: do not quote or take payment.
- Public POST /api/local-delivery-quote is advisory only. Secure checkout uses the authenticated user's saved address, independently recomputes fees, writes reservation pricing snapshot and total before any Razorpay creation, and preserves paid/retry reconciliation.
- This pilot does NOT offer store pickup, unverified seller-funded free shipping, COD, or a monthly seller subscription.
- Legacy pricing stays unchanged while the flag is OFF.

## Go-live prerequisites (do not enable pilot yet)
1. Confirm actual rider cost per seller pickup/customer delivery zone. Replace center proxy with accurate pickup-route pricing when verified.
2. Verify GST registration, fee tax treatment, marketplace TCS/TDS and seller/customer invoices with a CA.
3. Store/platform ledger and refunds must persist handling-fee amounts in completed order and support/admin reports. Current order finalization records delivery fee, not a dedicated handling fee; pricing_snapshot is retained in reservation.
4. Test merchant-of-record, actual Cashfree/Razorpay gateway costs, seller payouts/fees, seller-fault returns, customer-choice returns, courier claims, and chargebacks. Payment method surcharges must not be invented.
5. Validate cart fee preview, exact server-verified total, Razorpay TEST, address change, Zeshu Cash, failed/stale payment retry, delivery exception, cancellation and refund.
6. Confirm 14-day trial subscription renewal/disclosure/cancellation and collected seller payments before relying on SaaS revenue.
7. Run CI build, Cloudflare compatibility, staging browser QA, manual pilot approval and exact production promotion. Do not enable the flag without separate authorization.

## Transparency and financial cautions
- Customer sees subtotal, delivery, ₹10 tax-inclusive platform handling, Zeshu Cash redemption and final total BEFORE payment.
- At assumed 18% tax, ₹299 inclusive contains ₹253.39 service revenue + ₹45.61 output GST; ₹10 inclusive contains ₹8.47 revenue + ₹1.53 output GST, subject to legal GST review.
- No universal free delivery promise. Explicitly funded seller promotions can be added after accounting and pickup logic are implemented.
- Every order must recover its real rider and support costs; simulation revenue is not confirmed profit.
