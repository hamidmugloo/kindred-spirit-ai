import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  mood_tag: string | null;
  prompt: string | null;
  created_at: string;
}

interface JournalListProps {
  entries: JournalEntry[];
  onDelete: (id: string) => void;
}

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  calm: '😌',
  sad: '😔',
  anxious: '😰',
  frustrated: '😤',
  reflective: '🤔',
  motivated: '💪',
  tired: '😴',
};

export function JournalList({ entries, onDelete }: JournalListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No journal entries yet</h3>
        <p className="text-sm text-muted-foreground">
          Start writing to capture your thoughts and feelings
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {entry.mood_tag && (
                <span className="text-2xl">{MOOD_EMOJIS[entry.mood_tag] || '📝'}</span>
              )}
              <div>
                <h3 className="font-medium text-foreground">
                  {entry.title || 'Untitled Entry'}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(entry.created_at), 'MMM d, yyyy • h:mm a')}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(entry.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {entry.prompt && (
            <p className="text-xs text-muted-foreground italic mb-2 bg-muted/50 rounded-lg px-3 py-2">
              Prompt: {entry.prompt}
            </p>
          )}

          <p className="text-sm text-foreground/80 whitespace-pre-wrap line-clamp-4">
            {entry.content}
          </p>

          {entry.mood_tag && (
            <div className="mt-3 pt-3 border-t border-border">
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                {entry.mood_tag}
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
