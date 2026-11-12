/**
 * Privacy-safe client failure classification for Cloudflare runtime diagnostics.
 * Never transmit error messages, URLs, search queries, user IDs, cart contents,
 * auth sessions, payment references, or raw stacks.
 */
export type ClientFailureKind='asset'|'storage'|'hydration'|'network'|'render';
export type RouteGroup='home'|'dine'|'green'|'fashion'|'move'|'help'|'pay'|'account'|'admin'|'other';
export function classifyClientFailure(error:Pick<Error,'name'|'message'>):ClientFailureKind{
  const signal=(String(error?.name||'')+' '+String(error?.message||'')).slice(0,600).toLowerCase();
  if(/chunkloaderror|loading (?:css |js )?chunk|failed to fetch dynamically imported module|failed to load module script|importing a module script failed|loading script failed/.test(signal))return 'asset';
  if(/securityerror|quotaexceedederror|localstorage|sessionstorage|storage access/.test(signal))return 'storage';
  if(/hydration|server rendered html|mismatch|react #418|react #423/.test(signal))return 'hydration';
  if(/networkerror|failed to fetch|load failed|network request failed/.test(signal))return 'network';
  return 'render';
}
export function groupClientRoute(path:string):RouteGroup{
  const root=path.split('/').filter(Boolean)[0]||'';
  if(!root)return 'home';
  if(['dine','green','fashion','move','help','admin'].includes(root))return root as RouteGroup;
  if(['scanner','app','policies','partners','earn','services'].includes(root))return 'other';
  if(['account','profile','orders','checkout'].includes(root))return 'account';
  if(['pay','recharge'].includes(root))return 'pay';
  return 'other';
}
export function safeClientDigest(value:unknown):string|null{
  return typeof value==='string'&&/^[a-zA-Z0-9_-]{4,70}$/.test(value)?value:null;
}
/** Only one silent hard-reload per 30 minutes for the *same route* and a
 * stale/missing JS chunk. Never reload checkout/payment/admin pages on errors.
 * If sessionStorage is disabled, do not retry automatically (loop safety).
 */
export function shouldSelfHealChunk(error:Pick<Error,'name'|'message'>,path:string,now:number=Date.now()):boolean{
  if(typeof window==='undefined'||classifyClientFailure(error)!=='asset')return false;
  if(!navigator.onLine)return false;
  if(/^\/(admin|checkout|payment|payments|orders|account)(?:\/|$)/.test(path))return false;
  const key='zeshu:safe:asset-recovery:'+groupClientRoute(path);
  try{
    const previous=Number(window.sessionStorage.getItem(key)||'0');
    if(Number.isFinite(previous)&&previous>0&&now-previous<30*60*1000)return false;
    window.sessionStorage.setItem(key,String(now));
    return true;
  }catch{return false;}
}
export function reportClientFailure(error:Error&{digest?:string},path:string,scope:'page'|'root'){
  if(typeof window==='undefined')return;
  try{
    const body=JSON.stringify({
      kind:classifyClientFailure(error),
      group:groupClientRoute(path),scope,
      digest:safeClientDigest(error?.digest),
    });
    // Do not send raw error messages: they sometimes contain customer data.
    if(typeof navigator.sendBeacon==='function'){
      navigator.sendBeacon('/api/diagnostics/client-failure',new Blob([body],{type:'application/json'}));
    }else{
      void fetch('/api/diagnostics/client-failure',{
        method:'POST',headers:{'Content-Type':'application/json'},body,
        credentials:'omit',keepalive:true,
      }).catch(()=>{});
    }
  }catch{/* Failure reports must never break browsing or customer checkout. */}
}
