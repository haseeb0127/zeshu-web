/** Aggregate event-shape indicators from HMAC-verified Meta payloads only.
 * Never captures PII, raw messages, customer numbers, or provider IDs.
 */
const obj=(v:unknown):Record<string,unknown>|null=>
 v!==null&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:null;
export type Shape={messagesField:boolean;phoneMessages:boolean;candidateMessages:number};
export function summarizeVerifiedWhatsAppShape(payload:unknown,wabaId:string,phoneId:string):Shape{
 const shape:Shape={messagesField:false,phoneMessages:false,candidateMessages:0};
 if(!/^[0-9]{5,32}$/.test(wabaId)||!/^[0-9]{5,32}$/.test(phoneId))return shape;
 const root=obj(payload);
 if(root?.object!=='whatsapp_business_account'||!Array.isArray(root.entry))return shape;
 for(const event of root.entry){
  const entry=obj(event);
  if(entry?.id!==wabaId||!Array.isArray(entry.changes))continue;
  for(const update of entry.changes){
   const change=obj(update);
   if(change?.field!=='messages')continue;
   shape.messagesField=true;
   const value=obj(change.value);
   const metadata=obj(value?.metadata);
   if(metadata?.phone_number_id!==phoneId||!Array.isArray(value?.messages))continue;
   shape.phoneMessages=true;
   shape.candidateMessages=Math.min(50,shape.candidateMessages+value.messages.length);
  }
 }
 return shape;
}
