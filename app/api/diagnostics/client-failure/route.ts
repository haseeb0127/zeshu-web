import {NextResponse} from 'next/server';

// Optional, privacy-safe operational diagnostics: no account data, search query,
// IP address, order/payment reference, URL, message or stack is stored here.
export const runtime='nodejs';
export const dynamic='force-dynamic';
const kinds=new Set(['asset','storage','hydration','network','render']);
const groups=new Set(['home','dine','green','fashion','move','help','pay','account','admin','other']);
const scopes=new Set(['root','page']);
// Best-effort isolate-local log throttling. Never affect the shopper response.
let windowStart=0;
let loggedCount=0;
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};

export async function POST(request:Request){
  const origin=new URL(request.url).origin;
  if(request.headers.get('origin')!==origin)return new NextResponse(null,{status:403,headers});
  const fetchSite=request.headers.get('sec-fetch-site');
  if(fetchSite&&fetchSite!=='same-origin')return new NextResponse(null,{status:403,headers});
  if(Number(request.headers.get('content-length')||0)>500)return new NextResponse(null,{status:413,headers});
  let payload:Record<string,unknown>|null=null;
  try{
    const raw=await request.text();
    if(raw.length>500)return new NextResponse(null,{status:413,headers});
    const parsed:unknown=JSON.parse(raw);
    if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))payload=parsed as Record<string,unknown>;
  }catch{return new NextResponse(null,{status:400,headers});}
  const kind=payload?.kind,group=payload?.group,scope=payload?.scope;
  if(typeof kind!=='string'||!kinds.has(kind)
    ||typeof group!=='string'||!groups.has(group)
    ||typeof scope!=='string'||!scopes.has(scope))
    return new NextResponse(null,{status:400,headers});
  const digest=payload?.digest;
  const safeDigest=typeof digest==='string'&&/^[a-zA-Z0-9_-]{4,70}$/.test(digest)?digest:null;
  const now=Date.now();
  if(now-windowStart>60000){windowStart=now;loggedCount=0;}
  if(loggedCount<15){
    loggedCount++;
    console.warn('ZESHU_CLIENT_RECOVERY',{
      kind,group,scope,digest:safeDigest,
    });
  }
  return new NextResponse(null,{status:204,headers});
}
