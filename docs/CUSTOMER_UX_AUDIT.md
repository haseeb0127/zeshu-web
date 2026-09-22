# Zeshu Customer UX Audit

Last reviewed: 2026-09-20

## Product model

- Physical delivery is limited to the Jagtial delivery zone.
- India-wide digital services must not require a Jagtial delivery address.
- The production website is the customer experience source of truth for web, PWA, and the Android shell.

## Completed in this UX pass

- Map reverse-geocoding now returns structured street/area, city, state, and PIN-code details when Google provides them.
- Selecting a map pin prefills the delivery-address form.
- Raw latitude/longitude fields are no longer exposed to normal customers.
- Address entry is a mobile bottom sheet with clear labels and a pinned-location summary.
- Customers can change the delivery pin directly from the address form.
- Persistent mobile navigation provides Home, Services, Scan, Account/Login, and Cart.
- Mobile header is simplified to logo, delivery location, and search; duplicated action icons move to bottom navigation.
- Ask Zeshu floats above the mobile navigation instead of competing with it.

## Current strengths

- Responsive product grid and loading skeletons.
- Search, voice-search fallbacks, categories, brand/price/availability filters, sorting.
- Saved addresses, default address, orders, buy-again, rewards, referrals, support, policies.
- Clear separation of Jagtial physical delivery and India-wide digital-service availability.
- Cart has transparent price breakdown, free-delivery progress, stock recheck, and payment-reconciliation messaging.
- QR scanner and install/PWA surfaces are available.
- Android customer shell shares the production web logic instead of duplicating checkout/payment.

## Next customer-experience priorities

### P0 — real-device validation
- Android Chrome and the native Android shell: location permission, map pin, address autofill, keyboard behavior, QR camera, QR image upload, account/login, cart drawer.
- Desktop Chrome/Edge and Safari-equivalent testing: address selector, filters, account/cart drawers, focus and keyboard navigation.
- Jagtial field test: customer pin -> order -> rider assignment -> live rider GPS -> ETA -> Navigate -> delivered.
- Razorpay TEST checkout: open and cancel only; do not change payment logic.

### P1 — app release polish
- Play Store signing and Internal Testing.
- Android App Links using the Google Play signing SHA-256 fingerprint and /.well-known/assetlinks.json.
- Native splash/icon review and notification strategy.
- Update /app to hand Android users to Google Play after the listing exists.

### P1 — content hierarchy
- Keep the first mobile screen focused on delivery location, search, categories, active order, and a small Jagtial/India-wide availability explanation.
- Avoid large marketing blocks before products for returning customers.
- Keep unavailable services visibly labelled and prevent dead-end payment flows.

### P2 — performance and maintainability
- Split the large storefront page into customer-domain components without changing behavior.
- Replace remaining third-party product images with controlled/optimized assets where practical.
- Expand safe offline behavior for browsing while never caching authenticated checkout/payment/provider requests.
- ✅ Permanent mobile browser E2E now runs automatically after successful Cloudflare staging deployments, covering category/filter visibility and intent-aware search regression.

## Design rules

- 44px+ touch targets.
- Important actions at thumb reach on mobile.
- One primary action per card/modal.
- Customer language instead of technical language.
- Never show internal IDs, raw coordinates, provider secrets, or payment implementation details unless needed for support.
- Preserve server-side authorization and validation even when the UI makes a field easier to enter.
