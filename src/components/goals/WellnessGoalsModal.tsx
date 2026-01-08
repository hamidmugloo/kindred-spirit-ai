import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Target, Check, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface WellnessGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalCreated?: () => void;
  onGoalCompleted?: () => void;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  target_value: number;
  current_value: number;
  target_date: string | null;
  is_completed: boolean;
  created_at: string;
}

const GOAL_CATEGORIES = [
  { value: 'mindfulness', label: '🧘 Mindfulness', color: 'from-purple-500/20 to-indigo-500/20' },
  { value: 'journaling', label: '📝 Journaling', color: 'from-blue-500/20 to-cyan-500/20' },
  { value: 'mood', label: '😊 Mood', color: 'from-yellow-500/20 to-amber-500/20' },
  { value: 'self-care', label: '💝 Self-Care', color: 'from-pink-500/20 to-rose-500/20' },
  { value: 'exercise', label: '💪 Exercise', color: 'from-green-500/20 to-emerald-500/20' },
  { value: 'sleep', label: '😴 Sleep', color: 'from-indigo-500/20 to-violet-500/20' },
  { value: 'social', label: '👥 Social', color: 'from-orange-500/20 to-red-500/20' },
  { value: 'growth', label: '🌱 Growth', color: 'from-teal-500/20 to-green-500/20' },
];

export function WellnessGoalsModal({ isOpen, onClose, onGoalCreated, onGoalCompleted }: WellnessGoalsModalProps) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'mindfulness',
    target_value: 1,
    target_date: '',
  });

  const fetchGoals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('wellness_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('is_completed', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchGoals();
    }
  }, [isOpen, user]);

  const handleCreateGoal = async () => {
    if (!user || !newGoal.title.trim()) return;

    try {
      const { error } = await supabase.from('wellness_goals').insert({
        user_id: user.id,
        title: newGoal.title.trim(),
        description: newGoal.description.trim() || null,
        category: newGoal.category,
        target_value: newGoal.target_value,
        target_date: newGoal.target_date || null,
      });

      if (error) throw error;

      toast.success('Goal created! 🎯');
      setNewGoal({ title: '', description: '', category: 'mindfulness', target_value: 1, target_date: '' });
      setShowNewGoal(false);
      onGoalCreated?.();
      fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
    }
  };

  const handleUpdateProgress = async (goal: Goal, increment: number) => {
    const newValue = Math.max(0, Math.min(goal.target_value, goal.current_value + increment));
    const isCompleted = newValue >= goal.target_value;

    try {
      const { error } = await supabase
        .from('wellness_goals')
        .update({
          current_value: newValue,
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', goal.id);

      if (error) throw error;

      if (isCompleted && !goal.is_completed) {
        toast.success('🎉 Goal completed! Amazing work!');
        onGoalCompleted?.();
      }

      fetchGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      const { error } = await supabase.from('wellness_goals').delete().eq('id', id);
      if (error) throw error;
      toast.success('Goal deleted');
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

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
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Wellness Goals</h2>
                  <p className="text-sm text-muted-foreground">
                    {activeGoals.length} active • {completedGoals.length} completed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setShowNewGoal(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  New Goal
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <>
                  {/* New Goal Form */}
                  <AnimatePresence>
                    {showNewGoal && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-muted/50 rounded-xl p-5 space-y-4"
                      >
                        <h3 className="font-medium text-foreground">Create New Goal</h3>
                        
                        <Input
                          placeholder="Goal title (e.g., Meditate daily for a week)"
                          value={newGoal.title}
                          onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                        />
                        
                        <Textarea
                          placeholder="Description (optional)"
                          value={newGoal.description}
                          onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                          className="resize-none"
                          rows={2}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-muted-foreground mb-2 block">Category</label>
                            <select
                              value={newGoal.category}
                              onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            >
                              {GOAL_CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground mb-2 block">Target (days/times)</label>
                            <Input
                              type="number"
                              min={1}
                              max={365}
                              value={newGoal.target_value}
                              onChange={(e) => setNewGoal({ ...newGoal, target_value: parseInt(e.target.value) || 1 })}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm text-muted-foreground mb-2 block">Target Date (optional)</label>
                          <Input
                            type="date"
                            value={newGoal.target_date}
                            onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowNewGoal(false)}>Cancel</Button>
                          <Button onClick={handleCreateGoal} disabled={!newGoal.title.trim()}>
                            Create Goal
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Active Goals */}
                  {activeGoals.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Active Goals
                      </h3>
                      <div className="space-y-3">
                        {activeGoals.map((goal, index) => {
                          const category = GOAL_CATEGORIES.find(c => c.value === goal.category);
                          const progress = (goal.current_value / goal.target_value) * 100;

                          return (
                            <motion.div
                              key={goal.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`bg-gradient-to-br ${category?.color || 'from-muted to-muted/50'} rounded-xl p-4 border border-border`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-medium text-foreground">{goal.title}</h4>
                                  {goal.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteGoal(goal.id)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="flex items-center gap-3 mb-2">
                                <Progress value={progress} className="flex-1 h-2" />
                                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                                  {goal.current_value}/{goal.target_value}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="px-2 py-0.5 bg-background/50 rounded-full">
                                    {category?.label}
                                  </span>
                                  {goal.target_date && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {format(new Date(goal.target_date), 'MMM d')}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateProgress(goal, -1)}
                                    disabled={goal.current_value <= 0}
                                    className="h-7 w-7 p-0"
                                  >
                                    -
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdateProgress(goal, 1)}
                                    disabled={goal.current_value >= goal.target_value}
                                    className="h-7 w-7 p-0"
                                  >
                                    +
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Completed Goals */}
                  {completedGoals.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        Completed ({completedGoals.length})
                      </h3>
                      <div className="space-y-2">
                        {completedGoals.slice(0, 5).map((goal) => (
                          <div
                            key={goal.id}
                            className="bg-green-500/10 rounded-lg p-3 border border-green-500/20 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-foreground">{goal.title}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {goals.length === 0 && !showNewGoal && (
                    <div className="text-center py-12">
                      <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No goals yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Set wellness goals to track your progress
                      </p>
                      <Button onClick={() => setShowNewGoal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Goal
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
