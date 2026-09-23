import Link from 'next/link';

const sections = [
  {
    id: 'terms',
    title: 'Terms & Conditions',
    body: [
      'Zeshu is a sole proprietorship trading as Zeshu. You must be 18 years or older to independently create an account or place an order. Zeshu does not currently sell age-restricted products.',
      'Use accurate account, address, and order information. Orders are accepted only after successful payment verification and applicable provider confirmation. Zeshu may restrict access where necessary for security, misuse prevention, or operational safety.',
      'Where third-party sellers participate, the seller is responsible for accurate product information, quality, statutory declarations, and applicable warranty or guarantee information. Customer statutory rights are not excluded.',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    body: [
      'Zeshu may process name or profile information, phone or email, authentication identifiers, delivery addresses, location information when permission is granted or a location feature is used, cart and favorites, order history, payment transaction references and status, support communications, device and security logs, and necessary cookies or browser storage for sessions, cart, and preferences.',
      'We use this information for account access, fulfilment, checkout and payment reconciliation, fraud and security, customer support, rewards, service improvement, and legal or accounting obligations. Zeshu does not need to store card numbers, CVV, or UPI PIN. Payment information is handled through the configured payment provider where applicable.',
      'When the Zeshu Assistant AI feature is enabled, the text you send to that assistant, a limited recent support-chat context, and the minimum relevant read-only Zeshu context needed to answer the question may be processed by Zeshu\'s configured AI service provider. Depending on the question, that limited context may include recent order status and totals, Zeshu Cash balance/activity, or current product names, prices and stock. Full delivery addresses, payment credentials, OTPs, passwords, card numbers, CVV, UPI PIN, API keys and access tokens are not intentionally supplied as assistant context. The assistant request is configured not to be stored by the AI API where that option is supported. Do not send secrets in assistant chat. If the assistant cannot safely resolve an issue, the conversation may be transferred to Zeshu human support with the relevant question and assistant reply attached.',
      'Information is retained only for as long as reasonably necessary for the relevant purpose, legal or accounting obligations, fraud prevention, dispute resolution, and security, after which it may be deleted or anonymized as appropriate. Privacy requests may be sent to privacy@zeshu.in. Requests are handled subject to applicable Indian law and mandatory retention requirements.',
    ],
  },
  {
    id: 'payments',
    title: 'Payments',
    body: [
      'Grocery payments use the displayed Razorpay checkout. Zeshu records verified payment identifiers and status for order reconciliation; payment credentials are handled by the payment provider.',
      'Mobile recharge plan discovery may be available, but any Razorpay flow exposed for mobile recharge is TEST-mode only. A successful test payment is not a successful telecom recharge, and no real telecom fulfilment is submitted. Real utility bill payments are currently unavailable.',
      'No payment is currently available for Pharmacy & Health, UPI Tools, or unavailable utility services.',
    ],
  },
  {
    id: 'payment-gateway',
    title: 'Payment Gateway & Failed Transaction Policy',
    body: [
      'Zeshu displays supported payment methods through the configured payment gateway. Payment credentials such as card CVV and UPI PIN are entered with the payment provider or banking application and should never be shared with Zeshu support.',
      'A bank debit, UPI debit, or gateway success screen is not by itself proof that a Zeshu order has been finalized. Zeshu confirms an order only after server-side payment verification and order reconciliation. If money is debited but the order is not confirmed, do not pay again; use Help & Support so the existing transaction can be checked safely.',
      'Where a verified payment must be refunded, an approved monetary refund is returned to the original payment method where supported. Bank or payment-provider processing time may apply. Zeshu does not charge a separate payment-gateway, convenience, or payment-processing fee unless a future charge is clearly disclosed before payment and is permitted by applicable law.',
      'Payment providers may have their own technical terms, dispute processes, card-network or UPI rules. Those provider terms do not remove Zeshu customer rights or replace Zeshu policies for orders sold or facilitated through Zeshu.',
    ],
  },
  {
    id: 'cancellation-refunds',
    title: 'Cancellation & Refunds',
    body: [
      'Before vendor or order confirmation, a customer may request cancellation. After confirmation, an order is normally not cancellable once fulfilment has materially started, although Zeshu may consider a request case by case where operationally possible. No cancellation fee is charged unless a future product rule expressly introduces one in accordance with applicable law.',
      'If Zeshu or a vendor cancels an accepted paid order, the applicable monetary refund is made to the original payment method where supported. Approved monetary refunds are normally processed within 5–7 business days after approval; actual credit timing may also depend on the bank or payment provider. Zeshu Cash is never silently substituted for a monetary refund. It may be used only when the customer explicitly chooses it and the relevant flow supports it.',
    ],
  },
  {
    id: 'returns',
    title: 'Returns & Replacements',
    body: [
      'For food, groceries, and fresh or perishable goods, report a wrong, missing, damaged, expired, spoiled, or materially poor-quality item within 24 hours of delivery where reasonably possible. Opened or perishable items are normally non-returnable merely because of a change of mind, but genuine quality or fulfilment issues remain eligible for review.',
      'Reasonable evidence, such as photographs, may be requested where appropriate. Depending on the verified issue and applicable law, a replacement, partial refund, or full refund may be available.',
      'For electronics and clothing, report a wrong product, damage, manufacturing defect, missing component, or materially different item within 7 working days of delivery. Manufacturer or seller warranty may apply. Return eligibility is not promised for every opened or used electronics product.',
    ],
  },
  {
    id: 'delivery',
    title: 'Shipping & Delivery',
    body: [
      'Physical delivery for groceries, fresh food, essentials and other eligible physical products is currently limited to the supported Jagtial delivery zone. Estimated delivery times are estimates and may vary because of availability, traffic, weather, address accuracy, order volume, safety conditions, and operational factors. Zeshu does not promise universal 10-minute delivery.',
      'Zeshu does not currently offer nationwide physical shipping. Digital services can be used across India where the relevant provider integration is available. Keep delivery addresses accurate for Jagtial physical orders.',
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
      'Haseeb, Proprietor / Grievance Officer, Zeshu, handles consumer complaints and grievance escalation. Email: grievance@zeshu.in. Postal address: 1-2-210/A/1, Sai Ram Nagar, Jagtial, Telangana – 505327, India. A dedicated Zeshu customer-care phone number will be published before real-money commercial launch.',
      'Consumer complaints will be acknowledged within 48 hours of receipt and Zeshu will endeavour to resolve or redress them within one month, subject to applicable law and the complexity of the matter. General support: support@zeshu.in. Privacy requests: privacy@zeshu.in.',
    ],
  },
  {
    id: 'seller',
    title: 'Seller / Vendor Terms',
    body: [
      'Where third-party sellers or vendors participate, they must provide accurate product, stock, quality, statutory-declaration, warranty, and guarantee information applicable to their products. Zeshu may facilitate ordering, payment, support, and delivery depending on the product. Customer rights under applicable law remain unaffected.',
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
      'Trading / business name: Zeshu. Business form: Sole Proprietorship. Correspondence address: 1-2-210/A/1, Sai Ram Nagar, Jagtial, Telangana – 505327, India.',
      'Customer support: support@zeshu.in. Privacy: privacy@zeshu.in. Grievance: grievance@zeshu.in, Haseeb, Proprietor / Grievance Officer. A dedicated Zeshu customer-care phone number will be published before real-money commercial launch.',
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
          <p className="mt-3 text-xs font-bold text-[#b9e8c8]">Last updated: September 2026</p>
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
