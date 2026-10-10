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

export type SafeMetaDiagnostic = {
  // Only public numeric API error codes / HTTP status; never Meta's raw error
  // body, token, URL with credentials, phone IDs, or provider trace IDs.
  reason?: 'NETWORK_OR_TIMEOUT' | 'GRAPH_RATE_LIMITED' | 'GRAPH_UPSTREAM_ERROR' |
    'GRAPH_ENDPOINT_NOT_FOUND' | 'GRAPH_BAD_REQUEST' | 'GRAPH_HTTP_ERROR' |
    'GRAPH_INVALID_RESPONSE' | 'GRAPH_PAGINATION_LIMIT' | 'GRAPH_REDIRECT';
  httpStatus?: number;
  graphCode?: number;
  networkFailureKind?: 'TIMEOUT' | 'FETCH_REJECTED';
  metaGraphReachable?: boolean | null;
  attempts?: number;
};
export type OwnedWabaCheck =
  | {status:'VERIFIED'; displayPhoneNumber:string|null; verifiedName:string|null;
     wabaId:string;phoneNumberId:string} & SafeMetaDiagnostic
  | {status:'MISSING_SETTINGS'|'TOKEN_UNAUTHORIZED'|'PHONE_NOT_IN_ACCOUNT'|'META_UNAVAILABLE'|
    'INVALID_CONFIG'; displayPhoneNumber:null; verifiedName:null;
    wabaId:string|null;phoneNumberId:string|null} & SafeMetaDiagnostic;

export async function verifyOwnedWhatsappAccount(args:{
  token:string;wabaId:string;phoneNumberId:string;graphVersion:string;request?:typeof fetch;
}):Promise<OwnedWabaCheck> {
  const {token,wabaId,phoneNumberId,graphVersion}=args;
  const failed=(status:Exclude<OwnedWabaCheck['status'],'VERIFIED'>, detail:SafeMetaDiagnostic={}):OwnedWabaCheck=>({
    status, ...detail,displayPhoneNumber:null,verifiedName:null,
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
    // GET-only verification can be safely retried once after an outbound
    // transport failure. Never retry auth/permissions/validation HTTP errors.
    let response:Response|null=null;
    let lastFailure:unknown;
    let attempts=0;
    for(const timeoutMs of [8_000,12_000]){
      attempts++;
      try{
        response=await request(url.toString(),{
          method:'GET',headers:{Authorization:'Bearer '+token},
          // Do not follow redirects with Bearer credentials: report an HTTP redirect instead.
          cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(timeoutMs),
        });
        break;
      }catch(error){
        lastFailure=error;
      }
    }
    if(!response){
      const kind=(lastFailure instanceof Error
        && (lastFailure.name==='TimeoutError'||lastFailure.name==='AbortError'))
        ? 'TIMEOUT' : 'FETCH_REJECTED';
      // Separate general Graph API reachability from a failure specifically
      // involving the authorized request. Probe has no token or identifiers.
      let metaGraphReachable:boolean|null=null;
      try{
        const probe=await request('https://graph.facebook.com/',{
          method:'GET',cache:'no-store',redirect:'manual',
          signal:AbortSignal.timeout(4000),
        });
        // Even 400/401/403 is a valid HTTP response proving transport works.
        metaGraphReachable=probe.status>=100&&probe.status<=599;
      }catch{metaGraphReachable=false;}
      return failed('META_UNAVAILABLE',{
        reason:'NETWORK_OR_TIMEOUT',networkFailureKind:kind,
        metaGraphReachable,attempts,
      });
    }
    if(response.status>=300&&response.status<400){
      return failed('META_UNAVAILABLE',{reason:'GRAPH_REDIRECT',httpStatus:response.status});
    }
    if(!response.ok) {
      let code:number|undefined;
      try {
        const body=object(await response.json());
        const error=object(body?.error);
        const parsed=error?.code;
        if(typeof parsed==='number' && Number.isInteger(parsed) && parsed>=0 && parsed<=100000)
          code=parsed;
      }catch{/* No raw Meta error bodies are returned or logged. */}
      const detail:SafeMetaDiagnostic={httpStatus:response.status,...(code!==undefined?{graphCode:code}:{})};
      if(response.status===401||response.status===403||code===190||code===10||code===200)
        return failed('TOKEN_UNAUTHORIZED',detail);
      if(response.status===429||code===4||code===17||code===613)
        return failed('META_UNAVAILABLE',{...detail,reason:'GRAPH_RATE_LIMITED'});
      if(response.status===400)return failed('META_UNAVAILABLE',{...detail,reason:'GRAPH_BAD_REQUEST'});
      if(response.status===404)return failed('META_UNAVAILABLE',{...detail,reason:'GRAPH_ENDPOINT_NOT_FOUND'});
      if(response.status>=500)return failed('META_UNAVAILABLE',{...detail,reason:'GRAPH_UPSTREAM_ERROR'});
      return failed('META_UNAVAILABLE',{...detail,reason:'GRAPH_HTTP_ERROR'});
    }
    let result:Record<string,unknown>|null;
    try{result=object(await response.json());}catch{return failed('META_UNAVAILABLE',{reason:'GRAPH_INVALID_RESPONSE'});}
    const rows=(result as MetaPhoneList|null)?.data;
    if(!Array.isArray(rows))return failed('META_UNAVAILABLE',{reason:'GRAPH_INVALID_RESPONSE'});
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
  return failed('META_UNAVAILABLE',{reason:'GRAPH_PAGINATION_LIMIT'});
}
