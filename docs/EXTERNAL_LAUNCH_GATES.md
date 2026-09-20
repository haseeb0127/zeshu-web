# Zeshu External Launch Gates

This file tracks launch dependencies that cannot be completed only by shipping code. Keep customer-facing features disabled until the corresponding evidence is available.

## Food / fresh categories
**Gate:** Do not commercially fulfil food or fresh-food marketplace orders until Zeshu has the appropriate FSSAI e-commerce licence and each food supplier has the applicable FSSAI registration/licence.

Current official references:
- FSSAI order dated 18 March 2026 on e-commerce FBO obligations: https://fssai.gov.in/upload/advisories/2026/03/69baca7e9787aCompliance%20Obligation%20ONDC%20Model.pdf
- FoSCoS e-commerce eligibility: https://foscos.fssai.gov.in/

Supplier intake evidence:
- legal business name and proprietor/company details
- FSSAI number and validity
- GSTIN where applicable
- premises/address
- product catalogue, pack sizes, MRP/selling price
- batch/expiry handling where applicable
- cold-chain/storage requirements
- substitution policy
- damaged/spoiled/missing-item responsibility
- settlement details and invoice format
- delivery handoff times and stock-update process

## Consumer / product disclosures
**Gate:** Keep seller identity, price, availability, refund/return terms, grievance channels and required package declarations visible and accurate.

Official references:
- Consumer Protection (E-Commerce) Rules, 2020 and 2021 amendment: https://consumeraffairs.nic.in/acts-and-rules/consumer-protection/consumer-protection
- Legal Metrology / Packaged Commodities rules: https://consumeraffairs.nic.in/

## Pharmacy
**Gate:** Medicine payment/fulfilment stays OFF until a licensed retail pharmacy partner, prescription workflow, jurisdiction review and record-retention process are approved.

Operational minimum:
- verify retail drug licence(s) and permitted premises/jurisdiction
- pharmacist/dispensing responsibility remains with licensed pharmacy
- prescription-only drugs cannot be sold without the required prescription
- prohibited/controlled categories require separate legal review
- preserve bills, prescription and dispensing records where required
- Zeshu must not present itself as dispensing medicines unless it is legally licensed to do so

Official reference:
- CDSCO Drugs Rules: https://cdsco.gov.in/opencms/opencms/en/Acts-and-rules/Drugs-Rules/

## Recharge and utility bill payments
**Gate:** Discovery may remain read-only. Do not turn on real bill-payment/recharge fulfilment until Zeshu has a production agreement with an authorised/certified participant or service provider, plus reconciliation and refund handling.

Official reference:
- RBI Master Direction – Bharat Bill Payment System Directions, 2024: https://www.rbi.org.in/

Provider onboarding checklist:
- legal counterparty and agreement
- production credentials rotated and stored server-side
- supported billers/recharge categories
- transaction status contract
- idempotency/retry contract
- webhook/signature verification
- settlement and commission reports
- failed/pending/reversed transaction handling
- refund/reversal SLA
- customer receipt/reference format
- support escalation route

## Electronics / clothing
**Gate:** Do not advertise same-day/five-hour electronics delivery until a dealer commits to inventory accuracy and the SLA is field-tested.

Dealer/supplier intake:
- invoice/GST details where applicable
- brand authorisation/warranty responsibility where applicable
- serial/IMEI handling for relevant electronics
- stock update frequency
- packing standards
- wrong/damaged/defective-item SLA
- manufacturer warranty information
- delivery cutoff and same-day service radius

## Banking / tax / accounting
Before commercial scale:
- business current account / payment merchant onboarding
- CA review of GST registration, invoicing, marketplace/operator treatment and TCS/TDS obligations as applicable to the final commercial model
- separate ledger treatment for customer money, vendor settlements, delivery charges, refunds, Zeshu Cash, brand funding and provider commissions
- preserve invoices and settlement/reconciliation reports

## AI support production activation
Current safe production status can be checked at:
- GET /api/support/assistant
- expected response contains mode=ai or mode=guided and automatic_handoff=true

To enable real AI:
- add OPENAI_API_KEY as a server-side Vercel Production secret
- set SUPPORT_AI_ENABLED=true
- optional SUPPORT_AI_MODEL=gpt-5.6-luna
- redeploy
- confirm readiness reports mode=ai
- run a signed-in informational question
- run one signed-in unresolved test and verify the same thread appears in ZESHU HQ
- never paste the API key into source code, logs, chat, or a NEXT_PUBLIC variable

## Before launch decision
Evidence required:
- latest Vercel deployment green
- production smoke workflow green
- real-device customer login/address/catalog/support test
- rider GPS/ETA/navigation field test
- current supplier/service agreements
- relevant licence/compliance evidence
- finance/refund/reconciliation SOP
- customer support owner and escalation rota
