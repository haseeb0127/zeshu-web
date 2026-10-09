import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { requireMarketingAdmin } from '@/app/lib/marketing-server';
import { getRuntimeEnvValue } from '@/app/lib/runtime-env';

export const dynamic='force-dynamic';

// Read-only and admin-only: no charge, capture, refund or payment changes.
export async function GET(request:Request) {
  const {context,response}=await requireMarketingAdmin(request);
  if(response||!context)return response!;
  const [keyId,keySecret]=await Promise.all([getRuntimeEnvValue('RAZORPAY_KEY_ID'),getRuntimeEnvValue('RAZORPAY_KEY_SECRET')]);
  if(!keyId.startsWith('rzp_test_')||!keySecret)return NextResponse.json({error:'Razorpay TEST credentials unavailable.'},{status:503});
  const {data,error}=await context.service.from('inventory_reservations')
    .select('created_at,status,razorpay_order_id').not('razorpay_order_id','is',null)
    .order('created_at',{ascending:false}).limit(6);
  if(error)return NextResponse.json({error:'Payment reservations unavailable.'},{status:503});
  const razorpay=new Razorpay({key_id:keyId,key_secret:keySecret});
  const safe=(v:unknown)=>typeof v==='string'?v.slice(0,90):null;
  const checks=await Promise.all((data||[]).map(async(row:any)=>{
    const base={created_at:row.created_at,reservation_status:row.status};
    try{
      const [order,payments]=await Promise.all([
        razorpay.orders.fetch(String(row.razorpay_order_id)),
        razorpay.orders.fetchPayments(String(row.razorpay_order_id))
      ]);
      return {...base,gateway_order_status:safe((order as any).status),
        payment_attempts:Array.isArray((payments as any)?.items)?(payments as any).items.slice(0,6).map((p:any)=>({
          status:safe(p.status),method:safe(p.method),error_code:safe(p.error_code),
          error_reason:safe(p.error_reason),error_source:safe(p.error_source),error_step:safe(p.error_step)
        })):[]};
    }catch{return {...base,error:'Provider status unavailable.'};}
  }));
  return NextResponse.json({mode:'test',checks},{headers:{'Cache-Control':'no-store'}});
}
