/**
 * achievementStorage.ts
 *
 * Persists unlocked achievements to Supabase (achievements table)
 * with a localStorage cache for instant reads.
 *
 * Table schema (run migration_achievements.sql):
 *   id          uuid primary key default gen_random_uuid()
 *   user_id     uuid references auth.users not null
 *   achievement_id  text not null
 *   unlocked_at timestamptz default now()
 *   unique(user_id, achievement_id)
 */

import { supabase } from '@/lib/supabaseClient';
import type { UnlockedAchievement } from './achievementDefinitions';
import { getLocalDateKey } from '@/hooks/useTodayDate';
getLocalDateKey

export const ACHIEVEMENTS_CHANGED_EVENT = 'achievements:changed';
const emit = () => window.dispatchEvent(new Event(ACHIEVEMENTS_CHANGED_EVENT));

const CACHE_KEY = 'cache:achievements:v1';

// ── Cache helpers ─────────────────────────────────────────────────────────────

function readCache(): UnlockedAchievement[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCache(achievements: UnlockedAchievement[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(achievements));
  } catch {
    /* ignore */
  }
}

export function seedAchievements(): UnlockedAchievement[] {
  return readCache();
}

// ── Load all unlocked achievements ───────────────────────────────────────────

export async function loadUnlockedAchievements(): Promise<
  UnlockedAchievement[]
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return readCache();

  const { data, error } = await supabase
    .from('achievements')
    .select('achievement_id, unlocked_at')
    .eq('user_id', user.id)
    .order('unlocked_at', { ascending: true });

  if (error) {
    console.warn('loadUnlockedAchievements error:', error);
    return readCache();
  }

  const achievements: UnlockedAchievement[] = (data ?? []).map((row) => ({
    id: row.achievement_id as string,
    unlockedAt: row.unlocked_at as string,
  }));

  writeCache(achievements);
  return achievements;
}

// ── Unlock a single achievement ───────────────────────────────────────────────

export async function unlockAchievement(
  achievementId: string,
): Promise<boolean> {
  // Check cache first — already unlocked?
  const cached = readCache();
  if (cached.some((a) => a.id === achievementId)) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const now = getLocalDateKey();

  // Optimistic update cache
  const newEntry: UnlockedAchievement = { id: achievementId, unlockedAt: now };
  writeCache([...cached, newEntry]);

  if (user) {
    const { error } = await supabase
      .from('achievements')
      .upsert(
        { user_id: user.id, achievement_id: achievementId, unlocked_at: now },
        { onConflict: 'user_id,achievement_id' },
      );
    if (error) console.warn('unlockAchievement error:', error);
  }

  emit();
  return true; // newly unlocked
}

// ── Clear user achievements cache on sign-out ─────────────────────────────────

export function clearAchievementsCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}
