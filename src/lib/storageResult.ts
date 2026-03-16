export type StorageMutationResult = {
  ok: boolean;
  error?: string;
};

export function storageOk(): StorageMutationResult {
  return { ok: true };
}

export function storageError(error: unknown): StorageMutationResult {
  if (typeof error === 'string') {
    return { ok: false, error };
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? 'Unknown error');
    return { ok: false, error: message };
  }

  return { ok: false, error: 'Unknown error' };
}
