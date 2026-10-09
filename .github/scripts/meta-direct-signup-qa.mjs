import assert from 'node:assert/strict';
import {
  makeMetaConnectChallenge,verifyMetaConnectChallenge,encryptMetaToken,
  decryptMetaToken,exchangeMetaSignupCode,
} from '../../app/lib/meta-embedded-signup.ts';

const secret='test-only-not-a-real-Meta-app-secret-2026';
const uid='739d6ed0-8f06-4e3f-bdcb-46f6281a0f47';
const now=1_799_100_000_000;
const challenge=makeMetaConnectChallenge(uid,secret,now);
assert.equal(verifyMetaConnectChallenge(challenge.cookieValue,challenge.nonce,uid,secret,now+2000),true);
assert.equal(verifyMetaConnectChallenge(challenge.cookieValue,'other',uid,secret,now+2000),false);
assert.equal(verifyMetaConnectChallenge(challenge.cookieValue,challenge.nonce,'another-user',secret,now+2000),false);
assert.equal(verifyMetaConnectChallenge(challenge.cookieValue,challenge.nonce,uid,secret,now+11*60000),false);
assert.equal(verifyMetaConnectChallenge(challenge.cookieValue+'a',challenge.nonce,uid,secret,now+2000),false);
const key=Buffer.alloc(32,21).toString('base64');
const encrypted=encryptMetaToken('EAATestOnlyNotRealMetaToken123',key);
assert.ok(!JSON.stringify(encrypted).includes('EAATest'));
assert.equal(decryptMetaToken(encrypted,key),'EAATestOnlyNotRealMetaToken123');
assert.throws(()=>decryptMetaToken({...encrypted,token_ciphertext:Buffer.from('modified').toString('base64')},key));
assert.throws(()=>encryptMetaToken('token','bad_key'));
let calls=[];
const graph=async (url, opts)=>{
  calls.push({url:new URL(url),method:opts.method,authorization:opts.headers?.Authorization??null});
  if(new URL(url).pathname.endsWith('/oauth/access_token'))
    return new Response(JSON.stringify({access_token:'EAATestOnlyNotRealMetaToken123',expires_in:0}),{status:200});
  return new Response(JSON.stringify({data:[
    {id:'999999999',display_phone_number:'+91 90000 00000',verified_name:'Zeshu'},
  ]}),{status:200});
};
const base={
  appId:'123456789',appSecret:secret,graphVersion:'v23.0',code:'ValidTestCodeAbcD123',
  wabaId:'1234567890',phoneNumberId:'999999999',request:graph,
};
const ok=await exchangeMetaSignupCode(base);
assert.equal(ok.verifiedName,'Zeshu');
assert.equal(calls.length,2);
assert.equal(calls[1].authorization,'Bearer EAATestOnlyNotRealMetaToken123');
assert.equal(calls[0].url.host,'graph.facebook.com');
await assert.rejects(()=>exchangeMetaSignupCode({...base,phoneNumberId:'888888888'}),/META_PHONE_NOT_OWNED_BY_WABA/);
await assert.rejects(()=>exchangeMetaSignupCode({...base,code:'bad'}),/META_SIGNUP_INPUT_INVALID/);
console.log('Meta direct signup guards: CSRF, expiry, AES tamper detection, provider asset verification passed.');
