import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {getRuntimeSupabaseEnv} from '@/app/lib/runtime-env';

export const dineNoStore={'Cache-Control':'private, no-store, max-age=0'};
export const safeString=(value:unknown,max:number)=>typeof value==='string'?value.trim().slice(0,max):'';
export const uuid=(value:unknown)=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export const phone=(value:unknown)=>typeof value==='string'&&/^\+?[0-9]{10,15}$/.test(value);
export const dateISO=(value:unknown)=>typeof value==='string'
  &&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  &&Number.isFinite(Date.parse(value));
export const response=(body:object,status=200)=>Response.json(body,{status,headers:dineNoStore});
export async function dineService(){
  const {url,serviceRoleKey}=await getRuntimeSupabaseEnv();
  return url&&serviceRoleKey?createClient(url,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}):null;
}
export async function dineUser(request:Request){
  const h=request.headers.get('authorization')||'';
  const token=h.startsWith('Bearer ')?h.slice(7).trim():'';
  if(!token)return null;
  const {url,anonKey}=await getRuntimeSupabaseEnv();
  if(!url||!anonKey)return null;
  const client=createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const {data:{user},error}=await client.auth.getUser(token);
  return error?null:user;
}
export async function dineAdmin(request:Request){
  const user=await dineUser(request);
  if(!user)return null;
  const db=await dineService();
  if(!db)return null;
  const {data,error}=await db.from('admin_roles').select('user_id').eq('user_id',user.id).eq('role','admin').maybeSingle();
  return !error&&data?db:null;
}
export function localTime(date:Date){
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
  return Number(parts.find(p=>p.type==='hour')?.value||0)*60+Number(parts.find(p=>p.type==='minute')?.value||0);
}
export function hhmm(value:string){
  const [hours,minutes]=value.slice(0,5).split(':').map(Number);
  return hours*60+minutes;
}
