'use client';

import {useEffect,useState} from 'react';
import {classifyClientFailure,groupClientRoute,reportClientFailure,shouldSelfHealChunk} from '@/app/lib/client-failure-recovery';

/**
 * Last resort root recovery for genuine Next/Cloudflare failures. A stale
 * JavaScript chunk gets ONE automatic attempt, without discarding carts,
 * authentication, location or payment confirmation state.
 */
export default function GlobalError({
  error,reset,
}:{
  error:Error&{digest?:string};
  reset:()=>void;
}){
  const [selfHealing,setSelfHealing]=useState(false);
  useEffect(()=>{
    const path=window.location.pathname;
    // Do not print raw errors to consoles or remote logs; errors may contain
    // personal input, route queries or payment references.
    console.warn('Zeshu root recovery',{
      kind:classifyClientFailure(error),group:groupClientRoute(path),
    });
    reportClientFailure(error,path,'root');
    if(shouldSelfHealChunk(error,path)){
      setSelfHealing(true);
      const retry=window.setTimeout(()=>window.location.reload(),90);
      const failsafe=window.setTimeout(()=>setSelfHealing(false),3000);
      return ()=>{window.clearTimeout(retry);window.clearTimeout(failsafe);};
    }
  },[error]);
  return <html lang="en">
    <head>
      <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
      <meta name="theme-color" content="#075e45"/>
      <title>{selfHealing?'Reconnecting to Zeshu':'Zeshu connection help'}</title>
    </head>
    <body style={{margin:0,background:'#f4faf6',color:'#163327',fontFamily:'system-ui,Arial,sans-serif',padding:20,minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <main data-zeshu-recovery="root-error" style={{maxWidth:430,width:'100%',background:'#fff',border:'1px solid #e0efe5',borderRadius:26,padding:'32px 24px',textAlign:'center',boxShadow:'0 14px 38px rgba(7,94,69,.12)'}}>
        <div aria-hidden="true" style={{width:70,height:70,margin:'0 auto 20px',borderRadius:22,display:'grid',placeItems:'center',background:'linear-gradient(135deg,#0ab57a,#075e45)',color:'#fff',fontSize:44,fontWeight:900}}>Z</div>
        {selfHealing
          ?<>
            <h1 style={{fontSize:23,margin:'0 0 10px'}}>Restoring your Zeshu page…</h1>
            <p role="status" style={{lineHeight:1.65,color:'#5d6f63'}}>Checking the latest app files without changing your cart or order.</p>
          </>
          :<>
            <h1 style={{fontSize:23,margin:'0 0 12px',lineHeight:1.3}}>We couldn't open this page</h1>
            <p style={{fontSize:14,lineHeight:1.65,color:'#5d6f63'}}>This section encountered a problem. Your order, booking and payment status must be checked in your account before trying another transaction.</p>
            <button onClick={()=>reset()} style={{width:'100%',background:'#075e45',border:0,borderRadius:15,minHeight:49,color:'#fff',fontSize:15,fontWeight:750,cursor:'pointer'}}>Try opening the page again</button>
            <a href="/" style={{display:'block',marginTop:11,background:'#edf8f1',border:'1px solid #b9dfc7',borderRadius:15,padding:'14px 12px',color:'#075e45',textDecoration:'none',fontSize:15,fontWeight:750}}>Continue to Zeshu Home</a>
            <a href="/help" style={{display:'block',marginTop:20,color:'#075e45',fontSize:13,fontWeight:700,textDecoration:'underline'}}>Help Center</a>
          </>}
      </main>
    </body>
  </html>;
}
