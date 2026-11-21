import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getPlanApiCredentials,isPlanApiUnavailableError} from '../../app/lib/planapi-config.ts';

const saved={
 memberId:process.env.PLANAPI_MEMBER_ID,
 password:process.env.PLANAPI_PASSWORD,
 token:process.env.PLANAPI_TOKEN_ID,
 rotated:process.env.PLANAPI_CREDENTIALS_ROTATED_CONFIRMED,
};
try{
 process.env.PLANAPI_MEMBER_ID='build-test-member';
 process.env.PLANAPI_PASSWORD='build-test-nonsecret-password';
 process.env.PLANAPI_TOKEN_ID='build-test-token';
 delete process.env.PLANAPI_CREDENTIALS_ROTATED_CONFIRMED;
 assert.throws(()=>getPlanApiCredentials(),/PLANAPI_ROTATION_NOT_CONFIRMED/);
 process.env.PLANAPI_CREDENTIALS_ROTATED_CONFIRMED='false';
 assert.throws(()=>getPlanApiCredentials({requireToken:true}),/PLANAPI_ROTATION_NOT_CONFIRMED/);
 process.env.PLANAPI_CREDENTIALS_ROTATED_CONFIRMED='TRUE';
 assert.throws(()=>getPlanApiCredentials(),/PLANAPI_ROTATION_NOT_CONFIRMED/);
 process.env.PLANAPI_CREDENTIALS_ROTATED_CONFIRMED='true';
 const creds=getPlanApiCredentials({requireToken:true});
 assert.equal(creds.memberId,'build-test-member');
 assert.equal(creds.password,'build-test-nonsecret-password');
 assert.equal(creds.tokenId,'build-test-token');
 delete process.env.PLANAPI_TOKEN_ID;
 assert.throws(()=>getPlanApiCredentials({requireToken:true}),/PLANAPI_NOT_CONFIGURED/);
 assert.equal(isPlanApiUnavailableError('PLANAPI_NOT_CONFIGURED'),true);
 assert.equal(isPlanApiUnavailableError('PLANAPI_ROTATION_NOT_CONFIRMED'),true);
 assert.equal(isPlanApiUnavailableError('NETWORK_TIMEOUT'),false);
}finally{
 for(const [key,val] of Object.entries({
  PLANAPI_MEMBER_ID:saved.memberId,PLANAPI_PASSWORD:saved.password,
  PLANAPI_TOKEN_ID:saved.token,PLANAPI_CREDENTIALS_ROTATED_CONFIRMED:saved.rotated,
 })){if(val===undefined)delete process.env[key];else process.env[key]=val;}
}

const read=(path)=>readFileSync(path,'utf8');
const config=read('app/lib/planapi-config.ts');
assert(config.includes("process.env.PLANAPI_CREDENTIALS_ROTATED_CONFIRMED !== 'true'"),
 'Never call paid API with unrotated credentials');
for(const path of [
 'app/api/fetch-plans/route.ts',
 'app/api/fetch-operator/route.ts',
 'app/api/fetch-bill/route.ts',
 'app/api/fetch-gas-bill/route.ts',
 'app/api/recharge/plans/route.ts',
 'app/api/upi-tools/route.ts',
]){
 const route=read(path);
 assert(route.includes('isPlanApiUnavailableError(message)'),path+' must handle the rotation block as service-unavailable, not a paid API failure');
 assert(route.includes('getPlanApiCredentials')||route.includes('discoverPlans'),path+' must use central guarded provider credentials');
}
const admin=read('app/api/admin/pay/readiness/route.ts');
const dashboard=read('app/admin/pay/page.tsx');
assert(admin.includes('discoveryCallsPermitted:planapiConfigured&&env.PLANAPI_CREDENTIALS_ROTATED_CONFIRMED==="true"'),'Admin must show true readiness only after rotation attestation');
assert(dashboard.includes('discoveryCallsPermitted'),'Owner must see the explicit discovery gate status');
assert(read('.env.example').includes('PLANAPI_CREDENTIALS_ROTATED_CONFIRMED=false'),'No enabling rotation by default');
assert(read('app/api/process-recharge/route.ts').includes("fulfillment: 'UNAVAILABLE'"),'Real recharge remains off');
assert(read('app/green/page.tsx').includes('Zeshu Green is on hold'),'Owner-paused tree campaign cannot restart');
console.log('PASS: Ezytm PlanAPI credential rotation guard, all information endpoints fail safely, no recharge and Green stays paused.');
