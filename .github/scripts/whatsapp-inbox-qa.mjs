import assert from 'node:assert/strict';
import {parseInboundWhatsAppMessages} from '../../app/lib/whatsapp-inbox-parser.ts';
const WABA='123456789000000',PHONE='100200300400500',ts=String(Math.floor(Date.now()/1000));
const payload={object:'whatsapp_business_account',entry:[{id:WABA,changes:[{
  field:'messages',value:{metadata:{phone_number_id:PHONE},
    contacts:[{wa_id:'919501234567',profile:{name:'Customer Test'}}],
    messages:[{id:'wamid.TEST-0001',from:'919501234567',timestamp:ts,type:'text',
      text:{body:'Hello Zeshu'}}]}}
]}]};
let messages=parseInboundWhatsAppMessages(payload,WABA,PHONE);
assert.equal(messages.length,1);
assert.equal(messages[0].messageType,'text');
assert.equal(messages[0].body,'Hello Zeshu');
assert.equal(messages[0].displayName,'Customer Test');
assert.equal(parseInboundWhatsAppMessages(payload,'99999999999',PHONE).length,0);
assert.equal(parseInboundWhatsAppMessages(payload,WABA,'99999999999').length,0);
assert.equal(parseInboundWhatsAppMessages({...payload,object:'page'},WABA,PHONE).length,0);
const duplicateInvalid=structuredClone(payload);
duplicateInvalid.entry[0].changes[0].value.messages[0].from='abc';
assert.equal(parseInboundWhatsAppMessages(duplicateInvalid,WABA,PHONE).length,0);
const media=structuredClone(payload);
media.entry[0].changes[0].value.messages[0].type='image';
delete media.entry[0].changes[0].value.messages[0].text;
media.entry[0].changes[0].value.messages[0].image={id:'private-media-handle',url:'SECRET'};
messages=parseInboundWhatsAppMessages(media,WABA,PHONE);
assert.equal(messages.length,1);
assert.equal(messages[0].messageType,'unsupported');
assert.ok(!JSON.stringify(messages).includes('private-media-handle'));
assert.ok(!JSON.stringify(messages).includes('SECRET'));
// Inbound quick replies are meaningful customer messages; keep only their
// visible labels, never Meta internal IDs or entire structured objects.
const quickReply=structuredClone(payload);
quickReply.entry[0].changes[0].value.messages[0]={
  id:'wamid.TEST-BUTTON',from:'919501234567',timestamp:ts,
  type:'button',button:{text:'Yes, please',payload:'PRIVATE_INTERNAL_TRIGGER'},
};
messages=parseInboundWhatsAppMessages(quickReply,WABA,PHONE);
assert.equal(messages.length,1);
assert.equal(messages[0].messageType,'text');
assert.equal(messages[0].body,'Yes, please');
assert.ok(!JSON.stringify(messages).includes('PRIVATE_INTERNAL_TRIGGER'));
const interactive=structuredClone(payload);
interactive.entry[0].changes[0].value.messages[0]={
 id:'wamid.TEST-INTERACTIVE',from:'919501234567',timestamp:ts,
 type:'interactive',
 interactive:{type:'button_reply',button_reply:{id:'SECRET_ACTION_ID',title:'Talk to support'}},
};
messages=parseInboundWhatsAppMessages(interactive,WABA,PHONE);
assert.equal(messages[0].messageType,'text');
assert.equal(messages[0].body,'Talk to support');
assert.ok(!JSON.stringify(messages).includes('SECRET_ACTION_ID'));
const list=structuredClone(interactive);
list.entry[0].changes[0].value.messages[0].interactive={
 type:'list_reply',list_reply:{id:'SECRET_LIST_ID',title:'My orders',description:'private provider context'},
};
messages=parseInboundWhatsAppMessages(list,WABA,PHONE);
assert.equal(messages[0].body,'My orders');
assert.ok(!JSON.stringify(messages).includes('SECRET_LIST_ID'));
assert.ok(!JSON.stringify(messages).includes('private provider context'));
const form=structuredClone(interactive);
form.entry[0].changes[0].value.messages[0].interactive={
 type:'nfm_reply',nfm_reply:{response_json:'PRIVATE_FORM_DATA'},
};
messages=parseInboundWhatsAppMessages(form,WABA,PHONE);
assert.equal(messages[0].messageType,'unsupported');
assert.ok(!JSON.stringify(messages).includes('PRIVATE_FORM_DATA'));
const emptyReply=structuredClone(interactive);
emptyReply.entry[0].changes[0].value.messages[0].interactive={type:'button_reply',button_reply:{id:'SECRET_ONLY'}};
messages=parseInboundWhatsAppMessages(emptyReply,WABA,PHONE);
assert.equal(messages[0].messageType,'unsupported');
assert.ok(!JSON.stringify(messages).includes('SECRET_ONLY'));
const longTitle=structuredClone(interactive);
longTitle.entry[0].changes[0].value.messages[0].interactive={
 type:'button_reply',button_reply:{title:'x'.repeat(5000)},
};
messages=parseInboundWhatsAppMessages(longTitle,WABA,PHONE);
assert.equal(messages[0].body.length,4000);
const status=structuredClone(payload);
delete status.entry[0].changes[0].value.messages;
status.entry[0].changes[0].value.statuses=[{id:'wamid.STATUS-123',status:'delivered'}];
assert.equal(parseInboundWhatsAppMessages(status,WABA,PHONE).length,0);
console.log('PASS: WhatsApp inbound parser validates WABA/phone and retains only minimal text/placeholders; sending unavailable.');
