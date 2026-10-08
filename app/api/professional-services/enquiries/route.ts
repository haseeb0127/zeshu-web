import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';
const allowed = new Set(['WEDDING','INTERIORS']);
export async function POST(request: Request) {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return NextResponse.json({error:'Service temporarily unavailable.'},{status:503});
  let input: Record<string,unknown>;
  try { input=await request.json(); } catch {return NextResponse.json({error:'Invalid request.'},{status:400});}
  const field=(key:string,max:number)=>typeof input[key]==='string'?(input[key] as string).trim().slice(0,max):'';
  const service_type=field('service_type',20),customer_name=field('customer_name',100),contact_phone=field('contact_phone',20),city=field('city',100),budget_range=field('budget_range',80),project_details=field('project_details',2000),requested_date=field('requested_date',10);
  if(!allowed.has(service_type)||customer_name.length<2||!/^\\+?[0-9 ]{10,16}$/.test(contact_phone)||city.length<2||!budget_range||project_details.length<10||input.consent!==true||field('website',100))return NextResponse.json({error:'Please check your details and consent.'},{status:400});
  if(requested_date&&!/^\\d{4}-\\d{2}-\\d{2}$/.test(requested_date))return NextResponse.json({error:'Invalid date.'},{status:400});
  const db=createClient(url,key,{auth:{persistSession:false}});
  const {error}=await db.from('professional_service_enquiries').insert({service_type,customer_name,contact_phone,city,budget_range,project_details,requested_date:requested_date||null});
  if(error)return NextResponse.json({error:'Unable to save enquiry. Please try again.'},{status:503});
  return NextResponse.json({ok:true},{status:201});
}
