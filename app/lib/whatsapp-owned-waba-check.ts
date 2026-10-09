// Read-only checks for Zeshu's *own* WhatsApp Business Account.
// Embedded Signup belongs to Meta-authorized BSP / Tech Provider onboarding;
// a business integrating only its own WABA can use Cloud API directly.
const META_ID = /^[0-9]{5,32}$/;
const VERSION = /^v[0-9]+\.[0-9]+$/;
type MetaPhone = {
  id?:unknown; display_phone_number?:unknown; verified_name?:unknown;
};
type MetaPhoneList = { data?: unknown };
const object = (value: unknown): Record<string,unknown>|null =>
  value!==null && typeof value==='object' && !Array.isArray(value)
    ? value as Record<string,unknown> : null;
const string = (value:unknown):string => typeof value==='string'?value:'';

export type OwnedWabaCheck =
  | {status:'VERIFIED'; displayPhoneNumber:string|null; verifiedName:string|null;
     wabaId:string;phoneNumberId:string}
  | {status:'MISSING_SETTINGS'|'TOKEN_UNAUTHORIZED'|'PHONE_NOT_IN_ACCOUNT'|'META_UNAVAILABLE'|
    'INVALID_CONFIG'; displayPhoneNumber:null; verifiedName:null;
    wabaId:string|null;phoneNumberId:string|null};

export async function verifyOwnedWhatsappAccount(args:{
  token:string;wabaId:string;phoneNumberId:string;graphVersion:string;request?:typeof fetch;
}):Promise<OwnedWabaCheck> {
  const {token,wabaId,phoneNumberId,graphVersion}=args;
  const failed=(status:Exclude<OwnedWabaCheck['status'],'VERIFIED'>):OwnedWabaCheck=>({
    status,displayPhoneNumber:null,verifiedName:null,
    wabaId:META_ID.test(wabaId)?wabaId:null,
    phoneNumberId:META_ID.test(phoneNumberId)?phoneNumberId:null,
  });
  if(!token||!wabaId||!phoneNumberId||!graphVersion)return failed('MISSING_SETTINGS');
  if(token.length<20||token.length>10000||!META_ID.test(wabaId)||
    !META_ID.test(phoneNumberId)||!VERSION.test(graphVersion))return failed('INVALID_CONFIG');

  // Meta accepts either a System User token or short-lived test token.
  // Server-only Authorization header, HTTPS, no customer messages or writes.
  const request=args.request??fetch;
  let nextCursor:string|null=null;
  for(let page=0;page<5;page++){
    const url=new URL('https://graph.facebook.com/'+graphVersion+'/'+wabaId+'/phone_numbers');
    url.searchParams.set('fields','id,display_phone_number,verified_name');
    url.searchParams.set('limit','100');
    if(nextCursor)url.searchParams.set('after',nextCursor);
    let response:Response;
    try {
      response=await request(url.toString(),{
        method:'GET',headers:{Authorization:'Bearer '+token},
        cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000),
      });
    }catch{return failed('META_UNAVAILABLE');}
    if(response.status===400||response.status===401||response.status===403)
      return failed('TOKEN_UNAUTHORIZED');
    if(!response.ok)return failed('META_UNAVAILABLE');
    let result:Record<string,unknown>|null;
    try{result=object(await response.json());}catch{return failed('META_UNAVAILABLE');}
    const rows=(result as MetaPhoneList|null)?.data;
    if(!Array.isArray(rows))return failed('META_UNAVAILABLE');
    const match=rows.map(object).find(phone=>phone?.id===phoneNumberId) as MetaPhone|undefined;
    if(match)return {
      status:'VERIFIED',wabaId,phoneNumberId,
      displayPhoneNumber:string(match.display_phone_number).slice(0,40)||null,
      verifiedName:string(match.verified_name).slice(0,120)||null,
    };
    const paging=object(result?.paging);
    const cursors=object(paging?.cursors);
    const cursor=string(cursors?.after);
    if(!paging?.next||!cursor) return failed('PHONE_NOT_IN_ACCOUNT');
    nextCursor=cursor;
  }
  return failed('META_UNAVAILABLE');
}
