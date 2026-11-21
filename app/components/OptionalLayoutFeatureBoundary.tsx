'use client';

import {Component, type ReactNode} from 'react';
import {reportClientFailure} from '@/app/lib/client-failure-recovery';

/**
 * A failure in an optional enhancement (assistant, PWA splash) must never
 * replace the entire Zeshu storefront with global-error.tsx.
 * Core checkout and account UI remain outside this fallback.
 */
export default class OptionalLayoutFeatureBoundary extends Component<
  {children:ReactNode;feature:'assistant'|'pwa'},
  {failed:boolean}
>{
  state={failed:false};
  static getDerivedStateFromError():{failed:boolean}{
    return {failed:true};
  }
  componentDidCatch(error:Error){
    // Privacy-safe category/route only. No stacks, tokens, messages or checkout data.
    if(typeof window!=='undefined')
      reportClientFailure(error,window.location.pathname,'page');
  }
  render():ReactNode{
    return this.state.failed?null:this.props.children;
  }
}
