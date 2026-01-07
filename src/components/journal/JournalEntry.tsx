import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface JournalEntryProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const JOURNAL_PROMPTS = [
  "What are three things you're grateful for today? 🙏",
  "How are you feeling right now, and why? 💭",
  "What's one thing you learned about yourself today? 🌱",
  "Describe a moment that made you smile recently 😊",
  "What's weighing on your mind? Let it out here 💫",
  "What would make tomorrow a great day? ✨",
  "Write a letter to your future self 📝",
  "What's one small win you had today? 🏆",
];

const MOOD_TAGS = [
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '😌', label: 'Calm', value: 'calm' },
  { emoji: '😔', label: 'Sad', value: 'sad' },
  { emoji: '😰', label: 'Anxious', value: 'anxious' },
  { emoji: '😤', label: 'Frustrated', value: 'frustrated' },
  { emoji: '🤔', label: 'Reflective', value: 'reflective' },
  { emoji: '💪', label: 'Motivated', value: 'motivated' },
  { emoji: '😴', label: 'Tired', value: 'tired' },
];

export function JournalEntry({ isOpen, onClose, onSaved }: JournalEntryProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [saving, setSaving] = useState(false);

  const generatePrompt = () => {
    const randomPrompt = JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)];
    setCurrentPrompt(randomPrompt);
  };

  const handleSave = async () => {
    if (!content.trim() || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('journal_entries').insert({
        user_id: user.id,
        title: title.trim() || null,
        content: content.trim(),
        mood_tag: selectedMood,
        prompt: currentPrompt || null,
      });

      if (error) throw error;

      toast.success('Journal entry saved! 📝');
      setTitle('');
      setContent('');
      setSelectedMood(null);
      setCurrentPrompt('');
      onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast.error('Failed to save entry');
    } finally {
      setSaving(false);
    }
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
            <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-sage-light/50 to-lavender-light/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">New Journal Entry</h2>
                  <p className="text-sm text-muted-foreground">Express your thoughts freely</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Prompt Generator */}
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Need inspiration?</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generatePrompt}
                    className="text-primary hover:text-primary/80"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Get Prompt
                  </Button>
                </div>
                {currentPrompt && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-muted-foreground italic bg-background/50 rounded-lg p-3"
                  >
                    {currentPrompt}
                  </motion.p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Title (optional)
                </label>
                <Input
                  placeholder="Give your entry a title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              {/* Mood Tags */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  How are you feeling?
                </label>
                <div className="flex flex-wrap gap-2">
                  {MOOD_TAGS.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => setSelectedMood(selectedMood === mood.value ? null : mood.value)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                        selectedMood === mood.value
                          ? 'bg-primary text-primary-foreground scale-105'
                          : 'bg-muted hover:bg-muted/80 text-foreground'
                      }`}
                    >
                      {mood.emoji} {mood.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Your thoughts
                </label>
                <Textarea
                  placeholder="Write freely... This is your safe space 💫"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px] bg-background/50 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border bg-muted/30">
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!content.trim() || saving}
                  className="bg-primary hover:bg-primary/90"
                >
                  {saving ? (
                    'Saving...'
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Save Entry
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
