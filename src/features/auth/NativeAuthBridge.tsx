import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { useNavigate } from "react-router-dom";

function toInternalPath(urlString: string): string | null {
  try {
    const url = new URL(urlString);

    if (url.protocol !== "app.begyn:") return null;

    const hostPath = url.hostname ? `/${url.hostname}` : "";
    const pathname = url.pathname ?? "";
    const search = url.search ?? "";
    const hash = url.hash ?? "";

    return `${hostPath}${pathname}${search}${hash}`;
  } catch {
    return null;
  }
}

export function NativeAuthBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleAppUrl = async (url: string) => {
      const nextPath = toInternalPath(url);
      if (!nextPath) return;

      try {
        await Browser.close();
      } catch {
        // browser may already be closed
      }

      navigate(nextPath, { replace: true });
    };

    void CapacitorApp.getLaunchUrl().then((launchData) => {
      if (!launchData?.url) return;
      void handleAppUrl(launchData.url);
    });

    const listener = CapacitorApp.addListener("appUrlOpen", async ({ url }) => {
      await handleAppUrl(url);
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [navigate]);

  return null;
}
