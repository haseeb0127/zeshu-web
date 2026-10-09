'use client';

import { useEffect } from 'react';

/**
 * Root-level recovery screen for Next.js / Cloudflare navigation errors.
 * A user should never be stranded on Next's black "This page couldn't load"
 * screen; retain safe retry and home paths without inventing order status.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // No PII, payment details or user tokens are logged here.
    console.error('Zeshu root navigation failure', error);
  }, [error]);

  return <html lang="en">
    <head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/><meta name="theme-color" content="#075e45"/><title>Reconnect to Zeshu</title></head>
    <body style={{ margin:0,background:'#f4faf6',color:'#163327',fontFamily:'system-ui,Arial,sans-serif',padding:20,minHeight:'100dvh',display:'flex',alignItems:'center',justifyContent:'center' }}>
      <main style={{maxWidth:430,width:'100%',background:'#fff',border:'1px solid #e0efe5',borderRadius:26,padding:'36px 24px',textAlign:'center',boxShadow:'0 14px 38px rgba(7,94,69,.12)'}}>
        <div aria-hidden="true" style={{width:70,height:70,margin:'0 auto 20px',borderRadius:22,display:'grid',placeItems:'center',background:'linear-gradient(135deg,#0ab57a,#075e45)',color:'#fff',fontSize:44,fontWeight:900}}>Z</div>
        <h1 style={{margin:'0 0 12px',fontSize:24,fontWeight:850,lineHeight:1.25}}>Zeshu needs a moment</h1>
        <p style={{margin:'0 0 24px',fontSize:14,lineHeight:1.65,color:'#5d6f63'}}>This section could not open just now. Try reloading or return to shopping. This screen does not confirm any order, booking or payment.</p>
        <button onClick={() => window.location.reload()} style={{width:'100%',background:'#075e45',border:0,borderRadius:15,minHeight:49,color:'#fff',fontSize:15,fontWeight:750,cursor:'pointer'}}>Reload Zeshu</button>
        <button onClick={() => reset()} style={{width:'100%',marginTop:11,background:'#edf8f1',border:'1px solid #b9dfc7',borderRadius:15,minHeight:49,color:'#075e45',fontSize:15,fontWeight:750,cursor:'pointer'}}>Try this page again</button>
        <a href="/" style={{display:'block',marginTop:11,background:'#fff',border:'1px solid #dbe9df',borderRadius:15,padding:'14px 12px',color:'#075e45',textDecoration:'none',fontSize:15,fontWeight:750}}>Go to Zeshu Home</a>
        <a href="/help" style={{display:'block',marginTop:20,color:'#075e45',fontSize:13,fontWeight:700,textDecoration:'underline'}}>Help Center</a>
      </main>
    </body>
  </html>;
}
