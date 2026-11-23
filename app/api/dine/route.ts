import {dineService,response} from '@/app/lib/dine-server';
export const runtime='nodejs';
export const dynamic='force-dynamic';

/** Listings become public only after explicit partner onboarding, FSSAI review and activation. */
export async function GET(){
 const db=await dineService();
 if(!db)return response({error:'Dining service is temporarily unavailable.'},503);
 const {data:restaurants,error}=await db.from('dine_restaurants')
   .select('id,name,city,area,address,fssai_registration,opens_at,closes_at,min_notice_minutes,preorder_enabled')
   .eq('booking_enabled',true).eq('fssai_verified',true).order('name').limit(100);
 if(error)return response({error:'Restaurants are temporarily unavailable.'},503);
 const ids=(restaurants||[]).map(x=>x.id);
 if(!ids.length)return response({restaurants:[],menu:[],note:'Restaurant booking opens only after verified partners and actual tables are onboarded.'});
 const [menuResult,tablesResult]=await Promise.all([
   db.from('dine_menu_items').select('id,restaurant_id,name,category,price_paise,prep_minutes,available')
     .in('restaurant_id',ids).eq('available',true).limit(500),
   db.from('dine_tables').select('restaurant_id,seats').in('restaurant_id',ids).eq('enabled',true).limit(500),
 ]);
 if(menuResult.error||tablesResult.error)return response({error:'Restaurant availability could not be checked.'},503);
 const maxSeats=new Map<string,number>();
 for(const t of tablesResult.data||[])maxSeats.set(t.restaurant_id,Math.max(maxSeats.get(t.restaurant_id)||0,t.seats));
 return response({
   restaurants:(restaurants||[]).filter(r=>(maxSeats.get(r.id)||0)>0).map(r=>({...r,max_party_size:maxSeats.get(r.id)})),
   menu:menuResult.data||[],
   note:'Requests are not confirmed until restaurant staff accept the table and kitchen schedule. No online payment is collected.',
 });
}
