import { supabase } from '@/lib/supabaseClient';
import { CACHE_KEYS, assertRegisteredCacheWrite } from '@/lib/cacheRegistry';
import { getActiveUserId, scopedKey } from '@/lib/activeUser';
import type { UnlockedAchievement } from './achievementTypes';
import { getLocalDateKey } from '@/hooks/useTodayDate';

export const ACHIEVEMENTS_CHANGED_EVENT = 'achievements:changed';

const emit = () => window.dispatchEvent(new Event(ACHIEVEMENTS_CHANGED_EVENT));
const CACHE_KEY = CACHE_KEYS.ACHIEVEMENTS;

function scopedAchievementsKey(userId: string | null = getActiveUserId()) {
  return scopedKey(CACHE_KEY, userId);
}

function readCache(userId: string | null = getActiveUserId()): UnlockedAchievement[] {
  try {
    const raw = localStorage.getItem(scopedAchievementsKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCache(achievements: UnlockedAchievement[], userId: string | null = getActiveUserId()) {
  try {
    assertRegisteredCacheWrite(scopedAchievementsKey(userId));
    localStorage.setItem(scopedAchievementsKey(userId), JSON.stringify(achievements));
  } catch {
    // ignore
  }
}

export function seedAchievements(): UnlockedAchievement[] {
  return readCache();
}

export async function loadUnlockedAchievements(): Promise<UnlockedAchievement[]> {
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

  writeCache(achievements, user.id);
  return achievements;
}

export async function unlockAchievement(
  achievementId: string,
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cached = readCache(user?.id ?? getActiveUserId());
  if (cached.some((a) => a.id === achievementId)) return false;

  const now = getLocalDateKey();
  const newEntry: UnlockedAchievement = { id: achievementId, unlockedAt: now };

  writeCache([...cached, newEntry], user?.id ?? getActiveUserId());

  if (user) {
    const { error } = await supabase.from('achievements').upsert(
      {
        user_id: user.id,
        achievement_id: achievementId,
        unlocked_at: now,
      },
      { onConflict: 'user_id,achievement_id' },
    );

    if (error) {
      console.warn('unlockAchievement error:', error);
    }
  }

  emit();
  return true;
}

export function clearAchievementsCache() {
  try {
    localStorage.removeItem(scopedAchievementsKey());
  } catch {
    // ignore
  }
}
