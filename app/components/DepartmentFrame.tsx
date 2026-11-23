'use client';

import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowRight, ChevronDown, Home, Search, ShieldCheck } from 'lucide-react';
import Link from '@/app/components/DocumentLink';
import {
  DEPARTMENTS, DEPARTMENT_ORDER, departmentForPathname, departmentSearchHref,
} from '@/app/lib/department-config';

/**
 * Lightweight shared app-in-app shell. Keeps Supabase auth, addresses and
 * Zeshu Cash in the existing root account; no new cart or wallet is created.
 * Full-document links preserve the app's Android soft-navigation recovery.
 */
export default function DepartmentFrame({children}:{children:ReactNode}) {
  const pathname = usePathname() || '';
  const department = departmentForPathname(pathname);
  const [query,setQuery] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setQuery(new URLSearchParams(window.location.search).get('q') || '');
    }
  },[pathname]);

  if (!department) return <>{children}</>;

  const theme:CSSProperties = {
    '--zeshu-dept-accent': department.accent,
    '--zeshu-dept-soft': department.soft,
  } as CSSProperties;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    window.location.assign(departmentSearchHref(department.id,query));
  };

  return <div style={theme} data-zeshu-department={department.id} className="min-h-screen pb-[calc(5.1rem+env(safe-area-inset-bottom))] md:pb-0">
    <header className="sticky top-0 z-[60] border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2 md:gap-3 md:px-6">
        <Link href="/" aria-label="Zeshu Hub home" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#075E45] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075E45]">
          <Home size={19}/>
        </Link>
        <details className="group relative min-w-0 flex-1 md:flex-none">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--zeshu-dept-accent)]">
            <span className="truncate" style={{color:department.accent}}>{department.title}</span>
            <ChevronDown size={16} className="shrink-0 text-slate-500"/>
          </summary>
          <nav aria-label="Switch Zeshu department" className="absolute left-0 top-full z-[70] mt-2 grid max-h-[65vh] w-[min(85vw,290px)] gap-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
            <Link href="/" className="rounded-lg px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100">Zeshu Hub</Link>
            {DEPARTMENT_ORDER.map(id => <Link href={DEPARTMENTS[id].href} key={id}
              aria-current={department.id===id?'page':undefined}
              className="rounded-lg px-3 py-3 text-sm font-bold hover:bg-slate-100"
              style={{color:department.id===id?department.accent:'#334155',backgroundColor:department.id===id?department.soft:undefined}}>
              {DEPARTMENTS[id].title}
            </Link>)}
          </nav>
        </details>
        <div className="hidden flex-1 items-center justify-end gap-1 overflow-x-auto lg:flex">
          {DEPARTMENT_ORDER.map(id=><Link href={DEPARTMENTS[id].href} key={id}
            aria-current={department.id===id?'page':undefined}
            className="whitespace-nowrap rounded-full px-3 py-2 text-xs font-black transition hover:bg-slate-100"
            style={{color:department.id===id?department.accent:'#475569',backgroundColor:department.id===id?department.soft:undefined}}>
            {DEPARTMENTS[id].title.replace('Zeshu ','')}
          </Link>)}
        </div>
        <span className="hidden items-center gap-1 text-[11px] font-bold text-slate-500 md:flex">
          <ShieldCheck size={14}/> One Zeshu account
        </span>
      </div>
      <div className="mx-auto max-w-6xl px-3 pb-2 md:px-6">
        {department.searchEnabled
          ? <form onSubmit={submit} role="search" className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-[var(--zeshu-dept-soft)] px-3">
              <Search size={18} style={{color:department.accent}}/>
              <label className="min-w-0 flex-1">
                <span className="sr-only">Search {department.title}</span>
                <input value={query} onChange={event=>setQuery(event.target.value)}
                  maxLength={120} placeholder={department.searchPlaceholder}
                  className="w-full bg-transparent py-2 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-500"/>
              </label>
              <button type="submit" className="rounded-lg px-3 py-1.5 text-xs font-black text-white" style={{backgroundColor:department.accent}}>Search</button>
            </form>
          : <Link href={department.actionHref} className="flex min-h-10 items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-bold" style={{color:department.accent,backgroundColor:department.soft}}>
              <span className="truncate">{department.searchPlaceholder}</span><span className="flex shrink-0 items-center gap-1"> {department.actionLabel}<ArrowRight size={15}/></span>
            </Link>}
      </div>
    </header>
    {children}
    <nav aria-label={department.title+' navigation'} className="fixed inset-x-0 bottom-0 z-[65] grid border-t border-slate-200 bg-white/98 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(15,23,42,.08)] backdrop-blur-xl md:hidden"
      style={{gridTemplateColumns:`repeat(${department.tabs.length},minmax(0,1fr))`}}>
      {department.tabs.map((tab,index)=><Link key={tab.label} href={tab.href}
        aria-current={(tab.href === pathname || (index===1 && pathname===department.href))?'page':undefined}
        className="flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 px-1.5 py-2 text-center text-[10px] font-bold leading-3 text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--zeshu-dept-accent)]"
        style={{color:(tab.href === pathname || (index===1 && pathname===department.href))?department.accent:undefined}}>
        {index===0?<Home size={18}/>:index===1?<span aria-hidden="true" className="h-[5px] w-5 rounded-full" style={{backgroundColor:department.accent}}/>:<span aria-hidden="true" className="h-[5px] w-5 rounded-full bg-slate-300"/>}
        <span className="line-clamp-2">{tab.label}</span>
      </Link>)}
    </nav>
  </div>;
}
