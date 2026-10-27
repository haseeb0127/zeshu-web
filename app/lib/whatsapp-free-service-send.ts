// One human-approved customer-service text reply. No templates, buttons, bulk,
// scheduled jobs, proactive notifications or AI. Safe for Cloudflare Workers.
export type ReplyResult =
  |{status:'ACCEPTED';providerMessageId:string}
  |{status:'REJECTED';providerHttpStatus?:number;providerCode?:number}
  |{status:'UNKNOWN'};
const phone=/^91[6-9][0-9]{9}$/;
const id=/^[0-9]{5,32}$/;
const api=/^v[0-9]+\.[0-9]+$/;
const rec=(value:unknown):Record<string,unknown>|null=>
 value!==null&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;
export async function sendOneWhatsAppServiceReply(args:{
 token:string;phoneNumberId:string;graphVersion:string;recipient:string;body:string;request?:typeof fetch;
}):Promise<ReplyResult>{
 const {token,phoneNumberId,graphVersion,recipient,body}=args;
 if(!token||token.length<20||token.length>10000||/[\r\n]/.test(token)
   ||!id.test(phoneNumberId)||!api.test(graphVersion)
   ||!phone.test(recipient)||!body.trim()||body.trim().length>4000)
   return {status:'REJECTED'};
 const fetcher=args.request??fetch;
 let response:Response;
 try{
   response=await fetcher('https://graph.facebook.com/'+graphVersion+'/'+phoneNumberId+'/messages',{
     method:'POST',
     headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
     body:JSON.stringify({
       messaging_product:'whatsapp',recipient_type:'individual',to:recipient,
       type:'text',text:{preview_url:false,body:body.trim()},
     }),
     cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(10000),
   });
 }catch{
   // Meta may have accepted a request even when its response was lost.
   // Never retry or free the quota reservation automatically.
   return {status:'UNKNOWN'};
 }
 if(!response.ok){
   let code:number|undefined;
   try{
     const error=rec(rec(await response.json())?.error);
     const n=error?.code;
     if(typeof n==='number'&&Number.isInteger(n)&&n>=0&&n<=100000)code=n;
   }catch{}
   return {status:'REJECTED',providerHttpStatus:response.status,
     ...(code===undefined?{}:{providerCode:code})};
 }
 try{
   const data=rec(await response.json());
   const first=Array.isArray(data?.messages)?rec(data.messages[0]):null;
   const providerId=first?.id;
   // A 2xx with malformed or missing message ID is *not* proof of acceptance.
   if(typeof providerId==='string'&&providerId.startsWith('wamid.')&&providerId.length<=512)
     return {status:'ACCEPTED',providerMessageId:providerId};
 }catch{}
 return {status:'UNKNOWN'};
}
