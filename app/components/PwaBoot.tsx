"use client";

import { useEffect } from 'react';

export default function PwaBoot() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Installation support is best-effort and must never block the storefront.
    });
  }, []);

  return null;
}
