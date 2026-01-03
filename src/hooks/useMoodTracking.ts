import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MoodEntry {
  id: string;
  mood: string;
  moodScore: number;
  note?: string;
  createdAt: Date;
}

export const MOODS = [
  { emoji: '😢', label: 'Very Sad', score: 1 },
  { emoji: '😔', label: 'Sad', score: 2 },
  { emoji: '😐', label: 'Neutral', score: 3 },
  { emoji: '🙂', label: 'Good', score: 4 },
  { emoji: '😊', label: 'Great', score: 5 },
];

export const useMoodTracking = () => {
  const { user } = useAuth();
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [todayMood, setTodayMood] = useState<MoodEntry | null>(null);

  const loadMoodEntries = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      
      if (error) throw error;
      
      const entries = data.map((entry) => ({
        id: entry.id,
        mood: entry.mood,
        moodScore: entry.mood_score,
        note: entry.note || undefined,
        createdAt: new Date(entry.created_at),
      }));
      
      setMoodEntries(entries);
      
      // Check if there's a mood entry for today
      const today = new Date();
      const todayEntry = entries.find((entry) => {
        const entryDate = new Date(entry.createdAt);
        return (
          entryDate.getDate() === today.getDate() &&
          entryDate.getMonth() === today.getMonth() &&
          entryDate.getFullYear() === today.getFullYear()
        );
      });
      setTodayMood(todayEntry || null);
    } catch (error) {
      console.error('Error loading mood entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMoodEntries();
  }, [loadMoodEntries]);

  const logMood = async (mood: string, moodScore: number, note?: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .insert({
          user_id: user.id,
          mood,
          mood_score: moodScore,
          note,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const newEntry: MoodEntry = {
        id: data.id,
        mood: data.mood,
        moodScore: data.mood_score,
        note: data.note || undefined,
        createdAt: new Date(data.created_at),
      };
      
      setMoodEntries((prev) => [newEntry, ...prev]);
      setTodayMood(newEntry);
      toast.success('Mood logged successfully');
    } catch (error) {
      console.error('Error logging mood:', error);
      toast.error('Failed to log mood');
    }
  };

  return {
    moodEntries,
    todayMood,
    isLoading,
    logMood,
    loadMoodEntries,
  };
};
