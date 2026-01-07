import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, BookOpen, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JournalEntry } from './JournalEntry';
import { JournalList } from './JournalList';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface JournalEntryType {
  id: string;
  title: string | null;
  content: string;
  mood_tag: string | null;
  prompt: string | null;
  created_at: string;
}

export function JournalModal({ isOpen, onClose }: JournalModalProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewEntry, setShowNewEntry] = useState(false);

  const fetchEntries = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchEntries();
    }
  }, [isOpen, user]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setEntries(entries.filter(e => e.id !== id));
      toast.success('Entry deleted');
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  const thisWeekEntries = entries.filter(e => {
    const entryDate = new Date(e.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return entryDate >= weekAgo;
  });

  const moodDistribution = entries.reduce((acc, entry) => {
    if (entry.mood_tag) {
      acc[entry.mood_tag] = (acc[entry.mood_tag] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topMood = Object.entries(moodDistribution).sort((a, b) => b[1] - a[1])[0];

  return (
    <>
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
              className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-sage-light/50 to-lavender-light/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">My Journal</h2>
                    <p className="text-sm text-muted-foreground">{entries.length} entries</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setShowNewEntry(true)} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    New Entry
                  </Button>
                  <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="px-6 py-4 bg-muted/30 border-b border-border">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">This week:</span>
                    <span className="text-sm font-medium text-foreground">{thisWeekEntries.length} entries</span>
                  </div>
                  {topMood && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Most common mood:</span>
                      <span className="text-sm font-medium text-foreground capitalize">{topMood[0]}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : (
                  <JournalList entries={entries} onDelete={handleDelete} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <JournalEntry
        isOpen={showNewEntry}
        onClose={() => setShowNewEntry(false)}
        onSaved={fetchEntries}
      />
    </>
  );
}
