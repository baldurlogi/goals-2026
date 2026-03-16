import { useEffect } from 'react';

type UseDashboardLoadSubscriptionOptions = {
  load: () => Promise<void>;
  events: readonly string[];
  storageKeys?: readonly string[];
};

function shouldHandleStorageEvent(
  event: StorageEvent,
  storageKeys: readonly string[] | undefined,
): boolean {
  if (!storageKeys?.length) return true;
  if (event.key === null) return true;
  return storageKeys.includes(event.key);
}

export function useDashboardLoadSubscription({
  load,
  events,
  storageKeys,
}: UseDashboardLoadSubscriptionOptions): void {
  useEffect(() => {
    let cancelled = false;

    const runLoad = async () => {
      if (cancelled) return;
      await load();
    };

    const sync = () => {
      void runLoad();
    };

    const onStorage = (event: StorageEvent) => {
      if (!shouldHandleStorageEvent(event, storageKeys)) return;
      sync();
    };

    void runLoad();

    for (const eventName of events) {
      window.addEventListener(eventName, sync);
    }
    window.addEventListener('storage', onStorage);

    return () => {
      cancelled = true;
      for (const eventName of events) {
        window.removeEventListener(eventName, sync);
      }
      window.removeEventListener('storage', onStorage);
    };
  }, [events, load, storageKeys]);
}
