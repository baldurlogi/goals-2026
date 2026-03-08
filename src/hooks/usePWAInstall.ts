import { useEffect, useState } from "react";

// The native browser event that fires when the app is installable
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed-v1";

export function usePWAInstall() {
  // Initialise synchronously from matchMedia — avoids setState inside effect body
  const [isInstalled, setIsInstalled] = useState(
    () => window.matchMedia("(display-mode: standalone)").matches
  );
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISSED_KEY) === "true"; } catch { return false; }
  });

  useEffect(() => {
    // Already running as installed PWA — no need to listen for install prompt
    if (isInstalled) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, [isInstalled]);

  async function triggerInstall() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setPromptEvent(null);
  }

  function dismiss() {
    try { localStorage.setItem(DISMISSED_KEY, "true"); } catch { /* storage unavailable */ }
    setIsDismissed(true);
    setPromptEvent(null);
  }

  // Show banner if: prompt available + not installed + not dismissed
  const canInstall = !!promptEvent && !isInstalled && !isDismissed;

  return { canInstall, triggerInstall, dismiss, isInstalled };
}