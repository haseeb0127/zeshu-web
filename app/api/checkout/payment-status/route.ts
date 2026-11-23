import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import { getRuntimeEnvValue, getRuntimeSupabaseEnv } from '../../../lib/runtime-env';
import { isProvablyUnpaidRazorpayOrder } from '../../../lib/razorpay-unpaid-order';

export const dynamic = 'force-dynamic';
const reply = (result: Record<string, unknown>, status=200) =>
  NextResponse.json(result,{status,headers:{'Cache-Control':'private, no-store, max-age=0'}});

// Read-only, private background reconciliation. Never creates/captures/refunds
// a charge or changes order state. Customer-facing UI shows no status workflow.
export async function GET(request:Request) {
  try {
    const auth=request.headers.get('authorization')||'';
    if(!auth.startsWith('Bearer '))return reply({status:'AUTH_REQUIRED',safeToRetry:false},401);
    const env=await getRuntimeSupabaseEnv();
    const isStaging=(request.headers.get('host')||'').split(':')[0].toLowerCase()
      === 'zeshu-web-staging.asif-mohammed0127.workers.dev';
    if(!env.url||!env.anonKey||!env.serviceRoleKey||
      (isStaging&&!env.url.includes('xdzgdhupfgsdyzellpqq')))
      return reply({status:'CANNOT_CONFIRM',safeToRetry:false},503);
    const authClient=createClient(env.url,env.anonKey);
    const {data:{user},error:authError}=await authClient.auth.getUser(auth.slice(7).trim());
    if(authError||!user)return reply({status:'AUTH_REQUIRED',safeToRetry:false},401);
    const service=createClient(env.url,env.serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false}});
    // All unresolved gateway-bound reservations must be checked: a newer
    // harmless attempt does not make an earlier captured payment safe.
    const {data,error}=await service.from('inventory_reservations')
      .select('razorpay_order_id,expected_total_paid')
      .eq('user_id',user.id).in('status',['PAYMENT_PENDING','EXPIRED'])
      .not('razorpay_order_id','is',null).is('abandoned_at',null)
      .order('created_at',{ascending:false}).limit(21);
    if(error||!Array.isArray(data)||data.length>20)
      return reply({status:'CANNOT_CONFIRM',safeToRetry:false},503);
    if(!data.length)return reply({status:'NO_OPEN_PAYMENT',safeToRetry:true});
    const [keyId,keySecret]=await Promise.all([
      getRuntimeEnvValue('RAZORPAY_KEY_ID'),getRuntimeEnvValue('RAZORPAY_KEY_SECRET'),
    ]);
    if(!keyId.startsWith('rzp_test_')||!keySecret)
      return reply({status:'CANNOT_CONFIRM',safeToRetry:false},503);
    const gateway=new Razorpay({key_id:keyId,key_secret:keySecret});
    for(const reservation of data) {
      let provablyUnpaid=false;
      for(let attempt=0;attempt<2;attempt++) {
        try{
          const [order,payments]=await Promise.all([
            gateway.orders.fetch(String(reservation.razorpay_order_id)),
            gateway.orders.fetchPayments(String(reservation.razorpay_order_id)),
          ]);
          const items=Array.isArray((payments as any)?.items)?(payments as any).items:null;
          const amountPaise=Math.round(Number(reservation.expected_total_paid)*100);
          // A valid response with a non-unpaid state is definitive: never retry.
          if(!isProvablyUnpaidRazorpayOrder(order,items,amountPaise,String(reservation.razorpay_order_id)))
            return reply({status:'CANNOT_CONFIRM',safeToRetry:false});
          provablyUnpaid=true;
          break;
        }catch{
          if(attempt===0)await new Promise(resolve=>setTimeout(resolve,250));
        }
      }
      if(!provablyUnpaid)return reply({status:'CANNOT_CONFIRM',safeToRetry:false},503);
    }
    return reply({status:'PROVABLY_UNPAID',safeToRetry:true});
  }catch{
    return reply({status:'CANNOT_CONFIRM',safeToRetry:false},503);
  }
}
