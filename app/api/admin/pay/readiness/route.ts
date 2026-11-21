import {NextResponse} from "next/server";
import {authorizeWhatsAppInboxAdmin,inboxNoStore} from "@/app/lib/whatsapp-inbox-auth";
import {getRuntimeEnvValue} from "@/app/lib/runtime-env";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const send=(body:object,status=200)=>NextResponse.json(body,{status,headers:inboxNoStore});

/**
 * Private, READ-ONLY Zeshu Pay readiness report.
 * Never calls a paid PlanAPI endpoint, executes A1Topup, moves money or
 * returns credential values. Configuration presence is not provider approval.
 */
export async function GET(request:Request){
  const admin=await authorizeWhatsAppInboxAdmin(request);
  if(!admin)return send({error:"Zeshu admin sign-in required."},403);
  const names=[
    "PLANAPI_MEMBER_ID","PLAN_API_USER_ID",
    "PLANAPI_PASSWORD","PLAN_API_PASSWORD",
    "PLANAPI_TOKEN_ID","PLAN_API_TOKEN_ID",
    "PLANAPI_CREDENTIALS_ROTATED_CONFIRMED",
    "A1TOPUP_USERNAME","A1TOPUP_PASSWORD",
    "A1TOPUP_EXECUTION_ENABLED",
    "RAZORPAY_KEY_ID",
  ] as const;
  const entries=await Promise.all(names.map(async key=>[key,await getRuntimeEnvValue(key)] as const));
  const env=Object.fromEntries(entries) as Record<typeof names[number],string>;
  const memberPresent=Boolean(env.PLANAPI_MEMBER_ID||env.PLAN_API_USER_ID);
  const passwordPresent=Boolean(env.PLANAPI_PASSWORD||env.PLAN_API_PASSWORD);
  const planapiConfigured=memberPresent&&passwordPresent;
  const tokenPresent=Boolean(env.PLANAPI_TOKEN_ID||env.PLAN_API_TOKEN_ID);
  const a1CredentialsPresent=Boolean(env.A1TOPUP_USERNAME&&env.A1TOPUP_PASSWORD);
  const key=env.RAZORPAY_KEY_ID;
  const paymentMode=key.startsWith("rzp_test_")?"TEST":key.startsWith("rzp_live_")?"LIVE_CONFIGURED":"UNCONFIRMED";
  // The A1 adapter fails closed in production even if an environment toggle
  // was set. Without a signed contract, verified request format and receipt
  // reconciliation, there is NO safe live execution.
  const {count,error}=await admin.service.from("recharge_transactions")
    .select("id",{count:"exact",head:true});
  return send({
    status:"DISCOVERY_ONLY",
    providers:{
      a1topup:{
        role:"Recharge fulfilment (selected)",
        credentialsConfigured:a1CredentialsPresent,
        codeExecutionReady:false,
        liveTransactionEnabled:false,
        executionFlagRequested:env.A1TOPUP_EXECUTION_ENABLED==="true",
        blocking:[
          "Provider request body, permitted operators/circles and callback authenticity not yet validated end to end.",
          "Contract, settlement, reconciliation, refunds and merchant authorisation must be confirmed before live requests.",
        ],
      },
      ezytmPlanapi:{
        role:"Recharge plans, operator and bill information (selected)",
        credentialsConfigured:planapiConfigured,
        optionalTokenConfigured:tokenPresent,
        rotatedCredentialConfirmed:env.PLANAPI_CREDENTIALS_ROTATED_CONFIRMED==="true",
        providerCallPerformed:false,
        transactionsEnabled:false,
        blocking:[
          "Confirm previously exposed API credentials were rotated in the provider account and Cloudflare.",
          "Read-only hits may consume provider quota. No live PlanAPI requests are made by this dashboard.",
        ],
      },
    },
    checkout:{
      gatewayEnvironment:paymentMode,
      customerRechargePaymentsEnabled:false,
      actualTelecomFulfilmentEnabled:false,
      utilityBillPaymentsEnabled:false,
      note:"A Razorpay TEST checkout is not a completed mobile recharge or bill payment.",
    },
    database:{rechargeTransactions:error?null:count},
    approvedToGoLive:false,
    safeguards:{
      ownerMustApproveLivePayments:true,
      providerSuccessReceiptRequired:true,
      idempotencyAndPendingRecoveryRequired:true,
      reconciliationAndRefundReviewRequired:true,
      regulatedBillPaymentPartnerVerificationRequired:true,
    },
    checkedAt:new Date().toISOString(),
  });
}
