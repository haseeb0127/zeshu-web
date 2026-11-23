"use client";

import { useEffect, useState } from 'react';
import { useCustomerLanguage } from './CustomerLanguageProvider';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function PwaInstallButton() {
  const { t } = useCustomerLanguage();
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setInstalled(window.matchMedia('(display-mode: standalone)').matches);
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const markInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', capturePrompt);
    window.addEventListener('appinstalled', markInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', capturePrompt);
      window.removeEventListener('appinstalled', markInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) {
      setShowHelp(true);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setInstallPrompt(null);
  };

  if (installed) {
    return <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">{t('Zeshu is installed on this device.')}</div>;
  }

  return (
    <div>
      <button type="button" onClick={() => void install()} className="w-full rounded-xl bg-[#075E45] px-5 py-3.5 text-sm font-black text-white shadow-sm active:scale-[.98]">
        Install Zeshu
      </button>
      {showHelp && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">{t('If the install prompt does not appear, open your browser menu and choose Add to Home screen or Install app. On iPhone, use Share → Add to Home Screen.')}</p>}
    </div>
  );
}
