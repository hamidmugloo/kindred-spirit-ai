-- Create mood_entries table for mood tracking
CREATE TABLE public.mood_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mood TEXT NOT NULL,
  mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 5),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for mood_entries
CREATE POLICY "Users can view their own mood entries" 
ON public.mood_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mood entries" 
ON public.mood_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood entries" 
ON public.mood_entries 
FOR DELETE 
USING (auth.uid() = user_id);