'use client';

import { useEffect, useState } from 'react';
import Link from '@/app/components/DocumentLink';
import {classifyClientFailure, groupClientRoute, reportClientFailure, shouldSelfHealChunk} from '@/app/lib/client-failure-recovery';
import { AlertTriangle, ArrowLeft, House, RefreshCw } from 'lucide-react';

export default function CustomerPageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [restoring,setRestoring]=useState(false);
  useEffect(() => {
    const path=window.location.pathname;
    console.warn('Zeshu page recovery',{kind:classifyClientFailure(error),group:groupClientRoute(path)});
    reportClientFailure(error,path,'page');
    if(shouldSelfHealChunk(error,path)){
      setRestoring(true);
      const timer=window.setTimeout(()=>window.location.reload(),90);
      const failsafe=window.setTimeout(()=>setRestoring(false),3000);
      return ()=>{window.clearTimeout(timer);window.clearTimeout(failsafe);};
    }
  },[error]);
  return <main data-zeshu-recovery="client-error" className="flex min-h-[75dvh] items-center justify-center bg-[radial-gradient(ellipse_at_top,#eaf8ee,#fff_65%)] px-4 py-12 text-[#163327]">
    <section className="w-full max-w-md rounded-[28px] border border-emerald-100 bg-white px-6 py-9 text-center shadow-[0_12px_35px_rgba(7,94,69,.11)]">
      <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-[#075e45]"><AlertTriangle size={30}/></div>
      <h1 className="text-2xl font-black">{restoring?'Restoring your Zeshu page…':"We couldn't open this section"}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{restoring?'Checking the latest app files without changing your cart or order.':"This section encountered a problem. Check your order or payment status before trying another transaction."}</p>
      {!restoring&&<>
      <div className="mt-6 grid gap-3">
        <button type="button" onClick={() => { reset(); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#075e45] px-5 font-bold text-white"><RefreshCw size={18}/> Try again</button>
        <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 font-bold text-[#075e45]"><House size={18}/> Continue shopping</Link>
      </div>
      <Link href="/help" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#075e45]"><ArrowLeft size={15}/> Help Center</Link>
      </>}
    </section>
  </main>;
}
