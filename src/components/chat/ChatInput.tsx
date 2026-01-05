import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isLoading,
  placeholder = "Share what's on your mind... 💭",
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <motion.div 
        animate={{ 
          boxShadow: isFocused 
            ? '0 0 30px -5px hsl(158 35% 45% / 0.2)' 
            : '0 4px 20px -4px hsl(220 15% 20% / 0.08)'
        }}
        className={cn(
          'relative bg-gradient-to-br from-card via-card to-muted/20 border rounded-3xl overflow-hidden transition-all duration-300',
          isFocused ? 'border-primary/40 ring-2 ring-primary/10' : 'border-border/50'
        )}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-sage/5 via-transparent to-lavender/5 pointer-events-none" />
        
        <div className="relative flex items-end gap-2 p-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            rows={1}
            disabled={isLoading}
            className={cn(
              'flex-1 resize-none bg-transparent px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none text-sm leading-relaxed',
              'min-h-[48px] max-h-[150px]'
            )}
          />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={isLoading ? 'loading' : message.trim() ? 'ready' : 'empty'}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                type="submit"
                size="icon"
                disabled={!message.trim() || isLoading}
                className={cn(
                  'h-11 w-11 rounded-2xl transition-all duration-300',
                  message.trim() && !isLoading 
                    ? 'bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-medium' 
                    : ''
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center gap-2 mt-3"
      >
        <Sparkles className="w-3 h-3 text-sage" />
        <p className="text-xs text-muted-foreground">
          Press Enter to send • Shift+Enter for new line
        </p>
        <Sparkles className="w-3 h-3 text-lavender" />
      </motion.div>
    </form>
  );
};
