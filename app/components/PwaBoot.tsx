"use client";

import { useEffect } from 'react';

/**
 * Installed-PWA-only ivory launch screen with the owner's actual ZESHU logo.
 * Regular browser visits do not display the overlay. Never wait for the load
 * event of remote images to show the already-hydrated storefront.
 */
export default function PwaBoot() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch(() => {
        // Install support is best-effort; never block the storefront.
      });
    }

    const overlay = document.getElementById('zeshu-installed-app-splash');
    if (!overlay) return;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true);
    if (!isStandalone) {
      overlay.remove();
      return;
    }

    // This component runs after hydration. Do not wait for window.load:
    // slow or stalled offscreen banner images shouldn't hold the entire app
    // behind the splash screen. The browser has already painted the shell.
    const fadeTimer = window.setTimeout(() => {
      overlay.classList.add('is-leaving');
    }, 120);
    const removalTimer = window.setTimeout(() => overlay.remove(), 340);

    // Separate bounded safety fallback in case the fade callback stalls.
    const failsafe = window.setTimeout(() => overlay.remove(), 1600);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removalTimer);
      window.clearTimeout(failsafe);
    };
  }, []);

  return <div id="zeshu-installed-app-splash" className="zeshu-installed-app-splash"
    role="status" aria-label="Opening Zeshu">
    <img src="/zeshu-glossy-icon.png" alt="Zeshu" width={256} height={256} decoding="async" />
  </div>;
}
