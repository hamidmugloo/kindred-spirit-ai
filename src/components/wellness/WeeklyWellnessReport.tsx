import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Minus, Calendar, MessageCircle, BookOpen, Brain, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

interface WeeklyWellnessReportProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WeeklyStats {
  totalConversations: number;
  totalMessages: number;
  journalEntries: number;
  moodEntries: number;
  averageMood: number;
  moodTrend: 'up' | 'down' | 'stable';
  topMoods: { mood: string; count: number }[];
  journalMoods: { mood: string; count: number }[];
}

const MOOD_EMOJIS: Record<number, string> = {
  1: '😢',
  2: '😔',
  3: '😐',
  4: '🙂',
  5: '😊',
};

const MOOD_LABELS: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Great',
};

export function WeeklyWellnessReport({ isOpen, onClose }: WeeklyWellnessReportProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  useEffect(() => {
    const fetchWeeklyStats = async () => {
      if (!user || !isOpen) return;

      setLoading(true);
      try {
        const weekAgo = subDays(new Date(), 7).toISOString();
        const twoWeeksAgo = subDays(new Date(), 14).toISOString();

        // Fetch all data in parallel
        const [conversationsRes, messagesRes, journalRes, moodRes, prevMoodRes] = await Promise.all([
          supabase
            .from('conversations')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .gte('created_at', weekAgo),
          supabase
            .from('messages')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .gte('created_at', weekAgo),
          supabase
            .from('journal_entries')
            .select('mood_tag')
            .eq('user_id', user.id)
            .gte('created_at', weekAgo),
          supabase
            .from('mood_entries')
            .select('mood_score, mood')
            .eq('user_id', user.id)
            .gte('created_at', weekAgo),
          supabase
            .from('mood_entries')
            .select('mood_score')
            .eq('user_id', user.id)
            .gte('created_at', twoWeeksAgo)
            .lt('created_at', weekAgo),
        ]);

        // Calculate mood stats
        const moodData = moodRes.data || [];
        const prevMoodData = prevMoodRes.data || [];
        
        const avgMood = moodData.length > 0
          ? moodData.reduce((sum, m) => sum + m.mood_score, 0) / moodData.length
          : 0;
        
        const prevAvgMood = prevMoodData.length > 0
          ? prevMoodData.reduce((sum, m) => sum + m.mood_score, 0) / prevMoodData.length
          : 0;

        let moodTrend: 'up' | 'down' | 'stable' = 'stable';
        if (avgMood > prevAvgMood + 0.3) moodTrend = 'up';
        else if (avgMood < prevAvgMood - 0.3) moodTrend = 'down';

        // Count moods
        const moodCounts = moodData.reduce((acc, m) => {
          acc[m.mood] = (acc[m.mood] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topMoods = Object.entries(moodCounts)
          .map(([mood, count]) => ({ mood, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        // Count journal moods
        const journalData = journalRes.data || [];
        const journalMoodCounts = journalData.reduce((acc, j) => {
          if (j.mood_tag) {
            acc[j.mood_tag] = (acc[j.mood_tag] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        const journalMoods = Object.entries(journalMoodCounts)
          .map(([mood, count]) => ({ mood, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        setStats({
          totalConversations: conversationsRes.count || 0,
          totalMessages: messagesRes.count || 0,
          journalEntries: journalData.length,
          moodEntries: moodData.length,
          averageMood: avgMood,
          moodTrend,
          topMoods,
          journalMoods,
        });
      } catch (error) {
        console.error('Error fetching weekly stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyStats();
  }, [user, isOpen]);

  const getTrendIcon = () => {
    if (!stats) return null;
    switch (stats.moodTrend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getInsight = () => {
    if (!stats) return '';
    
    if (stats.moodTrend === 'up') {
      return "🌟 Your mood has been improving this week! Keep up the great self-care practices.";
    } else if (stats.moodTrend === 'down') {
      return "💙 This week has been challenging. Remember, it's okay to not be okay. Consider reaching out for support.";
    } else if (stats.journalEntries > 3) {
      return "📝 You've been journaling consistently! Writing helps process emotions and build self-awareness.";
    } else if (stats.totalConversations > 0) {
      return "💬 You've been actively using MindfulAI. Talking through your feelings is a healthy practice.";
    }
    return "✨ Start tracking your mood and journaling to get personalized insights!";
  };

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
            <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/10 via-accent/10 to-sage-light/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Weekly Wellness Report</h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : stats ? (
                <div className="space-y-6">
                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-sage-light to-sage-light/50 rounded-xl p-4 text-center"
                    >
                      <MessageCircle className="w-6 h-6 mx-auto mb-2 text-sage" />
                      <p className="text-2xl font-bold text-foreground">{stats.totalConversations}</p>
                      <p className="text-xs text-muted-foreground">Conversations</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="bg-gradient-to-br from-lavender-light to-lavender-light/50 rounded-xl p-4 text-center"
                    >
                      <Brain className="w-6 h-6 mx-auto mb-2 text-accent-foreground" />
                      <p className="text-2xl font-bold text-foreground">{stats.totalMessages}</p>
                      <p className="text-xs text-muted-foreground">Messages</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 text-center"
                    >
                      <BookOpen className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold text-foreground">{stats.journalEntries}</p>
                      <p className="text-xs text-muted-foreground">Journal Entries</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/20 dark:to-orange-800/10 rounded-xl p-4 text-center"
                    >
                      <Heart className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                      <p className="text-2xl font-bold text-foreground">{stats.moodEntries}</p>
                      <p className="text-xs text-muted-foreground">Mood Check-ins</p>
                    </motion.div>
                  </div>

                  {/* Mood Overview */}
                  {stats.averageMood > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-muted/50 rounded-xl p-5"
                    >
                      <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Mood Overview
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-5xl">
                            {MOOD_EMOJIS[Math.round(stats.averageMood)] || '😐'}
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-foreground">
                              Average: {stats.averageMood.toFixed(1)}/5
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {MOOD_LABELS[Math.round(stats.averageMood)] || 'Neutral'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 bg-background rounded-lg px-4 py-2">
                          {getTrendIcon()}
                          <span className="text-sm font-medium capitalize">{stats.moodTrend}</span>
                        </div>
                      </div>

                      {stats.topMoods.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-sm text-muted-foreground mb-2">Most logged moods:</p>
                          <div className="flex flex-wrap gap-2">
                            {stats.topMoods.map((m, i) => (
                              <span
                                key={m.mood}
                                className="px-3 py-1 bg-background rounded-full text-sm"
                              >
                                {m.mood} ({m.count}x)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Journal Insights */}
                  {stats.journalMoods.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="bg-muted/50 rounded-xl p-5"
                    >
                      <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        Journal Mood Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {stats.journalMoods.map((m) => (
                          <span
                            key={m.mood}
                            className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm capitalize"
                          >
                            {m.mood} ({m.count}x)
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Personalized Insight */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-primary/10 via-accent/5 to-sage-light/30 rounded-xl p-5 border border-primary/20"
                  >
                    <h3 className="font-medium text-foreground mb-2">Weekly Insight</h3>
                    <p className="text-sm text-muted-foreground">{getInsight()}</p>
                  </motion.div>

                  {/* Encouragement */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="text-center py-4"
                  >
                    <p className="text-sm text-muted-foreground">
                      Keep nurturing your mental wellness journey. Every step counts! 🌱
                    </p>
                  </motion.div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No data available for this week</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
