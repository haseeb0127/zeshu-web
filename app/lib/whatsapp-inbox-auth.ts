import 'server-only';
import {createClient, type SupabaseClient} from '@supabase/supabase-js';
import {getRuntimeSupabaseEnv} from '@/app/lib/runtime-env';

export async function authorizeWhatsAppInboxAdmin(request:Request):Promise<{userId:string;service:SupabaseClient}|null>{
  const h=request.headers.get('authorization')||'';
  const token=h.startsWith('Bearer ')?h.slice(7).trim():'';
  if(!token)return null;
  const {url,anonKey,serviceRoleKey}=await getRuntimeSupabaseEnv();
  if(!url||!anonKey||!serviceRoleKey)return null;
  const client=createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const {data:{user},error}=await client.auth.getUser(token);
  if(error||!user)return null;
  const service=createClient(url,serviceRoleKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  const {data:role,error:roleError}=await service.from('admin_roles')
    .select('user_id').eq('user_id',user.id).eq('role','admin').maybeSingle();
  if(roleError||!role)return null;
  return {userId:user.id,service};
}
export const inboxNoStore={'Cache-Control':'private, no-store, max-age=0'};
