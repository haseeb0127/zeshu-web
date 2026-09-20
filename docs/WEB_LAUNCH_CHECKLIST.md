# Zeshu Web Launch Checklist

## Scope freeze
- [x] Mobile application parked until after web launch.
- [x] WhatsApp integration parked; sender and customer UI stay off.
- [x] Stable cart and payment implementation is protected from feature changes.

## Customer storefront
- [x] ZESHU logo returns to the storefront and closes customer overlays.
- [x] Typed product search.
- [x] Voice search with unsupported-browser, denied-permission and no-speech fallbacks.
- [x] Category filter.
- [x] Brand filter.
- [x] Price filter.
- [x] Availability filter.
- [x] Sort by recommended, price and name.
- [x] Fresh-food discovery categories: Fruits, Vegetables, Chicken, Mutton, Fish & Seafood, Eggs.
- [x] Travel services displayed as Coming Soon only.
- [x] Source-level audit found no placeholder href="#" or empty click handlers.
- [ ] Runtime click-through QA on Chrome Android, iPhone Safari, desktop Chrome and Edge.

## Account and retention
- [x] My Account home.
- [x] Zeshu Cash and reward history.
- [x] Orders / Buy Again.
- [x] Saved addresses.
- [x] Referral / Invite & Earn.
- [x] Help & Support.
- [x] Policies & Trust.
- [x] Account settings.
- [ ] Profit-aware cashback remains deferred until supplier cost, delivery cost, provider commission and campaign-funding data are recorded.

## Location and delivery
- [x] Precise customer pin flow.
- [x] Saved latitude / longitude.
- [x] Delivery entrance guidance and landmark/address details.
- [x] Jagtial service-area validation foundation.
- [x] Rider live GPS feed.
- [x] Rider location freshness.
- [x] Traffic-aware Google Routes ETA.
- [x] Rider navigation to customer using Google Maps.
- [ ] Real-order field test with a rider and customer device before public launch.

## Support
- [x] Customer support conversations.
- [x] Admin support inbox.
- [x] Zeshu Assistant guided help.
- [x] Conversational AI support backend with recent-turn context.
- [x] Structured resolved / needs-human decision for AI responses.
- [x] Unresolved AI conversations automatically transfer into the real support thread.
- [x] Customer question and AI reply are attached to the human-support handoff.
- [x] Manual support form remains as fallback if automatic handoff fails.
- [x] AI support endpoint rate limiting.
- [x] AI support privacy disclosure and no-secret guidance.
- [x] Admin customer-support sound, vibration and browser notifications.
- [x] Support tables enabled for Supabase Realtime.
- [ ] Verify/set OPENAI_API_KEY and SUPPORT_AI_ENABLED=true in Vercel Production; guided help and automatic human handoff work without it.

## Vendor / product operations
- [x] Vendor dashboard.
- [x] Product create/edit.
- [x] Product brand field.
- [x] Brand visible/filterable for customers.
- [x] Inventory availability controls.
- [x] Vendor order alerts.
- [x] Admin order alerts.
- [x] Rider order alerts.

## Brand and supplier revenue
- [x] Brands & Suppliers partnership page.
- [x] Sponsored-product concept documented.
- [x] Brand-funded cashback concept documented.
- [x] Featured collections, bundles and sampling concept documented.
- [x] Advertising principles prohibit disguised ads and sale of customer personal data.
- [ ] Onboard actual brands/suppliers and agree commercial rates before enabling sponsored ranking.

## Policies and trust
- [x] Terms & Conditions.
- [x] Privacy Policy.
- [x] Payment policy.
- [x] Payment Gateway & Failed Transaction Policy.
- [x] Cancellation & Refunds.
- [x] Returns & Replacements.
- [x] Shipping & Delivery.
- [x] Zeshu Cash Terms.
- [x] Pharmacy & Health status.
- [x] Recharge & Utility Services status.
- [x] Grievance & Customer Support.
- [x] Seller / Vendor Terms.
- [x] Sponsored Content policy.
- [ ] Final CA/legal review before commercial launch.

## Utilities
- [x] Utility/recharge discovery foundations exist.
- [x] Website clearly prevents unavailable fulfilment/payment paths.
- [ ] Rotate the previously exposed PlanAPI credential before further provider testing.
- [ ] Compare A1Topup / PlanAPI with regulated BBPS/Bharat Connect partners and execute provider agreements.
- [ ] Do not enable real utility fulfilment until credentials, reconciliation, refunds and provider compliance are production-ready.

## Business onboarding (external)
- [ ] Current account and bank merchant onboarding.
- [ ] GST applicability review with CA.
- [ ] FSSAI e-commerce / food compliance before fresh-food commercial launch.
- [ ] Fresh-food supplier agreements and quality/returns SOP.
- [ ] Licensed pharmacy partner and prescription workflow before medicine transactions.
- [ ] Electronics dealer SLA before advertising same-day / five-hour delivery.
- [ ] Clothing supplier onboarding.
- [ ] Rider operating SOP and support escalation SOP.
- [ ] Brand advertising rate card and campaign agreement.

## Final QA
- [ ] Latest production deployment must be green.
- [ ] Mobile-layout QA.
- [ ] Browser QA.
- [ ] Customer login / logout smoke test.
- [ ] Address and service-area smoke test.
- [ ] Catalog filters and product actions smoke test.
- [ ] Customer support / admin notification smoke test.
- [ ] Rider GPS / ETA / navigation field test.
- [ ] Utility discovery smoke test without completing real payment.
- [ ] Existing cart/payment regression smoke test only — no payment code changes.
- [ ] Production security review.
- [ ] Launch decision.

## Parked until last
- [ ] WhatsApp Cloud API completion and one approved real test.
- [ ] Customer WhatsApp UI enablement.
- [ ] Mobile application.
