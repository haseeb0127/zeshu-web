import Link from 'next/link';
import { ZESHU_LEGAL_BUSINESS as business } from '../lib/legal-business-details';

const sections = [
  {
    id: 'terms',
    title: 'Terms & Conditions',
    body: [
      `ZESHU is the trade name of ${business.legalName}, a GST-registered sole proprietorship in Telangana (GSTIN ${business.gstin}). Zeshu operates an online marketplace and local fulfilment interface. Users must be at least 18 years old to independently create an account or order. Zeshu does not currently sell age-restricted products.`,
      'Use accurate account, address, and order information. Orders are accepted only after successful payment verification and applicable provider confirmation. Zeshu may restrict access where necessary for security, misuse prevention, or operational safety.',
      'When an independent seller supplies an item, the seller remains responsible for lawful product pricing, descriptions, stock, packaging, origin, food safety where applicable, statutory declarations and product invoices. Zeshu remains responsible for its own marketplace, payment-coordination, delivery and consumer-support obligations; seller contracts cannot remove customer statutory rights.',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    body: [
      'Zeshu may process name or profile information, phone or email, authentication identifiers, delivery addresses, location information when permission is granted or a location feature is used, cart and favorites, order history, payment transaction references and status, support communications, device and security logs, and necessary cookies or browser storage for sessions, cart, and preferences.',
      'We use this information for account access, fulfilment, checkout and payment reconciliation, fraud and security, customer support, rewards, service improvement, and legal or accounting obligations. Zeshu does not need to store card numbers, CVV, or UPI PIN. Payment information is handled through the configured payment provider where applicable.',
      'We may share the minimum order, delivery and contact details needed for fulfillment with the chosen seller, authorised rider/courier and payment provider, subject to their role and applicable legal safeguards. We do not sell customer personal information to advertisers. Customers may contact privacy@zeshu.in for access, correction, withdrawal of optional permissions or deletion requests, subject to applicable law and legitimate transaction/accounting retention needs.',
      'For scheduled Zeshu Move quotation enquiries, we collect only the details you submit with express contact consent: chosen transport category, pickup town or landmark, destination, planned date/time, approximate passengers or goods, notes, name and mobile. Enquiries are stored privately for Zeshu administrator review, not automatically shared with unverified operators. A quote enquiry is not a driver booking, payment, or guarantee of provider response. Privacy requests, withdrawal of optional consent and deletion requests can be sent to privacy@zeshu.in subject to legal retention duties.',
      'For home-service enquiries, we collect a requested service category, name, mobile, chosen Jagtial service area, approximate budget, optional preferred date and a description. This information is private to authorised Zeshu staff until a suitable professional has been properly vetted and sharing is necessary and lawful for responding to that enquiry. We do not collect government ID documents or sensitive household access codes on the public enquiry form. Optional marketing consent is separate from consent to handle the requested enquiry.',
      'When the Zeshu Assistant AI feature is enabled, the text you send to that assistant, a limited recent support-chat context, and the minimum relevant read-only Zeshu context needed to answer the question may be processed by Zeshu\'s configured AI service provider. Depending on the question, that limited context may include recent order status and totals, Zeshu Cash balance/activity, or current product names, prices and stock. Full delivery addresses, payment credentials, OTPs, passwords, card numbers, CVV, UPI PIN, API keys and access tokens are not intentionally supplied as assistant context. The assistant request is configured not to be stored by the AI API where that option is supported. Do not send secrets in assistant chat. If the assistant cannot safely resolve an issue, the conversation may be transferred to Zeshu human support with the relevant question and assistant reply attached.',
      'Information is retained only for as long as reasonably necessary for the relevant purpose, legal or accounting obligations, fraud prevention, dispute resolution, and security, after which it may be deleted or anonymized as appropriate. Privacy requests may be sent to privacy@zeshu.in. Requests are handled subject to applicable Indian law and mandatory retention requirements.',
    ],
  },
  {
    id: 'home-services',
    title: 'Zeshu Home Services — Enquiries, Safety & Fees',
    body: [
      'Home-service categories currently support free manual quotation enquiries from Jagtial only. A submitted enquiry is not an accepted technician visit, employment placement, guaranteed provider assignment, fixed package, payment or confirmed appointment. Provider onboarding and commercial terms are still being verified.',
      'Service-menu definitions are standardised so that independently approved professionals can eventually publish their own upfront rates for comparable work. No menu preview is a confirmed offer. Visiting distance, extra travel charges, product/parts brand and cost, applicable GST and required written approval for non-standard work must be disclosed before a customer accepts a paid visit.',
      'If a verified provider is available, Zeshu may contact you about the requested service using the details you consented to share. Before a visit, customers should receive the relevant provider identity, declared skills/verification scope, actual inspection/visiting fees, labour and parts charges, applicable GST, cancellation conditions and a written quote. No blanket ₹99 inspection fee, ₹149 fan-install rate, or automatic waived-visit fee is currently promised.',
      'Do not send door-access codes, OTPs, Aadhaar scans, full payment-card data or sensitive information through an enquiry. Do not pay an unverified individual or send an advance before a written provider agreement is independently confirmed. If a professional differs from the accepted identity, or the final quoted charges are changed unexpectedly, contact Zeshu support.',
      'Babysitting, childcare, regular domestic staffing, in-home tutoring involving minors, unverified deep-cleaning crews and overnight/unattended home access are held pending additional checks and safeguarding. Online tutoring is not automatically safe or bookable. Zeshu does not guarantee background clearance or display Verified Partner status merely because an individual uploaded identification.',
      'For providers, Zeshu proposes optional ₹15 per accepted genuine quick opportunity or ₹50 per accepted genuine premium placement, alongside a proposed ₹299/month plan for eligible genuine opportunities subject to fair use. A non-expiring ₹200 prepaid-credit pack is an idea under separate payment/GST/RBI-PPI review. None of these plans is enabled, billed or recurring today; choosing a preferred plan on the application is not agreement to pay. Paid plans require clear tax invoices, verified lead definitions, dispute/refund and cancellation terms and affirmative opt-in. Customer statutory rights and grievance routes remain available regardless of direct-to-provider payment.',
    ],
  },
  {
    id: 'business-gst',
    title: 'Registered Business & GST Information',
    body: [
      `Trading name: ${business.tradeName}. Legal name: ${business.legalName}. Constitution: ${business.constitution}. GSTIN: ${business.gstin}. REG-06 Regular GST registration effective from ${business.gstEffectiveDate}.`,
      `Registered principal place of business: ${business.registeredAddress}. For a clear overview of our operations and contact details, visit ${business.website}/business-details.`,
      'Zeshu’s GST registration is not the GST registration of each independent seller. Product GST, required invoices, marketplace TCS/TDS and platform-service GST depend on the actual taxable supply, seller legal status, collection/settlement arrangement and applicable law. A Regular GST certificate by itself does not prove separate e-commerce-operator TCS registration.',
    ],
  },
  {
    id: 'marketplace-model',
    title: 'Marketplace, Product Prices & Seller Identification',
    body: [
      'Zeshu provides customer discovery, order coordination, support and, where operational, payment and delivery services for participating sellers. Independent shops maintain and dispatch their inventory; Zeshu does not automatically own or manufacture all items displayed. A seller may act as the seller of record for the goods, while Zeshu invoices its separate platform services where applicable.',
      'The order page should identify the selling business and provide available statutory information, applicable GSTIN or other registration where required, product price including relevant taxes, delivery eligibility, quantity or weight, availability, expiry/use-before information for relevant foods, warranty or return eligibility, and who to contact for a dispute. Seller registration and trust badges are not a substitute for verified documents.',
      'Product price, delivery and any platform charges are displayed before payment. Mandatory charges cannot be added as a surprise. Optional sponsored placements must be clearly labelled. Search and category relevance, availability, price, customer-selected sorting and verified delivered-order ratings may influence how listings appear; paid placement must not masquerade as an organic recommendation.',
    ],
  },
  {
    id: 'seller-payouts-taxes',
    title: 'Seller Payouts, Fees & Statutory Deductions',
    body: [
      'Zeshu is planning a zero-sales-commission seller membership, provisionally ₹299/month inclusive of applicable tax with a 14-day introduction period. This is not an active recurring billing commitment: no seller membership can be charged until its exact contract, invoice, payment method, renewal and cancellation terms are disclosed and accepted.',
      'Customer payments are handled only through the enabled approved payment-provider checkout. Real linked-seller split settlements and automatic payouts have not yet been verified as live. Before activation, each seller must accept a clear settlement schedule covering fulfilled order values, actual agreed gateway charges, valid refunds/chargebacks, delivery or seller-funded promotions, and applicable government withholding such as TCS/TDS. No unsupported instant-payout promise is made.',
      'If Zeshu charges a platform fee, it is separately identified on checkout and invoiced according to applicable tax requirements. The proposed ₹10 tax-inclusive Jagtial handling fee and distance-based delivery pilot are staged but not switched on. A seller can be held responsible for costs caused by its own wrong, defective or misdescribed goods under applicable law and an agreed fair policy—not automatically for every customer return or courier incident.',
    ],
  },
  {
    id: 'payments',
    title: 'Payments',
    body: [
      'Where a grocery payment flow is available, it uses the configured Razorpay checkout, currently in TEST mode during verification. Zeshu records verified payment references and order status for reconciliation; card data, CVV and UPI PIN are handled through the payment provider or banking app. Do not treat TEST-mode transactions as live seller collections.',
      'Mobile recharge plan discovery may be available, but any Razorpay flow exposed for mobile recharge is TEST-mode only. A successful test payment is not a successful telecom recharge, and no real telecom fulfilment is submitted. Real utility bill payments are currently unavailable.',
      'No payment is currently available for Pharmacy & Health, UPI Tools, or unavailable utility services.',
    ],
  },
  {
    id: 'payment-gateway',
    title: 'Payment Gateway & Failed Transaction Policy',
    body: [
      'Zeshu displays supported payment methods through the configured payment gateway. Payment credentials such as card CVV and UPI PIN are entered with the payment provider or banking application and should never be shared with Zeshu support.',
      'A bank debit, UPI debit, or gateway success screen is not by itself proof that a Zeshu order has been finalized. Zeshu confirms an order only after server-side payment verification and order reconciliation. If money is debited but the order is not confirmed, do not pay again; use Help & Support so the existing transaction can be checked safely. Buyers do not pay separate card or UPI surcharges merely because the payment method is different.',
      'Where a verified payment must be refunded, an approved monetary refund is returned to the original payment method where supported. Bank or payment-provider processing time may apply. Zeshu does not charge a separate payment-gateway, convenience, or payment-processing fee unless a future charge is clearly disclosed before payment and is permitted by applicable law.',
      'Payment providers may have their own technical terms, dispute processes, card-network or UPI rules. Those provider terms do not remove Zeshu customer rights or replace Zeshu policies for orders sold or facilitated through Zeshu.',
    ],
  },
  {
    id: 'cancellation-refunds',
    title: 'Cancellation & Refunds',
    body: [
      'Customers can request cancellation before the seller starts irreversible preparation or dispatch, and can contact support later where necessary. Some perishable or made-to-order goods cannot be stopped once preparation materially starts; this does not cancel statutory rights for wrong, unsafe, damaged or defective goods. No cancellation fee is currently imposed. Any future fees must be fair, legally permitted and clearly disclosed, including reciprocal rules for unilateral seller/platform cancellations where required.',
      'If Zeshu or the seller cancels an accepted paid order, any applicable monetary refund is initiated to the original payment method where supported, including relevant delivery/platform fees where due. Approved monetary refunds are normally processed within 5–7 business days after approval; actual credit depends on banks and providers. Refunds must not be delayed merely because a seller payout is pending. Zeshu Cash is never substituted for a monetary refund without the customer explicitly choosing it.',
    ],
  },
  {
    id: 'returns',
    title: 'Returns & Replacements',
    body: [
      'For food, groceries, and fresh or perishable goods, report a wrong, missing, damaged, expired, spoiled, or materially poor-quality item within 24 hours of delivery where reasonably possible. Opened or perishable items are normally non-returnable merely because of a change of mind, but genuine quality or fulfilment issues remain eligible for review.',
      'Reasonable evidence, such as photographs, may be requested where appropriate. Depending on the issue and applicable law, a replacement, partial refund or full refund may be available. Zeshu coordinates the complaint instead of simply referring the customer to the seller. The seller ordinarily funds remedies for its own fault under its agreement; courier-fault disputes are investigated with the delivery partner, without unfairly delaying legally required customer relief.',
      'For electronics and clothing, report a wrong product, damage, manufacturing defect, missing component, or materially different item within 7 working days of delivery. Manufacturer or seller warranty may apply. Return eligibility is not promised for every opened or used electronics product.',
    ],
  },
  {
    id: 'delivery',
    title: 'Shipping & Delivery',
    body: [
      'Physical delivery for groceries, fresh food and eligible products is currently limited to supported Jagtial areas. Seller and rider capacity, verified address, handling needs, road conditions, weather and order volume determine availability and ETA. The customer sees the actual checkout delivery charge before payment; do not assume free delivery for every basket in future. The proposed local ₹10 platform handling and revised delivery tiers are not live unless the checkout shows them. Zeshu does not promise universal 10-minute delivery.',
      'Zeshu does not currently offer nationwide physical shipping. A planned future marketplace courier flow will calculate actual eligible-seller pickup, package weight, courier price and destination before payment. Customer returns, refused delivery and failed delivery follow a transparent fault-based policy; chicken, mutton, fish and other perishables remain local unless temperature-controlled fulfilment and licensing are independently approved. Digital services may be used across India only where the respective provider is operational.',
      'Scheduled Zeshu Move transport quote enquiries may be submitted from Jagtial, Dharmaram, Korutla, Metpally and Dharmapuri when the quote inbox is available. These are manual enquiry requests, not instant ride matching, confirmed vehicle bookings or pre-authorised fares. Passenger bike taxis and stranger-to-stranger per-seat car pooling are unavailable. Required licences, permits, insurance, operator identity, fare quotation and cancellation terms must be verified before any actual transport contract is accepted.',
    ],
  },
  {
    id: 'zeshu-cash',
    title: 'Zeshu Cash Terms',
    body: [
      'Zeshu Cash is a promotional reward value, not bank money. ₹1 Zeshu Cash has ₹1 redemption value. It is non-transferable unless Zeshu explicitly enables transfer and cannot be withdrawn as cash.',
      'For a grocery order, the maximum redemption is the lowest of available balance, the amount requested, ₹20, 10% of merchandise subtotal, and the amount that keeps final payable at least ₹1. There is no minimum redemption amount; fractional redemption down to ₹0.01 is supported where the flow permits it.',
      'Current delivered-grocery earning rules are: ₹99–₹198.99 earns ₹1; ₹199–₹298.99 earns ₹2; ₹299–₹499.99 earns ₹3; ₹500 or more earns ₹5; below ₹99 earns ₹0. The third delivered eligible order may earn a ₹5 monthly milestone bonus and the fifth may earn ₹10. Referral rewards are ₹20 for the referrer and ₹10 for the referred customer after the referred customer’s qualifying first delivered order, subject to current program rules.',
      'Reward terms may be changed prospectively. Already-earned valid balances should not be arbitrarily removed. Cancelled, refunded, or invalid orders may cause associated rewards to be reversed. Reserved redemption holds are released when an unpaid checkout is safely abandoned or reconciled. Contact support for balance disputes. No expiry date is stated because none is currently published.',
    ],
  },
  {
    id: 'pharmacy',
    title: 'Pharmacy & Health',
    body: [
      'Pharmacy & Health is currently an informational or upcoming category. Medicine fulfilment and medicine payment are disabled, and no prescription medicine transaction can currently be completed through Zeshu. Zeshu does not currently dispense medicines through this service.',
    ],
  },
  {
    id: 'utilities',
    title: 'Recharge & Utility Services',
    body: [
      'Read-only discovery may be available for mobile plans, DTH, Electricity, FASTag, Piped Gas, LPG, Water, and Broadband. Real utility bill payments are currently OFF. Provider information or bill lookup must not be understood as payment or settlement confirmation.',
      'Recharge, bill, QR, rewards, referral and sponsored digital services are intended for India-wide use and do not depend on the Jagtial delivery zone. Mobile recharge discovery may be available for plans, but real telecom fulfilment and utility payment execution remain enabled only where explicitly stated. A1Topup execution is OFF. UPI merchant payment/cashback execution is not yet enabled, and WhatsApp ordering remains disabled.',
    ],
  },
  {
    id: 'grievance',
    title: 'Grievance & Customer Support',
    body: [
      `${business.legalName}, Proprietor / Grievance Officer, ZESHU, handles consumer complaints and escalation. Email: ${business.grievanceEmail}. Phone: ${business.supportPhone}. Postal address: ${business.registeredAddress}.`,
      `Consumer complaints will be acknowledged within 48 hours of receipt and Zeshu will work to redress them within one month or the shorter period required by law. A copy or reference of a recorded complaint may be provided to the complainant as applicable. General support: ${business.supportEmail} and ${business.supportPhone}. Privacy requests: ${business.privacyEmail}.`,
    ],
  },
  {
    id: 'seller',
    title: 'Seller / Vendor Terms',
    body: [
      'Participating sellers must supply their legal business identity, geographic address, customer care information, applicable GST/MSME/FSSAI registration or other statutory identifiers, verified product prices and stock, lawful country-of-origin/expiry/quantity details, warranty and return conditions, and a valid dispatch location. Zeshu may facilitate ordering, payment, support, and delivery where operational. Seller eligibility, payouts, costs, cancellations and statutory deductions must be defined in the signed seller agreement before activation. Customer rights remain unaffected.',
    ],
  },
  {
    id: 'sponsored',
    title: 'Sponsored Content',
    body: [
      'Zeshu does not currently operate sponsored placements. If sponsored or promoted placements are introduced later, they will be clearly identified as Sponsored or Promoted where required.',
    ],
  },
  {
    id: 'law',
    title: 'Governing Law & Jurisdiction',
    body: [
      'These terms are governed by the applicable laws of India. Customer statutory consumer rights are not excluded. The terms remain subject to mandatory jurisdiction under applicable law; competent courts or authorities in Jagtial, Telangana may have jurisdiction where legally applicable.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact Details',
    body: [
      `Trade name: ${business.tradeName}. Registered proprietor: ${business.legalName}. GSTIN: ${business.gstin}. Business form: ${business.constitution}. Registered business address: ${business.registeredAddress}.`,
      `Customer support: ${business.supportEmail} and ${business.supportPhone}. Privacy: ${business.privacyEmail}. Grievance: ${business.grievanceEmail}, ${business.legalName}, Proprietor / Grievance Officer. See ${business.website}/business-details.`,
    ],
  },
];

export default function PoliciesPage() {
  return (
    <main className="min-h-screen bg-[#f8fbf8] px-4 py-10 text-slate-900 md:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-black text-[#075E45]">← Back to Zeshu</Link>
        <header className="mt-8 rounded-3xl bg-[#083b27] p-7 text-white md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a6dfba]">Zeshu Trust Center</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Policies &amp; customer information</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#d9f3e3]">Clear information about ordering, delivery, payments, rewards, service availability, privacy, and support.</p>
          <p className="mt-3 text-xs font-bold text-[#b9e8c8]">Last updated: 23 November 2026</p>
        </header>
        <nav aria-label="Policy sections" className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">On this page</p>
          <div className="mt-3 flex flex-wrap gap-2">{sections.map((section) => <a key={section.id} href={`#${section.id}`} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-black text-[#075E45]">{section.title}</a>)}</div>
        </nav>
        <div className="mt-6 space-y-4">
          {sections.map((section) => <section id={section.id} key={section.id} className="scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black">{section.title}</h2>{section.body.map((paragraph) => <p key={paragraph} className="mt-3 text-sm leading-6 text-slate-600">{paragraph}</p>)}</section>)}
        </div>
      </div>
    </main>
  );
}
