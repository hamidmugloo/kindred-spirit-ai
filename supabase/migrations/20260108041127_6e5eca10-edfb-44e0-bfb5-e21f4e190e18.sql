-- Create user_streaks table to track daily activity
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  total_active_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create achievements table (system-defined achievements)
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Create wellness_goals table
CREATE TABLE public.wellness_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  target_value INTEGER NOT NULL DEFAULT 1,
  current_value INTEGER NOT NULL DEFAULT 0,
  target_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_streaks
CREATE POLICY "Users can view their own streaks" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own streaks" ON public.user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own streaks" ON public.user_streaks FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for achievements (readable by all authenticated users)
CREATE POLICY "Achievements are viewable by authenticated users" ON public.achievements FOR SELECT TO authenticated USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for wellness_goals
CREATE POLICY "Users can view their own goals" ON public.wellness_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own goals" ON public.wellness_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.wellness_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.wellness_goals FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_user_streaks_updated_at BEFORE UPDATE ON public.user_streaks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wellness_goals_updated_at BEFORE UPDATE ON public.wellness_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value, points) VALUES
('First Steps', 'Complete your first chat session', '👋', 'engagement', 'conversations', 1, 10),
('Consistent Chatter', 'Have 10 conversations', '💬', 'engagement', 'conversations', 10, 25),
('Deep Diver', 'Have 50 conversations', '🌊', 'engagement', 'conversations', 50, 50),
('Mood Tracker', 'Log your mood for the first time', '😊', 'wellness', 'mood_entries', 1, 10),
('Mood Master', 'Log your mood 7 days in a row', '🎯', 'wellness', 'mood_streak', 7, 30),
('Journal Starter', 'Write your first journal entry', '📝', 'journaling', 'journal_entries', 1, 10),
('Reflective Soul', 'Write 10 journal entries', '📖', 'journaling', 'journal_entries', 10, 25),
('Prolific Writer', 'Write 30 journal entries', '✍️', 'journaling', 'journal_entries', 30, 50),
('Week Warrior', 'Maintain a 7-day streak', '🔥', 'streaks', 'streak', 7, 30),
('Month Champion', 'Maintain a 30-day streak', '🏆', 'streaks', 'streak', 30, 100),
('Breath of Fresh Air', 'Complete a breathing exercise', '🌬️', 'exercises', 'breathing', 1, 10),
('Grounded', 'Complete a grounding exercise', '🌳', 'exercises', 'grounding', 1, 10),
('Meditation Beginner', 'Complete your first meditation', '🧘', 'meditation', 'meditation', 1, 10),
('Zen Master', 'Complete 20 meditation sessions', '☯️', 'meditation', 'meditation', 20, 50),
('Goal Setter', 'Create your first wellness goal', '🎯', 'goals', 'goals_created', 1, 10),
('Goal Crusher', 'Complete 5 wellness goals', '💪', 'goals', 'goals_completed', 5, 40);