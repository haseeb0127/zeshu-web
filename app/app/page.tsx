"use client";

import Image from 'next/image';
import Link from 'next/link';
import PwaInstallButton from '../components/PwaInstallButton';
import ShareZeshuButton from '../components/ShareZeshuButton';
import { useCustomerLanguage } from '../components/CustomerLanguageProvider';

export default function GetZeshuPage() {
  const { t } = useCustomerLanguage();
  return (
    <main className="min-h-screen bg-[#f7f9f5] px-4 py-8 text-slate-900 md:px-8 md:py-14">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-black text-[#075E45]">← {t('Back to Zeshu')}</Link>

        <section className="mt-6 overflow-hidden rounded-[32px] bg-[#083b27] p-6 text-white md:p-10">
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#a6dfba]">{t('Get Zeshu')}</p>
          <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">{t('Put Zeshu on your home screen.')}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#d9f3e3]">{t('Install the Zeshu web app today for faster access. Jagtial physical delivery and India-wide digital services stay available from the same account.')}</p>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-[1fr_320px]">
          <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-2xl font-black">{t('Install on this device')}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t('On supported Android browsers, tap Install Zeshu. If your browser does not show an install prompt, use Add to Home screen from the browser menu.')}</p>
            <div className="mt-5 grid max-w-sm gap-3"><PwaInstallButton /><ShareZeshuButton /></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-emerald-700">Jagtial</p><p className="mt-1 font-black">{t('Fast physical delivery')}</p><p className="mt-1 text-xs leading-5 text-slate-600">{t('Groceries, fresh essentials and other eligible local products stay limited to the Jagtial delivery zone.')}</p></div>
              <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-[#075E45]">{t('All India')}</p><p className="mt-1 font-black">{t('Digital services')}</p><p className="mt-1 text-xs leading-5 text-slate-600">{t('Recharge, bills, QR tools, rewards and sponsored digital offers can serve users nationwide as each provider is enabled.')}</p></div>
            </div>
          </div>

          <aside className="rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-xs font-black uppercase tracking-[.16em] text-slate-500">{t('Open on another phone')}</p>
            <div className="mx-auto mt-4 w-fit rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <Image src="/zeshu-app-qr.svg" alt="QR code for zeshu.in/app" width={240} height={240} priority />
            </div>
            <p className="mt-4 text-sm font-black">{t('Scan to open zeshu.in/app')}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{t('When the native Android app is released, this same page can hand users to Google Play without changing printed QR codes.')}</p>
          </aside>
        </section>
      </div>
    </main>
  );
}
