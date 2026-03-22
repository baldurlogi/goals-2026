const DISMISSED_KEY = 'begyn:ai-context-nudge:dismissed:v1';
const PENDING_KEY = 'begyn:ai-context-nudge:pending:v1';

export function isAIContextNudgeDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissAIContextNudgePermanently() {
  try {
    localStorage.setItem(DISMISSED_KEY, '1');
  } catch {
    // ignore
  }
}

export function hasPendingAIContextNudge() {
  try {
    return sessionStorage.getItem(PENDING_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearPendingAIContextNudge() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}

export function queueAIContextNudge() {
  try {
    sessionStorage.setItem(PENDING_KEY, '1');
  } catch {
    // ignore
  }
}
