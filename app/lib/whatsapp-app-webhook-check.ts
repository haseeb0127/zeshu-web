/** Read-only Meta app-level WhatsApp webhook field and callback diagnostic.
 *  Uses a server-only App Access Token: APP_ID|APP_SECRET. No write operations
 *  and no token/ID/raw Meta provider error bodies are returned.
 */
const ID=/^[0-9]{5,32}$/;
const VERSION=/^v[0-9]+\.[0-9]+$/;
const SECRET=/^[a-zA-Z0-9._~-]{16,512}$/;
const CALLBACK='https://zeshu.in/api/webhooks/meta-whatsapp';
const record=(x:unknown):Record<string,unknown>|null=>
 x!==null&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:null;
const safeCode=(x:unknown)=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=0&&x<=100000?x:undefined;
type Status='READY'|'MESSAGES_NOT_SUBSCRIBED'|'CALLBACK_MISMATCH'|'INACTIVE'|'SUBSCRIPTION_MISSING'|
 'FIELD_DATA_UNAVAILABLE'|'MISSING_SETTINGS'|'INVALID_CONFIG'|'META_UNAVAILABLE'|'TOKEN_UNAUTHORIZED';
export type AppWebhookCheck={status:Status;messagesFieldSubscribed:boolean|null;callbackMatches:boolean|null;
  reason?:'NETWORK_OR_TIMEOUT'|'HTTP_ERROR'|'INVALID_RESPONSE'|'REDIRECT';
  providerHttpStatus?:number;providerErrorCode?:number};
const failed=(status:Status,other:Partial<AppWebhookCheck>={}):AppWebhookCheck=>
 ({status,messagesFieldSubscribed:null,callbackMatches:null,...other});

export async function checkAppWebhookFieldStatus(args:{
  appId:string;appSecret:string;graphVersion:string;request?:typeof fetch;
}):Promise<AppWebhookCheck>{
 const {appId,appSecret,graphVersion}=args;
 if(!appId||!appSecret||!graphVersion)return failed('MISSING_SETTINGS');
 if(!ID.test(appId)||!SECRET.test(appSecret)||!VERSION.test(graphVersion))
  return failed('INVALID_CONFIG');
 const fetcher=args.request??fetch;
 let result:Response;
 try{
  result=await fetcher('https://graph.facebook.com/'+graphVersion+'/'+appId+'/subscriptions',{
   method:'GET',headers:{Authorization:'Bearer '+appId+'|'+appSecret},
   cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(10000),
  });
 }catch{return failed('META_UNAVAILABLE',{reason:'NETWORK_OR_TIMEOUT'});}
 if(result.status>=300&&result.status<400)return failed('META_UNAVAILABLE',{reason:'REDIRECT',providerHttpStatus:result.status});
 if(!result.ok){
  let code:number|undefined;
  try{code=safeCode(record(record(await result.json())?.error)?.code);}catch{}
  const details={reason:'HTTP_ERROR' as const,providerHttpStatus:result.status,
   ...(code===undefined?{}:{providerErrorCode:code})};
  return failed(result.status===401||result.status===403||code===190||code===10||code===200?'TOKEN_UNAUTHORIZED':'META_UNAVAILABLE',details);
 }
 let payload:Record<string,unknown>|null=null;
 try{payload=record(await result.json());}catch{return failed('META_UNAVAILABLE',{reason:'INVALID_RESPONSE'});}
 if(!Array.isArray(payload?.data))return failed('META_UNAVAILABLE',{reason:'INVALID_RESPONSE'});
 const items=payload.data.map(record).filter((x):x is Record<string,unknown>=>x!==null);
 const sub=items.find(s=>s.object==='whatsapp_business_account');
 if(!sub)return {status:'SUBSCRIPTION_MISSING',messagesFieldSubscribed:false,callbackMatches:false};
 const actual=sub.callback_url;
 const match=(typeof actual==='string'&&actual.length>0)
  ?actual.replace(/\/$/,'')===CALLBACK:null;
 const fields=sub.fields;
 if(!Array.isArray(fields))return failed('FIELD_DATA_UNAVAILABLE',{callbackMatches:match});
 const names=fields.map(x=>typeof x==='string'?x:record(x)?.name)
  .filter((x):x is string=>typeof x==='string');
 const messages=names.includes('messages');
 if(sub.active===false)return {status:'INACTIVE',messagesFieldSubscribed:messages,callbackMatches:match};
 if(!messages)return {status:'MESSAGES_NOT_SUBSCRIBED',messagesFieldSubscribed:false,callbackMatches:match};
 if(match!==true)return {status:'CALLBACK_MISMATCH',messagesFieldSubscribed:true,callbackMatches:match};
 return {status:'READY',messagesFieldSubscribed:true,callbackMatches:true};
}
