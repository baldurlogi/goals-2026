import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { loadAIProfile } from '@/features/ai/aiUserProfile';
import {
  clearPendingAIContextNudge,
  dismissAIContextNudgePermanently,
  hasPendingAIContextNudge,
  isAIContextNudgeDismissed,
} from './AIContextNudge.utils';

/**
 * Renders only when:
 * - a goal-creation flow queued it for this session
 * - user has not dismissed it permanently
 * - AI profile context is still empty
 */
export function AIContextNudge() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (isAIContextNudgeDismissed()) return;
    if (!hasPendingAIContextNudge()) return;

    loadAIProfile().then((ai) => {
      if (cancelled) return;

      const hasContext = Boolean(
        ai?.about_me?.trim() ||
          ai?.goals_summary?.trim() ||
          ai?.lifestyle_notes?.trim(),
      );

      if (!hasContext) {
        setVisible(true);
      } else {
        clearPendingAIContextNudge();
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleDismiss() {
    dismissAIContextNudgePermanently();
    clearPendingAIContextNudge();
    setVisible(false);
  }

  function handleGoToProfile() {
    clearPendingAIContextNudge();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/15">
        <Sparkles className="h-3.5 w-3.5 text-violet-400" />
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-medium">Make your AI coach personal</p>
        <p className="text-xs text-muted-foreground">
          Add a few sentences about yourself — your situation, motivation, and
          what you struggle with — so your coach can give better, more specific
          advice.
        </p>

        <Link
          to="/app/profile#ai-settings"
          className="mt-1.5 inline-block text-xs font-medium text-violet-400 underline hover:text-violet-300"
          onClick={handleGoToProfile}
        >
          Add context in Profile settings →
        </Link>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="mt-0.5 shrink-0 text-muted-foreground/50 hover:text-muted-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
