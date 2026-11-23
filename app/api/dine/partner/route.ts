import {dineService,phone,response,safeString} from '@/app/lib/dine-server';
export const runtime='nodejs';
export const dynamic='force-dynamic';

/** Restaurant owners opt in. Submitting does not publish or verify a restaurant. */
export async function POST(request:Request){
 if(Number(request.headers.get('content-length')||0)>8000)return response({error:'Request too large.'},413);
 let x:Record<string,unknown>;
 try{const v:unknown=await request.json();if(!v||typeof v!=='object'||Array.isArray(v))throw Error();x=v as Record<string,unknown>;}catch{return response({error:'Invalid enquiry.'},400);}
 const restaurant_name=safeString(x.restaurantName,120),city=safeString(x.city,80),
  contact_name=safeString(x.contactName,100),contact_phone=safeString(x.phone,20),
  fssai_registration=safeString(x.fssaiNumber,14),enquiry_notes=safeString(x.notes,500);
 if(safeString(x.website,100))return response({ok:true,note:'Thank you for your interest.'});
 if(restaurant_name.length<2||city.length<2||contact_name.length<2
  ||!phone(contact_phone)||!/^\d{14}$/.test(fssai_registration)||x.consent!==true)
  return response({error:'Enter business details, 14-digit FSSAI number and consent.'},400);
 const db=await dineService();
 if(!db)return response({error:'Partner registration is temporarily unavailable.'},503);
 const since=new Date(Date.now()-24*60*60*1000).toISOString();
 const {data:duplicate,error:readError}=await db.from('dine_partner_leads').select('id')
  .eq('contact_phone',contact_phone).gte('created_at',since).limit(1);
 if(readError)return response({error:'Partner registration is temporarily unavailable.'},503);
 if(duplicate?.length)return response({ok:true,note:'We already received an enquiry from this number recently.'},200);
 const {error}=await db.from('dine_partner_leads').insert({
  restaurant_name,city,contact_name,contact_phone,fssai_registration,enquiry_notes,
 });
 return error?response({error:'Unable to save enquiry. Please try again.'},503):
  response({ok:true,note:'Thank you! Zeshu will review the restaurant, registration, menu and seating before any bookings are enabled.'},201);
}
