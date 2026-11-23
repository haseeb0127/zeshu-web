"use client";
import GlossyArtwork from "@/app/components/GlossyArtwork";
import MoveQuickQuote from "@/app/components/MoveQuickQuote";


import Link from "@/app/components/DocumentLink";
import { ArrowLeft, Bike, Bus, Car, Hotel, Luggage, Package, Plane, ShieldCheck, Sparkles, TrainFront, Truck, Users } from "lucide-react";
import { LanguageSwitcher, useCustomerLanguage } from "../components/CustomerLanguageProvider";

type ServiceCard = {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionLabel?: string;
  regulatoryHold?: boolean;
  quoteCode?: string;
};

const localRides: ServiceCard[] = [
  { title: "Bike Ride", description: "Register founding rider interest. Passenger bookings remain disabled until Telangana transport approvals and safety requirements are verified.", icon: <Bike size={22} />, actionLabel: "Register rider interest", regulatoryHold: true },
  { title: "Auto", description: "Local auto booking will open only after driver availability and licensing checks.", icon: <Car size={22} />, actionLabel: "Not yet bookable", regulatoryHold: true },
  { title: "Cab", description: "Scheduled whole-cab quotes are available for enquiry. Live instant matching is not yet enabled.", icon: <Car size={22} />, actionLabel: "Request scheduled quote", regulatoryHold: true, quoteCode: "OUTSTATION_CAB" },
  { title: "Rental Car", description: "Hourly and day rentals will open only with verified rental partners.", icon: <Car size={22} />, actionLabel: "Not yet bookable", regulatoryHold: true },
];

const courier: ServiceCard[] = [
  { title: "Bike Courier", description: "Instant document and small-parcel matching is not yet active.", icon: <Package size={22} />, actionLabel: "Not yet bookable", regulatoryHold: true },
  { title: "Auto / Mini Truck", description: "Scheduled mini-truck goods transport enquiry; driver quote required.", icon: <Truck size={22} />, actionLabel: "Request truck quote", regulatoryHold: true, quoteCode: "MINI_TRUCK" },
  { title: "Shop Delivery", description: "Seller-to-customer dispatch depends on verified shop and rider availability.", icon: <Package size={22} />, actionLabel: "Not yet individually bookable", regulatoryHold: true },
];

const sharing: ServiceCard[] = [
  { title: "Car Share", description: "Stranger-to-stranger per-seat pooling is not available. Future group fare-splitting would be only for one known group travelling in the same full cab.", icon: <Users size={22} />, actionLabel: "Not bookable", regulatoryHold: true },
];

const travel: ServiceCard[] = [
  { title: "Bus", description: "Intercity ticket booking is not live. Use whole-bus hire quote requests for planned groups.", icon: <Bus size={22} />, actionLabel: "Not yet bookable", regulatoryHold: true },
  { title: "Train", description: "Rail ticket booking requires an authorized partner and is not live.", icon: <TrainFront size={22} />, actionLabel: "Not yet bookable", regulatoryHold: true },
  { title: "Flights", description: "Flight booking will require an authorized distribution partner.", icon: <Plane size={22} />, actionLabel: "Not yet bookable", regulatoryHold: true },
  { title: "Hotels", description: "Hotel booking requires verified inventory and partner confirmation.", icon: <Hotel size={22} />, actionLabel: "Not yet bookable", regulatoryHold: true },
  { title: "Experiences", description: "Verified local experience reservations will be introduced later.", icon: <Luggage size={22} />, actionLabel: "Not yet bookable", regulatoryHold: true },
];

