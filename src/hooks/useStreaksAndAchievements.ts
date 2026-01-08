import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Streak {
  current_streak: number;
  longest_streak: number;
  total_active_days: number;
  last_activity_date: string | null;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  points: number;
}

interface UserAchievement {
  achievement_id: string;
  earned_at: string;
}

export function useStreaksAndAchievements() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<Streak | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const [streakRes, achievementsRes, userAchievementsRes] = await Promise.all([
        supabase.from('user_streaks').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('achievements').select('*').order('points', { ascending: true }),
        supabase.from('user_achievements').select('achievement_id, earned_at').eq('user_id', user.id),
      ]);

      if (streakRes.data) {
        setStreak(streakRes.data);
      }
      if (achievementsRes.data) {
        setAchievements(achievementsRes.data);
      }
      if (userAchievementsRes.data) {
        setUserAchievements(userAchievementsRes.data);
      }
    } catch (error) {
      console.error('Error fetching streaks/achievements:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStreak = useCallback(async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      const { data: existingStreak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingStreak) {
        // Create new streak record
        const { error } = await supabase.from('user_streaks').insert({
          user_id: user.id,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
          total_active_days: 1,
        });
        if (!error) {
          setStreak({
            current_streak: 1,
            longest_streak: 1,
            total_active_days: 1,
            last_activity_date: today,
          });
        }
      } else if (existingStreak.last_activity_date !== today) {
        const lastDate = new Date(existingStreak.last_activity_date);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        let newStreak = existingStreak.current_streak;
        if (diffDays === 1) {
          newStreak = existingStreak.current_streak + 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }

        const newLongest = Math.max(newStreak, existingStreak.longest_streak);

        const { error } = await supabase
          .from('user_streaks')
          .update({
            current_streak: newStreak,
            longest_streak: newLongest,
            last_activity_date: today,
            total_active_days: existingStreak.total_active_days + 1,
          })
          .eq('user_id', user.id);

        if (!error) {
          setStreak({
            current_streak: newStreak,
            longest_streak: newLongest,
            total_active_days: existingStreak.total_active_days + 1,
            last_activity_date: today,
          });
        }
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  }, [user]);

  const checkAndAwardAchievements = useCallback(async (stats: {
    conversations?: number;
    mood_entries?: number;
    journal_entries?: number;
    meditation?: number;
    breathing?: number;
    grounding?: number;
    goals_created?: number;
    goals_completed?: number;
  }) => {
    if (!user || achievements.length === 0) return;

    const currentStreak = streak?.current_streak || 0;
    const earnedIds = new Set(userAchievements.map(ua => ua.achievement_id));

    for (const achievement of achievements) {
      if (earnedIds.has(achievement.id)) continue;

      let qualified = false;

      switch (achievement.requirement_type) {
        case 'conversations':
          qualified = (stats.conversations || 0) >= achievement.requirement_value;
          break;
        case 'mood_entries':
          qualified = (stats.mood_entries || 0) >= achievement.requirement_value;
          break;
        case 'journal_entries':
          qualified = (stats.journal_entries || 0) >= achievement.requirement_value;
          break;
        case 'streak':
          qualified = currentStreak >= achievement.requirement_value;
          break;
        case 'meditation':
          qualified = (stats.meditation || 0) >= achievement.requirement_value;
          break;
        case 'breathing':
          qualified = (stats.breathing || 0) >= achievement.requirement_value;
          break;
        case 'grounding':
          qualified = (stats.grounding || 0) >= achievement.requirement_value;
          break;
        case 'goals_created':
          qualified = (stats.goals_created || 0) >= achievement.requirement_value;
          break;
        case 'goals_completed':
          qualified = (stats.goals_completed || 0) >= achievement.requirement_value;
          break;
      }

      if (qualified) {
        const { error } = await supabase.from('user_achievements').insert({
          user_id: user.id,
          achievement_id: achievement.id,
        });

        if (!error) {
          toast.success(`🏆 Achievement Unlocked: ${achievement.name}!`, {
            description: achievement.description,
          });
          setUserAchievements(prev => [...prev, { achievement_id: achievement.id, earned_at: new Date().toISOString() }]);
        }
      }
    }
  }, [user, achievements, userAchievements, streak]);

  return {
    streak,
    achievements,
    userAchievements,
    loading,
    updateStreak,
    checkAndAwardAchievements,
    refetch: fetchData,
  };
}
