import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Brain, Trash2, User, Target, BookOpen, Heart, Loader2 } from 'lucide-react';

interface Memory {
  id: string;
  memory_type: string;
  memory_key: string;
  memory_value: string;
  created_at: string;
  updated_at: string;
}

interface MemoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const memoryTypeIcons: Record<string, React.ReactNode> = {
  name: <User className="w-4 h-4" />,
  preference: <Heart className="w-4 h-4" />,
  goal: <Target className="w-4 h-4" />,
  challenge: <BookOpen className="w-4 h-4" />,
  interest: <Brain className="w-4 h-4" />,
};

const memoryKeyLabels: Record<string, string> = {
  user_name: 'Your Name',
  study_interest: 'Study Interests',
  career_goal: 'Career Goals',
  learning_style: 'Learning Style',
  wellness_focus: 'Wellness Focus',
  ongoing_challenge: 'Current Challenges',
  long_term_goal: 'Long-term Goals',
  recurring_topic: 'Recurring Topics',
};

export const MemoryManagementModal: React.FC<MemoryManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchMemories = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching memories:', error);
      toast.error('Failed to load memories');
    } else {
      setMemories(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchMemories();
    }
  }, [isOpen, user]);

  const handleDeleteMemory = async (memoryId: string) => {
    setDeleting(memoryId);
    
    const { error } = await supabase
      .from('user_memories')
      .delete()
      .eq('id', memoryId);

    if (error) {
      console.error('Error deleting memory:', error);
      toast.error('Failed to delete memory');
    } else {
      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
      toast.success('Memory deleted');
    }
    setDeleting(null);
  };

  const handleClearAll = async () => {
    if (!user) return;
    
    const confirmed = window.confirm('Are you sure you want to delete all stored preferences? This cannot be undone.');
    if (!confirmed) return;

    const { error } = await supabase
      .from('user_memories')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error clearing memories:', error);
      toast.error('Failed to clear memories');
    } else {
      setMemories([]);
      toast.success('All memories cleared');
    }
  };

  const getLabel = (key: string) => memoryKeyLabels[key] || key.replace(/_/g, ' ');
  const getIcon = (type: string) => memoryTypeIcons[type] || <Brain className="w-4 h-4" />;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Memory & Preferences
          </DialogTitle>
          <DialogDescription>
            MindfulAI remembers these details to personalize your experience. You can delete any item at any time.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No memories stored yet.</p>
              <p className="text-xs mt-1">
                Share your name, interests, or goals and MindfulAI will remember them.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {memories.map((memory) => (
                  <motion.div
                    key={memory.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                  >
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      {getIcon(memory.memory_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {getLabel(memory.memory_key)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {memory.memory_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground truncate">
                        {memory.memory_value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated {new Date(memory.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteMemory(memory.id)}
                      disabled={deleting === memory.id}
                    >
                      {deleting === memory.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {memories.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              {memories.length} item{memories.length !== 1 ? 's' : ''} stored
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAll}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
