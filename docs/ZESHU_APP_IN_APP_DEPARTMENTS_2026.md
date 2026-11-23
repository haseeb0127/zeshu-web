# Zeshu — one account, seven department homepages
Updated: 23 November 2026

## Architecture and routes
- Keep one Next.js app in `zeshu-web`; root `app/layout.tsx` still owns the single CustomerLanguageProvider, PWA, account and support assistant.
- `app/lib/department-config.ts`: route, accent, contextual search/action and mobile tabs for Dine, Fashion, Pay, Move, Services, Weddings, Interiors. The customer main hub remains `/`; no second auth or wallet is created.
- `app/components/DepartmentFrame.tsx`: lightweight pathname-aware top switcher and bottom navigation, only for department routes; uses full-document links to preserve Android soft-navigation recovery. The first bottom tab is always Hub.
- Canonical dedicated routes: `/dine`, `/fashion`, `/pay`, `/move`, `/services`, `/weddings`, `/interiors`. Legacy `/professional-services/*` pages remain to preserve bookmarks. `/services` now means home services; bill/recharge discovery stays `/pay`.
- `app/components/departments/PageBlocks.tsx` includes HeroCarousel, CategoryIconGrid, HorizontalDealRail, TwoColumnCatalogGrid, PortfolioQuoteCard, FormBookingCard for incremental reuse. HorizontalDealRail returns nothing without verified offers.
- Homepage carousel, desktop department navigation, global search shortcuts, professional services hub and sitemap point to short routes.

## Gating principles, not claims of live service
| Department | Current behavior | Before extra features can be enabled |
| --- | --- | --- |
| Shop / | Preserve current local shopping, real product feed and existing cart/checkout. No combined food, fashion and transport cart. | Existing stock, delivery and payment gates remain authoritative |
| Dine /dine | Warm dining home: restaurant and real menu search, restaurant-confirmed table requests and optional pre-orders, my request status; food delivery and takeaway shown as not live | Verified restaurant menus, prep times, open status, distance, delivery/logistics and settlement before enabling any additional mode; do not guess open-now or booking slots |
| Pay /pay | Blue utility grid with searchable categories. Zeshu Cash is described as the same account balance but no fabricated amount, paid bills, repeat shortcuts or receipts appear | Licensed/authorized provider, verified biller + fulfillment, safe receipt/UTR and payment reconciliation before live bill pay |
| Move /move | Dark transport page with pickup, destination and vehicle selection; prefilled `/move/quote` manual request. Map API and live matching are not invoked from the department landing page | Driver & transport compliance, actual fare/route coverage and provider matching before claiming instant service. Bike Taxi remains on regulatory hold |
| Services /services | Jagtial pilot, service-menu search and free quote enquiry, proposed fee comparison. No verified provider directory, confirmed prices, subscription or wallet | Vet real professionals; approve quotes and cancellation/dispute rules; review platform GST, Telangana worker duties and RBI/PPI questions before charging |
| Fashion /fashion | Plum editorial, audience pills, real searchable in-stock catalogue only. Tall two-column mobile photos, product-level sizes/return tags | Seller-stock, shipping SLA, actual delivery zone and return policy must be verified before buy flow; do not assert same-day delivery without data |
| Weddings /weddings | Warm premium enquiry and town/budget suggestion with no fabricated portfolio | Only show genuine consented photographs, approved providers and supported towns/appointments |
| Interiors /interiors | Warm neutral enquiry and town/budget suggestion with no fabricated portfolio | Same actual provider and portfolio verification safeguards |

## Planned activation thresholds
- A suggested 10–15 verified district partners per Weddings, Interiors, Fashion or Services department is a *review target*, not an automatic rollout switch and not a claim that they exist.
- A department page can be useful as a quote/enquiry or catalog discovery now without inventing verified providers.
- Future standalone department carts/flows must share the same authenticated customer identity and saved addresses while remaining separate transactions. Zeshu Cash use is subject to actual wallet eligibility and payment compliance, not just shell branding.
- All department contact actions must be connected to existing routes. Avoid empty grids, dummy balances, fake reviews, fictional discounts and unavailable payment CTAs.

## Release procedure
1. Run `node --experimental-strip-types .github/scripts/departments-app-in-app-qa.ts` plus existing homepage, home-services, sitemap tests and Next.js build.
2. Require successful Cloudflare compatibility and staging deploy; verify seven top-level department routes and UI navigation on mobile.
3. Use existing customer staging browser QA and exact-SHA automatic production promotion only after successful gates.
4. Do not enable subscriptions, real payments, pooled rides, unapproved childcare/domestic placement or wallet credits as part of this work.
