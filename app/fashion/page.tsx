import type { Metadata } from "next";
import Link from "next/link";
import FashionLiveCatalogue from "../components/FashionLiveCatalogue";
import { ArrowRight, BadgeCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Zeshu Fashion | Clothing, Footwear & Accessories",
  description:
    "Shop clothing, footwear and accessories on Zeshu Fashion when verified seller stock and delivery are available.",
};

const fashionGroups = [
  {
    title: "Women",
    icon: "👗",
    items: ["Sarees", "Kurtis & ethnic wear", "Women’s western wear", "Jeans & bottoms"],
  },
  {
    title: "Men",
    icon: "👕",
    items: ["Shirts", "T-shirts", "Jeans & trousers", "Ethnic wear"],
  },
  {
    title: "Kids",
    icon: "🧒",
    items: ["Girls’ clothing", "Boys’ clothing", "Baby clothing", "School & occasion wear"],
  },
  {
    title: "Footwear",
    icon: "👟",
    items: ["Women’s footwear", "Men’s footwear", "Kids’ footwear", "Sandals & casual shoes"],
  },
  {
    title: "Accessories",
    icon: "👜",
    items: ["Bags & wallets", "Fashion jewellery", "Watches", "Belts, caps & accessories"],
  },
] as const;

const sellerPrograms = [
  {
    title: "Sponsored Products",
    body: "Paid product visibility in relevant discovery surfaces, clearly labelled Sponsored to customers.",
  },
  {
    title: "Featured Store",
    body: "A dedicated seller or boutique spotlight when the catalogue, stock and service quality are verified.",
  },
  {
    title: "Featured Brand",
    body: "Brand-led discovery for eligible manufacturers and D2C labels with transparent commercial placement.",
  },
  {
    title: "Fashion Deals",
    body: "Genuine seller-funded offers only. Zeshu will not manufacture a fake MRP, discount or urgency claim.",
  },
  {
    title: "New Launch",
    body: "Launch collections for newly onboarded products once real inventory and fulfilment are active.",
  },
  {
    title: "Telangana Spotlight",
    body: "Extra discovery for eligible Telangana manufacturers, boutiques and brands without hiding nationwide alternatives.",
  },
  {
    title: "Free-Delivery Campaigns",
    body: "Seller- or brand-funded shipping campaigns only when the actual logistics economics support the promise.",
  },
] as const;

export default function FashionPage() {
  return (
    <main className="min-h-screen bg-[#f8fbf8] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <Link href="/" className="text-sm font-black text-[#075E45]">
          ← Back to Zeshu
        </Link>

        <header className="mt-6 overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#143d2c_0%,#075E45_55%,#2f765a_100%)] p-6 text-white md:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[.18em] text-emerald-100">
              Zeshu Fashion
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">
              Fashion you can browse with clear stock and seller information
            </h1>
            <p className="mt-4 text-sm font-semibold leading-6 text-emerald-50 md:text-base">
              Browse women’s, men’s and kids’ fashion, footwear and accessories. Products become orderable only when real seller stock and delivery are available.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-black">
              <span className="rounded-full bg-white/12 px-3 py-2 ring-1 ring-white/15">Real seller stock</span>
              <span className="rounded-full bg-white/12 px-3 py-2 ring-1 ring-white/15">Real availability</span>
              <span className="rounded-full bg-white/12 px-3 py-2 ring-1 ring-white/15">Clear sponsored labels</span>
            </div>
          </div>
        </header>

        <section className="mt-7" aria-labelledby="fashion-categories-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#075E45]">
                Shop by category
              </p>
              <h2 id="fashion-categories-title" className="mt-1 text-2xl font-black tracking-tight">
                Fashion list
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                Explore categories now. Available products are shown from live seller catalogues only.
              </p>
            </div>
            <Link
              href="/#products"
              className="inline-flex items-center gap-2 rounded-xl bg-[#075E45] px-4 py-3 text-sm font-black text-white"
            >
              Browse available products <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {fashionGroups.map((group) => (
              <article key={group.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-xl" aria-hidden="true">
                    {group.icon}
                  </span>
                  <h3 className="font-black">{group.title}</h3>
                </div>
                <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-600">
                  {group.items.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#075E45]" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <FashionLiveCatalogue />

        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-3xl">
              <h2 className="font-black text-slate-950">Sell fashion on Zeshu</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Manufacturers, boutiques, wholesalers and brands can keep their own inventory while Zeshu provides customer discovery and marketplace tools after verification.</p>
            </div>
            <Link href="/partners#fashion-sellers" className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-[#075E45]">Seller information <ArrowRight size={16}/></Link>
          </div>
        </section>

        <section className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-black text-amber-950">Customer promise</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900/80">
            A category being listed here does not mean every item is currently orderable. Zeshu will show actual product availability, seller information and delivery eligibility when those inputs are live.
          </p>
        </section>
      </div>
    </main>
  );
}
