import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=path=>readFileSync(path,'utf8');

const calc=file('app/admin/green/GreenPilotCalculator.tsx');
const admin=file('app/admin/green/page.tsx');
const docs=file('docs/ZESHU_GREEN_TREE_PROGRAM.md');
const customer=file('app/green/page.tsx');
const publicImpact=file('app/api/green/impact/route.ts');
const home=file('app/page.tsx');
assert(admin.includes("import GreenPilotCalculator from './GreenPilotCalculator'"),'Only private admin dashboard imports calculator');
assert(admin.includes('<GreenPilotCalculator programmeMode={info.mode}/>'),'Calculator must display the actual programme mode from admin-only readiness');
assert(calc.includes('useState(20)'),'Illustrative order scenario is editable');
assert(calc.includes('useState(100)'),'Illustrative margin is editable');
assert(calc.includes('useState(150)'),'Illustrative total tree cost is editable');
assert(calc.includes('useState(1500)'),'Illustrative budget cap is editable');
assert(calc.includes('useState(20)'),'Illustrative contribution allocation is editable');
assert(calc.includes('const required=orders*treeCost'),'All-order promise must be funded');
assert(calc.includes('const available=Math.min(monthlyCap,budgetFromMargin)'),'Budget must respect both margin allocation and monthly cap');
assert(calc.includes('Math.floor(available/treeCost)'),'Limited pilot trees must be rounded down and not oversold');
assert(calc.includes("programmeMode==='ACTIVE'"),'Paused campaign cannot be implied live');
assert(calc.includes('does not'), 'Must disclose inability to activate and plant');
assert(!/(fetch\s*\(|\.insert\s*\(|\.update\s*\(|\.rpc\s*\(|localStorage|sessionStorage|navigator\.sendBeacon|sendMessage|razorpay|window\.open|FormData)/.test(calc),
  'Private calculator must not send data, store data or trigger spending');
assert(!home.includes('<GreenOrderImpact'),'Do not restore paused Green customer promotion');
assert(!home.includes("action:\"green\""),'Do not restore paused Green banner');
assert(customer.includes('Zeshu Green is on hold'),'Customer page must disclose pause');
assert(publicImpact.includes("programmeStatus:'PAUSED'"),'Public API must disclose pause');
assert(docs.includes('Owner instruction: 21 November 2026'),'Do not remove previous pause');
const limit=(orders,margin,tree,monthlyCap,percent)=>{
 const available=Math.min(monthlyCap,orders*margin*percent/100);
 const max=tree>0?Math.min(orders,Math.floor(available/tree)):0;
 return {available,max,required:orders*tree};
};
assert.deepEqual(limit(20,100,150,1500,20),{available:400,max:2,required:3000});
assert.deepEqual(limit(10,1000,100,1500,20),{available:1500,max:10,required:1000});
assert.deepEqual(limit(0,1000,100,1500,20),{available:0,max:0,required:0});
console.log('PASS: private Zeshu Green profitability model, honest capped tree capacity and owner-paused programme safety.');