function ServiceSection({ title, cards }: { title: string; cards: ServiceCard[] }) {
  const { t } = useCustomerLanguage();
  return (
    <section id={title==="Local rides"?"move-local":undefined} className="mt-7 scroll-mt-36">
      <h2 className="text-lg font-black text-slate-950 md:text-xl">{t(title)}</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.title} className="zeshu-gloss-card rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,.04)]">
            <div className="flex items-start justify-between gap-3">
              <span className="zeshu-gloss-icon grid h-12 w-12 place-items-center rounded-2xl text-white" aria-hidden="true">{card.icon}</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#075E45]">{t(card.quoteCode ? "Quote enquiry" : card.regulatoryHold ? "Coming soon" : "Check availability")}</span>
            </div>
            <h3 className="mt-4 font-black text-slate-900">{t(card.title)}</h3>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-500">{t(card.description)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {card.regulatoryHold && card.title === "Bike Ride" ? (
                <Link href="/earn#join" className="inline-flex rounded-xl bg-[#075E45] px-3 py-2 text-xs font-black text-white">{t(card.actionLabel || "Register interest")}</Link>
              ) : card.quoteCode ? (
                <Link href={`/move/quote?service=${card.quoteCode}`} className="inline-flex rounded-xl bg-[#075E45] px-3 py-2 text-xs font-black text-white">{t(card.actionLabel || "Request quote")}</Link>
              ) : card.regulatoryHold ? (
                <span className="inline-flex cursor-not-allowed rounded-xl bg-slate-200 px-3 py-2 text-xs font-black text-slate-600">{t(card.actionLabel || "View status")}</span>
              ) : (
                <Link href={`/move/request?service=${encodeURIComponent(card.title)}`} className="inline-flex rounded-xl bg-[#075E45] px-3 py-2 text-xs font-black text-white">{t(card.actionLabel || "Request with Zeshu")}</Link>
              )}
              <Link href={`/help?service=${encodeURIComponent(card.title)}`} className="inline-flex rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-[#075E45]">{t("Ask Zeshu Assistant")}</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function MoveTravelPage() {
  const { t } = useCustomerLanguage();

  return (
    <main data-zeshu-experience="glossy" className="zeshu-experience min-h-screen bg-[#f6faf7] px-4 py-6 text-slate-900 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-[#075E45]">
            <ArrowLeft size={17} aria-hidden="true" /> {t("Back to Zeshu")}
          </Link>
          <LanguageSwitcher compact />
        </div>

        <header className="zeshu-gloss-hero mt-6 overflow-hidden rounded-[30px] bg-[linear-gradient(125deg,#222734,#394455)] p-6 text-white shadow-xl md:p-9">
<GlossyArtwork kind="move"/>
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-[#c9f2d8]">
                <Sparkles size={14} aria-hidden="true" /> {t("Rides, courier & travel requests")}
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">{t("Zeshu Move & Travel")}</h1>
              <p className="mt-3 text-base font-bold text-[#d9f3e3] md:text-lg">{t("Rides, courier and travel — one trusted place.")}</p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#bfe2cd]">{t("Auto, cab, courier, rentals and travel can be explored here. Final booking, fare and payment are confirmed only through an eligible verified provider. Bike Ride founding rider interest is open; passenger bookings remain disabled pending Transport Department approval and verified safety compliance.")}</p>
            </div>
          </div>
        </header>

        <MoveQuickQuote />

        <section id="move-district" className="scroll-mt-36="mt-7 rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm md:p-8" aria-label="District scheduled transport quotation requests">
          <p className="text-xs font-black uppercase tracking-widest text-[#075E45]">Five-town pilot · enquiries only</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">Scheduled cabs, trucks &amp; marriage buses</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">From Jagtial, Dharmaram, Korutla, Metpally or Dharmapuri, request a manual operator quote for a planned journey or goods delivery. No instant booking, guaranteed driver, fare or payment is available until an eligible operator confirms the request. Requests are free.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {code:'OUTSTATION_CAB',name:'Outstation Cab',detail:'Whole commercial cab, not per-seat pooling',icon:Car},
              {code:'RETURN_CAB',name:'Possible Return Cab',detail:'Request an available whole-car return journey',icon:Car},
              {code:'MINI_TRUCK',name:'Mini Truck / Pickup',detail:'Scheduled local and district goods transport',icon:Truck},
              {code:'LARGE_TRUCK',name:'Large Goods Truck',detail:'Operator-confirmed load and route quotation',icon:Truck},
              {code:'CHARTER_BUS',name:'Marriage / Group Bus',detail:'Whole-bus hire for wedding or family trips',icon:Bus},
            ].map(item => <Link key={item.code} href={`/move/quote?service=${item.code}`} className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-[#f7fbf8] p-3 transition hover:border-[#087443]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-[#075E45]"><item.icon size={21}/></span>
              <span><span className="block text-sm font-black text-slate-900">{item.name}</span><span className="mt-1 block text-xs leading-4 text-slate-600">{item.detail}</span><span className="mt-2 block text-xs font-black text-[#075E45]">Request quote →</span></span>
            </Link>)}
          </div>
          <p className="mt-4 text-xs leading-5 text-amber-800">Operator availability is reviewed manually. Do not pay an advance to an unverified third party. Instant auto, cab and delivery matching remain locked until provider, transport, insurance, safety and worker-registration checks pass.</p>
        </section>

        <section aria-label="Join the district transport provider network" className="mt-5 rounded-3xl border border-blue-100 bg-white p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="max-w-3xl">
              <h2 className="text-lg font-black text-slate-950">Own a verified cab, goods vehicle or marriage bus?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Zeshu is recruiting operators in Jagtial, Dharmaram, Korutla, Metpally and Dharmapuri. Register interest at no charge. We verify the applicable licences, RC, insurance, permits and operating availability before we refer customer enquiries. No guaranteed bookings or operator subscription charges.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/earn?role=PASSENGER_FLEET_OPERATOR#join" className="rounded-xl bg-[#075E45] px-4 py-3 text-xs font-black text-white">Cab / bus owner</Link>
              <Link href="/earn?role=LOGISTICS_FLEET_OPERATOR#join" className="rounded-xl border border-[#075E45] bg-white px-4 py-3 text-xs font-black text-[#075E45]">Truck fleet owner</Link>
              <Link href="/earn/onboard" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-800">Verify driver documents</Link>
            </div>
          </div>
        </section>

        <ServiceSection title="Local rides" cards={localRides} />
        <ServiceSection title="Send & Cargo" cards={courier} />
        <ServiceSection title="Share" cards={sharing} />
        <ServiceSection title="Travel" cards={travel} />

        <section className="mt-8 rounded-3xl border border-emerald-100 bg-emerald-50 p-5 md:p-7">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-[#075E45]"><ShieldCheck size={24} /></span>
            <div>
              <h2 className="text-lg font-black text-slate-950">{t("Safety before speed")}</h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{t("Choose a service to check what is available in your area. Zeshu confirms a booking, fare or payment only after an eligible verified provider confirms serviceability. Bike Ride is coming soon.")}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-blue-100 bg-white p-5 md:p-7">
          <h2 className="text-lg font-black text-slate-950">{t("Want to provide rides, logistics or travel?")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t("Zeshu is reviewing licensed operators, logistics companies and authorized travel partners.")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/help?service=Move%20%26%20Travel" className="inline-flex rounded-xl bg-[#075E45] px-4 py-3 text-sm font-black text-white">{t("Customer Help")}</Link>
            <Link href="/partners" className="inline-flex rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white">{t("Partner with Zeshu")}</Link>
            <Link href="/drive" className="inline-flex rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950">{t("Join the Jagtial driver pilot")}</Link>\n            <Link href="/earn" className="inline-flex rounded-xl border border-[#075E45] bg-white px-4 py-3 text-sm font-black text-[#075E45]">{t("Drive & Deliver")}</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
