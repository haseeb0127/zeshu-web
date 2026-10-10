// Read-only Meta WABA-to-app subscription check. No writes and no message sends.
// A matching app here does NOT prove that the app-level "messages" field is active.
const META_ID = /^[0-9]{5,32}$/;
const VERSION = /^v[0-9]+\.[0-9]+$/;
const TOKEN = /^[a-zA-Z0-9._~-]+$/;
type MetaData={data?:unknown;paging?:unknown;error?:unknown};
type CheckResult={
  status:'SUBSCRIBED'|'NOT_SUBSCRIBED'|'MISSING_SETTINGS'|'INVALID_CONFIG'|'TOKEN_UNAUTHORIZED'|'META_UNAVAILABLE';
  subscribed:boolean|null;reason?:'NETWORK_OR_TIMEOUT'|'HTTP_ERROR'|'INVALID_RESPONSE'|'PAGINATION_LIMIT'|'REDIRECT';
  httpStatus?:number;graphCode?:number;
};
const object=(value:unknown):Record<string,unknown>|null=>
  value!==null&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;

export async function checkWabaSubscription(args:{
  token:string;wabaId:string;appId:string;graphVersion:string;request?:typeof fetch;
}):Promise<CheckResult>{
  const {token,wabaId,appId,graphVersion}=args;
  const failed=(status:CheckResult['status'],detail:Partial<CheckResult>={}):CheckResult=>
    ({status,subscribed:null,...detail});
  if(!token||!wabaId||!appId||!graphVersion)return failed('MISSING_SETTINGS');
  if(!META_ID.test(wabaId)||!META_ID.test(appId)||!VERSION.test(graphVersion)
    ||token.length<20||token.length>10000||!TOKEN.test(token))return failed('INVALID_CONFIG');
  const request=args.request??fetch;
  let cursor:string|null=null;
  for(let page=0;page<5;page++){
    const url=new URL('https://graph.facebook.com/'+graphVersion+'/'+wabaId+'/subscribed_apps');
    url.searchParams.set('limit','100');
    if(cursor)url.searchParams.set('after',cursor);
    let response:Response;
    try{
      response=await request(url.toString(),{
        method:'GET',headers:{Authorization:'Bearer '+token},redirect:'manual',
        cache:'no-store',signal:AbortSignal.timeout(10000),
      });
    }catch{return failed('META_UNAVAILABLE',{reason:'NETWORK_OR_TIMEOUT'});}
    if(response.status>=300&&response.status<400)
      return failed('META_UNAVAILABLE',{reason:'REDIRECT',httpStatus:response.status});
    if(!response.ok){
      let graphCode:number|undefined;
      try{
        const result=object(await response.json());
        const error=object(result?.error);
        if(typeof error?.code==='number'&&Number.isInteger(error.code)
          &&error.code>=0&&error.code<=100000)graphCode=error.code;
      }catch{/* Never return raw Meta API errors. */}
      const detail={reason:'HTTP_ERROR' as const,httpStatus:response.status,
        ...(graphCode===undefined?{}:{graphCode})};
      if(response.status===401||response.status===403||graphCode===190
        ||graphCode===10||graphCode===200)return failed('TOKEN_UNAUTHORIZED',detail);
      return failed('META_UNAVAILABLE',detail);
    }
    let data:MetaData|null=null;
    try{data=object(await response.json());}catch{return failed('META_UNAVAILABLE',{reason:'INVALID_RESPONSE'});}
    if(!Array.isArray(data?.data))return failed('META_UNAVAILABLE',{reason:'INVALID_RESPONSE'});
    // Official Meta responses wrap the app ID under whatsapp_business_api_data.
    // Never equate app names (both Zeshu WABAs have similar names).
    if(data.data.some(row=>{
      const item=object(row);
      const app=object(item?.whatsapp_business_api_data);
      return app?.id===appId;
    }))return {status:'SUBSCRIBED',subscribed:true};
    const paging=object(data.paging);
    if(!paging?.next)return {status:'NOT_SUBSCRIBED',subscribed:false};
    const cursors=object(paging.cursors);
    const after=cursors?.after;
    if(typeof after!=='string'||!after||after===cursor)return failed('META_UNAVAILABLE',{reason:'PAGINATION_LIMIT'});
    cursor=after;
  }
  return failed('META_UNAVAILABLE',{reason:'PAGINATION_LIMIT'});
}
