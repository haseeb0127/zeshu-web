'use client';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {adminSupabase} from '@/app/lib/browser-supabase';
import {ClipboardCheck,RefreshCw,ShieldCheck} from 'lucide-react';

const CHECKS = [
  ['licence_checked','Retail drug licence independently verified'],
  ['pharmacist_checked','Registered pharmacist verified and available'],
  ['premises_checked','Shop premises and authorised address reviewed'],
  ['district_checked','Jagtial district doorstep-delivery scope checked'],
  ['records_privacy_checked','Prescription handling, record retention and privacy reviewed'],
  ['restricted_categories_checked','H1/X/NDPS/controlled drug delivery exclusions agreed'],
  ['cold_chain_excluded','Temperature-sensitive / cold-chain drugs excluded from pilot'],
  ['pharmacy_invoice_checked','Pharmacy issues its own lawful cash memo / invoice'],
  ['agreement_checked','Partner agreement and fees reviewed (not billed)'],
] as const;
type CheckKey=(typeof CHECKS)[number][0];
type Review = Record<CheckKey,boolean> & {notes:string};
type Lead={id:string;business_name:string;contact_person:string;contact_phone:string|null;contact_email:string|null;
  city:string|null;licence_or_gst:string|null;proposal:string|null;status:string;created_at:string};
type StoredReview=Review & {lead_id:string};
const blank=():Review=>({
  licence_checked:false,pharmacist_checked:false,premises_checked:false,district_checked:false,
  records_privacy_checked:false,restricted_categories_checked:false,cold_chain_excluded:false,
  pharmacy_invoice_checked:false,agreement_checked:false,notes:'',
});
const stages=['NEW','CONTACTED','QUALIFIED','REJECTED'];
export default function PharmacyReviewPage(){
  const [leads,setLeads]=useState<Lead[]>([]);
  const [reviews,setReviews]=useState<Record<string,Review>>({});
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const access=async()=>{
    const {data}=await adminSupabase().auth.getSession();
    return data.session?.access_token||'';
  };
  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const token=await access();
      if(!token)throw Error('Sign in as Zeshu Admin first.');
      const response=await fetch('/api/admin/pharmacy',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
      const payload=await response.json().catch(()=>({}));
      if(!response.ok)throw Error(payload.error||'Unable to open pharmacy verification.');
      const rows:Lead[]=Array.isArray(payload.leads)?payload.leads:[];
      const notes:StoredReview[]=Array.isArray(payload.reviews)?payload.reviews:[];
      const next:Record<string,Review>={};
      for(const lead of rows){
        const saved=notes.find(item=>item.lead_id===lead.id);
        next[lead.id]=saved?{...blank(),...saved}:blank();
      }
      setLeads(rows);setReviews(next);
    }catch(e){setError(e instanceof Error?e.message:'Unable to load pharmacy applications.');}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void load();},[load]);
  const save=async(leadId:string,action:'status'|'review',payload:Record<string,unknown>)=>{
    setBusy(leadId);setError('');setNotice('');
    try{
      const token=await access();
      if(!token)throw Error('Admin session expired.');
      const response=await fetch('/api/admin/pharmacy',{method:'PATCH',
        headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},
        body:JSON.stringify({leadId,action,...payload})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw Error(data.error||'Could not save review.');
      setNotice(data.note||'Pharmacy review saved.');
      await load();
    }catch(e){setError(e instanceof Error?e.message:'Review could not be saved.');}
    finally{setBusy('');}
  };
  return <main className="min-h-screen bg-[#f5faf7] px-4 py-6 text-slate-900">
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/dashboard" className="text-sm font-black text-[#075e45]">← Back to Zeshu Admin</Link>
      <header className="mt-5 rounded-3xl bg-[#075e45] p-6 text-white">
        <h1 className="flex items-center gap-2 text-2xl font-black"><ClipboardCheck/> Pharmacy partner review</h1>
        <p className="mt-2 text-sm leading-6 text-emerald-100">Private licensed-pharmacy applications for the Jagtial pilot. A complete checklist never activates sales, medicine delivery, payments, or subscription billing.</p>
        <button className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-bold" onClick={()=>void load()} disabled={loading}><RefreshCw size={16}/> Refresh</button>
      </header>
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <ShieldCheck size={16} className="mr-2 inline"/> Do not request patient prescriptions, personal health information or OTPs through this application workflow. Validate original pharmacy documents privately before checking any box.
      </div>
      {notice&&<p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-900">{notice}</p>}
      {error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p>}
      {loading?<p className="mt-5 text-sm text-slate-500">Loading private applications…</p>:
      leads.length===0?<p className="mt-5 rounded-2xl border bg-white p-6 text-slate-600">No licensed-pharmacy applications yet. Share <Link href="/pharmacy" className="font-black text-[#075e45]">Zeshu Pharmacy</Link> with interested Jagtial medical shops.</p>:
      <section className="mt-5 grid gap-5">{leads.map(lead=>{
        const review=reviews[lead.id]||blank();
        const completed=CHECKS.filter(([key])=>review[key]).length;
        return <article key={lead.id} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-black">{lead.business_name}</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{lead.status}</span>
          </div>
          <p className="mt-2 text-sm text-slate-700">{lead.contact_person} · {lead.city||'City not given'}</p>
          <p className="mt-1 text-xs text-slate-600">{lead.contact_phone||''} {lead.contact_email||''}</p>
          <p className="mt-2 text-xs text-slate-600">Applicant-declared licence (not verified): {lead.licence_or_gst||'Not provided'}</p>
          {lead.proposal&&<p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{lead.proposal}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="text-sm font-bold">Application stage
              <select value={lead.status} disabled={busy===lead.id} onChange={e=>void save(lead.id,'status',{status:e.target.value})}
                className="ml-2 rounded-lg border bg-white px-2 py-2 text-sm">
                {stages.map(item=><option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>
          <h3 className="mt-5 text-sm font-black">Human verification: {completed}/{CHECKS.length}</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-2">{CHECKS.map(([key,label])=>
            <label key={key} className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200 p-3 text-sm leading-5">
              <input type="checkbox" checked={review[key]} disabled={busy===lead.id}
                onChange={e=>{const checked=e.target.checked;setReviews(old=>({...old,[lead.id]:{...(old[lead.id]||blank()),[key]:checked}}));}}
                className="mt-1 h-4 w-4 shrink-0 accent-emerald-700"/>
              <span>{label}</span>
            </label>)}</div>
          <label className="mt-4 block text-sm font-black">Private review notes (no patient data)
            <textarea rows={3} maxLength={1000} value={review.notes} onChange={e=>setReviews(old=>({...old,[lead.id]:{...(old[lead.id]||blank()),notes:e.target.value}}))}
              className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm font-medium" placeholder="Document checks, next steps and regulator/legal review; no sensitive patient information"/>
          </label>
          <button disabled={busy===lead.id} onClick={()=>void save(lead.id,'review',{review})}
            className="mt-3 rounded-xl bg-[#075e45] px-5 py-3 text-sm font-black text-white disabled:opacity-50">
            {busy===lead.id?'Saving…':'Save private review (no activation)'}
          </button>
        </article>;
      })}</section>}
    </div>
  </main>;
}
