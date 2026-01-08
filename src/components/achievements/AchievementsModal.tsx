import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StreakDisplay } from './StreakDisplay';
import { format } from 'date-fns';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
}

interface UserAchievement {
  achievement_id: string;
  earned_at: string;
}

interface Streak {
  current_streak: number;
  longest_streak: number;
  total_active_days: number;
}

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  streak: Streak | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  engagement: '💬 Engagement',
  wellness: '😊 Wellness',
  journaling: '📝 Journaling',
  streaks: '🔥 Streaks',
  exercises: '🧘 Exercises',
  meditation: '☯️ Meditation',
  goals: '🎯 Goals',
};

export function AchievementsModal({
  isOpen,
  onClose,
  achievements,
  userAchievements,
  streak,
}: AchievementsModalProps) {
  const earnedIds = new Set(userAchievements.map(ua => ua.achievement_id));
  const earnedCount = earnedIds.size;
  const totalPoints = achievements
    .filter(a => earnedIds.has(a.id))
    .reduce((sum, a) => sum + a.points, 0);

  const categories = [...new Set(achievements.map(a => a.category))];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Achievements</h2>
                  <p className="text-sm text-muted-foreground">
                    {earnedCount}/{achievements.length} unlocked • {totalPoints} points
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
              {/* Streak Display */}
              {streak && (
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Your Streak
                  </h3>
                  <StreakDisplay
                    currentStreak={streak.current_streak}
                    longestStreak={streak.longest_streak}
                    totalDays={streak.total_active_days}
                  />
                </div>
              )}

              {/* Achievements by Category */}
              {categories.map((category) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    {CATEGORY_LABELS[category] || category}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {achievements
                      .filter(a => a.category === category)
                      .map((achievement, index) => {
                        const isEarned = earnedIds.has(achievement.id);
                        const earnedData = userAchievements.find(ua => ua.achievement_id === achievement.id);

                        return (
                          <motion.div
                            key={achievement.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`relative rounded-xl p-4 border transition-all ${
                              isEarned
                                ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30'
                                : 'bg-muted/30 border-border opacity-60'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`text-3xl ${!isEarned && 'grayscale'}`}>
                                {achievement.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-foreground text-sm truncate">
                                    {achievement.name}
                                  </h4>
                                  {!isEarned && <Lock className="w-3 h-3 text-muted-foreground" />}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {achievement.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-background">
                                    {achievement.points} pts
                                  </span>
                                  {isEarned && earnedData && (
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(earnedData.earned_at), 'MMM d, yyyy')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
