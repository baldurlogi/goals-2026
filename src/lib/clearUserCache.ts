export function clearUserCache() {
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (
        key === "cache:profile:v1" ||
        key === "cache:ai-coach:v1" ||
        key === "cache:ai-coach:last-module" ||
        key === "cache:ai-coach:last-session:v1" ||
        key === "cache:user-tier:v1" ||
        key.startsWith("cache:profile:v2:") ||
        key.startsWith("cache:ai-coach:v2:") ||
        key.startsWith("cache:ai-coach:last-module:v2:") ||
        key.startsWith("cache:ai-coach:last-session:v2:")
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch {
    // ignore
  }
}