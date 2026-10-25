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
- [x] Guided support covers marketplace, rides, courier/cargo, Car Share, travel, recharge/bills, pharmacy/health, payments, refunds, seller trust, delivery fees, promotions, privacy, WhatsApp availability and safety escalation.
- [x] Move & Travel service cards link directly into service-aware Help & Support.
- [x] Move & Travel readiness endpoint fails closed with customer booking/payment disabled until provider-specific launch gates pass.
- [x] Admin customer-support sound, vibration and browser notifications.
- [x] Support tables enabled for Supabase Realtime.
- [ ] Production readiness check currently reports `mode=guided`, `automatic_handoff=true`. Add OPENAI_API_KEY only as a server-side Cloudflare Worker secret and set SUPPORT_AI_ENABLED=true after cost/privacy approval to switch to real AI mode.

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
- [x] Automated production public-route, AI-readiness, and auth-boundary smoke test.
- [x] Latest production deployment is green.
- [x] Automated mobile-layout QA on a 390×844 Chromium viewport, including storefront search/filters, marketplace fulfilment, Help Center and multilingual/RTL regression.
- [ ] Browser QA on real Chrome/Safari/Edge devices.
- [ ] Customer login / logout smoke test.
- [x] Automated address/service-area boundary smoke: Jagtial eligible, outside-city blocked, invalid coordinates fail closed.
- [x] Automated catalog filters/product action smoke: price, availability, sort, clear filters and ADD-to-cart.
- [ ] Customer support / admin notification smoke test.
- [ ] Rider GPS / ETA / navigation field test.
- [x] Automated utility discovery smoke covers visible service tabs and provider/payment safety gates without completing payment.
- [x] Automated cart/payment regression smoke covers cart state, price breakdown and secure-checkout UI while asserting no payment API is called.
- [x] Production security review completed; new AI handoff is service-role only. Legacy project-wide advisor warnings remain separately tracked.
- [ ] Launch decision.

## Parked until last
- [ ] WhatsApp Cloud API completion and one approved real test.
- [ ] Customer WhatsApp UI enablement.
- [ ] Mobile application.
