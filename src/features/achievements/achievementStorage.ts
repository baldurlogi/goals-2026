import { supabase } from '@/lib/supabaseClient';
import type { UnlockedAchievement } from './achievementTypes';
import { getLocalDateKey } from '@/hooks/useTodayDate';

export const ACHIEVEMENTS_CHANGED_EVENT = 'achievements:changed';

const emit = () => window.dispatchEvent(new Event(ACHIEVEMENTS_CHANGED_EVENT));
const CACHE_KEY = 'cache:achievements:v1';

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

  writeCache(achievements);
  return achievements;
}

export async function unlockAchievement(
  achievementId: string,
): Promise<boolean> {
  const cached = readCache();
  if (cached.some((a) => a.id === achievementId)) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = getLocalDateKey();
  const newEntry: UnlockedAchievement = { id: achievementId, unlockedAt: now };

  writeCache([...cached, newEntry]);

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
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}
