/**
 * Zeshu Pay recharge order state-model (design + pure mocked tests only).
 * NOT wired into production checkout or provider execution.
 *
 * Only trusted SERVER code may construct VERIFIED_* events after independently
 * checking gateway signatures and provider success evidence. A client-supplied
 * boolean is never sufficient to verify a payment or fulfilment receipt.
 */
export type PayRechargeState=
 'CREATED'|'PAYMENT_PENDING'|'PAYMENT_VERIFIED'|'PROVIDER_PENDING'|'PROVIDER_UNKNOWN'|
 'COMPLETED'|'FAILED'|'REFUND_PENDING'|'REFUNDED'|'REVIEW_REQUIRED';
export type RechargeModel={
 state:PayRechargeState;
 gatewayOrderId:string;
 gatewayPaymentId:string|null;
 providerRequestId:string|null;
 providerReceiptId:string|null;
 refundReference:string|null;
};
export type TrustedRechargeEvent=
 | {type:'PAYMENT_STARTED'}
 | {type:'GATEWAY_PAYMENT_VERIFIED';orderId:string;paymentId:string}
 | {type:'GATEWAY_PAYMENT_FAILED'}
 | {type:'PROVIDER_SUBMITTED';requestId:string}
 | {type:'PROVIDER_TIMEOUT'}
 | {type:'PROVIDER_RESULT_VERIFIED';requestId:string;result:'SUCCESS'|'PENDING'|'FAILED';receiptId?:string}
 | {type:'REFUND_RESULT_VERIFIED';refundId:string}
 | {type:'NEEDS_MANUAL_REVIEW'};

const ref=(value:string)=>/^[A-Za-z0-9_-]{8,100}$/.test(value);
const reject=():never=>{throw new Error('RECHARGE_TRANSITION_DENIED')};
export function initializeRechargeModel(gatewayOrderId:string):RechargeModel{
 if(!ref(gatewayOrderId))return reject();
 return {
  state:'CREATED',gatewayOrderId,
  gatewayPaymentId:null,providerRequestId:null,providerReceiptId:null,refundReference:null,
 };
}
export function nextRechargeState(tx:RechargeModel,event:TrustedRechargeEvent):RechargeModel{
 // Terminal states cannot accidentally become pending or issue another fulfilment request.
 if(tx.state==='COMPLETED'||tx.state==='REFUNDED')return reject();
 switch(event.type){
  case 'PAYMENT_STARTED':
   return tx.state==='CREATED'?{...tx,state:'PAYMENT_PENDING'}:reject();
  case 'GATEWAY_PAYMENT_VERIFIED':
   if(!['CREATED','PAYMENT_PENDING'].includes(tx.state)
    ||event.orderId!==tx.gatewayOrderId||!ref(event.paymentId))return reject();
   return {...tx,state:'PAYMENT_VERIFIED',gatewayPaymentId:event.paymentId};
  case 'GATEWAY_PAYMENT_FAILED':
   // This transition is legal only before payment was successfully verified.
   return ['CREATED','PAYMENT_PENDING'].includes(tx.state)?{...tx,state:'FAILED'}:reject();
  case 'PROVIDER_SUBMITTED':
   if(tx.state!=='PAYMENT_VERIFIED'||!ref(event.requestId)||tx.providerRequestId)return reject();
   return {...tx,state:'PROVIDER_PENDING',providerRequestId:event.requestId};
  case 'PROVIDER_TIMEOUT':
   // UNKNOWN must NEVER auto-retry, refund or claim success.
   return tx.state==='PROVIDER_PENDING'?{...tx,state:'PROVIDER_UNKNOWN'}:reject();
  case 'PROVIDER_RESULT_VERIFIED':
   if(!['PROVIDER_PENDING','PROVIDER_UNKNOWN'].includes(tx.state)
    ||event.requestId!==tx.providerRequestId)return reject();
   if(event.result==='PENDING')return tx;
   if(event.result==='FAILED')return {...tx,state:'REFUND_PENDING'};
   // Provider SUCCESS requires a verified operator/provider receipt ID.
   return event.receiptId&&ref(event.receiptId)
    ?{...tx,state:'COMPLETED',providerReceiptId:event.receiptId}:reject();
  case 'REFUND_RESULT_VERIFIED':
   return tx.state==='REFUND_PENDING'&&ref(event.refundId)
    ?{...tx,state:'REFUNDED',refundReference:event.refundId}:reject();
  case 'NEEDS_MANUAL_REVIEW':
   return ['PAYMENT_VERIFIED','PROVIDER_PENDING','PROVIDER_UNKNOWN','REFUND_PENDING'].includes(tx.state)
    ?{...tx,state:'REVIEW_REQUIRED'}:reject();
 }
}
