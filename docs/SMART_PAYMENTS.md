# Zeshu smart payment router

## Customer experience

Customers should see one Zeshu checkout, not a confusing list of gateway companies. The customer chooses a payment method such as UPI, card or net banking. Zeshu chooses the healthy eligible gateway behind the scenes.

## Business routing principles

Routing is based on merchant-specific approved pricing plus real Zeshu performance. Public promotional prices are not hard-coded.

Order of importance:

1. Payment safety and no duplicate charge.
2. Provider health and recent payment success.
3. Customer checkout latency.
4. Effective gateway fee.
5. Configured provider priority.

A cheaper gateway must not be chosen if its recent payment success is materially worse.

## Safe failover

Never create a replacement payment attempt while the original provider is still pending or its state is unknown.

Automatic replacement is allowed only when the previous attempt is conclusively NOT_STARTED, FAILED, CANCELLED or REVERSED. Late success from an older attempt must go through reconciliation and must never create a second order.

## Rollout

- Phase 0: Razorpay continues unchanged.
- Phase 1: Create private gateway profiles and payment-attempt ledger; router mode remains `off`.
- Phase 2: Onboard Cashfree, PhonePe and Paytm in sandbox. Verify create-payment, server-side status, webhooks, refunds and delayed-success handling. PhonePe Standard Checkout sandbox has a staging-only test harness in Payments HQ; it never creates a Zeshu order or enables routing.
- Phase 3: `observe` mode records which provider would have been selected without changing customer payments.
- Phase 4: Enable `smart` routing for a small percentage of test traffic, then expand only after reconciliation and success-rate data are healthy.

## Secrets

Never place provider secrets in client code or GitHub.

Expected server-only variables:

- Cashfree: `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_WEBHOOK_SECRET`
- PhonePe: `PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET`, `PHONEPE_CLIENT_VERSION`
- Paytm: `PAYTM_MID`, `PAYTM_MERCHANT_KEY`, `PAYTM_WEBSITE`

Provider-specific webhook credentials should be added only after the merchant dashboard supplies them.


## PhonePe staging sandbox test

- Environment: `PHONEPE_ENV=sandbox` only.
- Credentials: `PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET`, `PHONEPE_CLIENT_VERSION`.
- Sandbox APIs use PhonePe's pre-production `/apis/pg-sandbox` endpoints.
- Test UI is visible only on the Cloudflare staging hostname under Admin → Payments HQ.
- Sandbox test amounts are limited to ₹1–₹100.
- Test create/status calls require a staging QA or admin session.
- The sandbox harness does not create an inventory reservation, customer order, fulfillment request or smart-router attempt.
- Keep `PAYMENT_ROUTER_MODE=off` until provider create/status/callback/refund testing is complete and explicitly approved.
