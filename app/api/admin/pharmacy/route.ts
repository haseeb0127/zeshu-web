import { NextResponse } from 'next/server';
import { cleanText, requireMarketingAdmin } from '@/app/lib/marketing-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const noStore = { 'Cache-Control': 'private, no-store, max-age=0' };
const result = (body: object, status=200) => NextResponse.json(body, {status,headers:noStore});
const checks = [
  'licence_checked','pharmacist_checked','premises_checked','district_checked',
  'records_privacy_checked','restricted_categories_checked','cold_chain_excluded',
  'pharmacy_invoice_checked','agreement_checked',
] as const;
const uuid = (value:unknown):value is string =>
  typeof value==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

/** Only Zeshu administrators can view pharmacy prospects and their private compliance review. */
export async function GET(request:Request){
  const {context,response}=await requireMarketingAdmin(request);
  if(response||!context)return response!;
  const {data:leads,error}=await context.service.from('partner_leads')
    .select('id,business_name,contact_person,contact_phone,contact_email,city,licence_or_gst,proposal,status,consented_at,created_at')
    .eq('partner_type','LICENSED_PHARMACY').order('created_at',{ascending:false}).limit(100);
  if(error)return result({error:'Pharmacy applications are temporarily unavailable.'},503);
  const ids=(leads||[]).map(lead=>lead.id);
  if(!ids.length)return result({leads:[],reviews:[],medicineOrdersEnabled:false,subscriptionsEnabled:false});
  const {data:reviews,error:reviewError}=await context.service.from('pharmacy_partner_reviews')
    .select('lead_id,licence_checked,pharmacist_checked,premises_checked,district_checked,records_privacy_checked,restricted_categories_checked,cold_chain_excluded,pharmacy_invoice_checked,agreement_checked,notes,reviewed_at')
    .in('lead_id',ids).limit(100);
  if(reviewError)return result({error:'Pharmacy review records are temporarily unavailable.'},503);
  return result({leads,reviews:reviews||[],medicineOrdersEnabled:false,subscriptionsEnabled:false,
    note:'Checklist completion is NOT regulatory approval and cannot enable drug ordering.'});
}

/** Internal verification record. No API action activates medicine sales or collects money. */
export async function PATCH(request:Request){
  const {context,response}=await requireMarketingAdmin(request);
  if(response||!context)return response!;
  if(Number(request.headers.get('content-length')||0)>6000)return result({error:'Review too large.'},413);
  let body:Record<string,unknown>;
  try {
    const parsed:unknown=await request.json();
    if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error();
    body=parsed as Record<string,unknown>;
  }catch{return result({error:'Invalid review.'},400);}
  const leadId=body.leadId;
  if(!uuid(leadId))return result({error:'Valid pharmacy lead required.'},400);
  const {data:lead,error:lookupError}=await context.service.from('partner_leads')
    .select('id').eq('id',leadId).eq('partner_type','LICENSED_PHARMACY').maybeSingle();
  if(lookupError)return result({error:'Unable to verify applicant.'},503);
  if(!lead)return result({error:'Pharmacy application not found.'},404);
  if(body.action==='status'){
    const status=cleanText(body.status,30).toUpperCase();
    if(!['NEW','CONTACTED','QUALIFIED','REJECTED'].includes(status))
      return result({error:'Invalid stage. This workflow cannot activate a pharmacy.'},400);
    const {error}=await context.service.from('partner_leads').update({status,updated_at:new Date().toISOString()})
      .eq('id',leadId).eq('partner_type','LICENSED_PHARMACY');
    return error?result({error:'Could not save application stage.'},503):
      result({ok:true,note:'Application stage saved. Medicine fulfilment remains disabled.'});
  }
  if(body.action!=='review')return result({error:'Unknown pharmacy action.'},400);
  const review=body.review;
  if(!review||typeof review!=='object'||Array.isArray(review))return result({error:'Invalid checklist.'},400);
  const values=review as Record<string,unknown>;
  const patch:Record<string,unknown>={lead_id:leadId,reviewed_by:context.userId,reviewed_at:new Date().toISOString()};
  for(const key of checks){
    if(typeof values[key]!=='boolean')return result({error:'Every compliance check must be explicitly marked.'},400);
    patch[key]=values[key];
  }
  if(typeof values.notes!=='string'||values.notes.length>1000)return result({error:'Review notes must be under 1000 characters.'},400);
  patch.notes=cleanText(values.notes,1000);
  const {error}=await context.service.from('pharmacy_partner_reviews').upsert(patch,{onConflict:'lead_id'});
  return error?result({error:'Unable to store private pharmacy review.'},503):
    result({ok:true,note:'Private verification checklist saved. No pharmacy listing, order or payment has been activated.'});
}
