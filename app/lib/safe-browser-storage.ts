/**
 * Optional browser storage is never a prerequisite for showing Zeshu or
 * completing an existing payment confirmation. Android WebViews, privacy modes,
 * and device storage pressure can throw SecurityError / QuotaExceededError.
 */
export type BrowserStore='local'|'session';
export function readBrowserStorage(store:BrowserStore,key:string):string|null{
  if(typeof window==='undefined')return null;
  try{
    return (store==='local'?window.localStorage:window.sessionStorage).getItem(key);
  }catch{return null;}
}
export function writeBrowserStorage(store:BrowserStore,key:string,value:string):boolean{
  if(typeof window==='undefined')return false;
  try{
    (store==='local'?window.localStorage:window.sessionStorage).setItem(key,value);
    return true;
  }catch{return false;}
}
export function removeBrowserStorage(store:BrowserStore,key:string):boolean{
  if(typeof window==='undefined')return false;
  try{
    (store==='local'?window.localStorage:window.sessionStorage).removeItem(key);
    return true;
  }catch{return false;}
}
export function parseStoredArray(value:string|null,maxRows=500):unknown[]|null{
  if(!value||value.length>1_000_000)return null;
  try{
    const data:unknown=JSON.parse(value);
    return Array.isArray(data)&&data.length<=maxRows?data:null;
  }catch{return null;}
}
