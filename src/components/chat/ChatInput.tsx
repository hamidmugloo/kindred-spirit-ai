import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Sparkles, MessageCircle, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVoiceInput } from '@/hooks/useVoiceInput';

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
  const prevMessageRef = useRef('');
  const { isListening, transcript, isSupported, startListening, stopListening } = useVoiceInput();

  // Sync transcript to message when voice input is active
  useEffect(() => {
    if (isListening && transcript) {
      // Update message with the current transcript (appended to what was there before voice started)
      setMessage(prevMessageRef.current + transcript);
    }
  }, [transcript, isListening]);

  // Store message before starting voice input
  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      prevMessageRef.current = message;
      startListening();
    }
  };

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
            ? '0 0 40px -5px hsl(158 35% 45% / 0.25), 0 0 20px -10px hsl(var(--primary) / 0.2)' 
            : '0 8px 30px -8px hsl(220 15% 20% / 0.1)'
        }}
        className={cn(
          'relative bg-gradient-to-br from-card via-card to-muted/30 border-2 rounded-[28px] overflow-hidden transition-all duration-500',
          isFocused 
            ? 'border-primary/50 ring-4 ring-primary/10' 
            : 'border-border/60 hover:border-border'
        )}
      >
        {/* Animated gradient border effect */}
        <div className={cn(
          'absolute inset-0 rounded-[28px] opacity-0 transition-opacity duration-500 pointer-events-none',
          isFocused && 'opacity-100'
        )}>
          <div className="absolute inset-[-2px] bg-gradient-to-r from-sage via-lavender to-calm-blue rounded-[30px] blur-sm opacity-30" />
        </div>

        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-sage/5 via-transparent to-lavender/5 pointer-events-none" />
        
        {/* Glass highlight */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-t-[28px]" />
        
        <div className="relative flex items-end gap-3 p-3">
          {/* Voice input button */}
          {isSupported && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleToggleVoice}
              className={cn(
                'h-10 w-10 rounded-xl transition-all duration-300 mb-0.5',
                isListening 
                  ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse' 
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              )}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>
          )}

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
              'flex-1 resize-none bg-transparent px-3 py-3 text-foreground placeholder:text-muted-foreground/70 focus:outline-none text-sm leading-relaxed',
              'min-h-[48px] max-h-[150px]'
            )}
          />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={isLoading ? 'loading' : message.trim() ? 'ready' : 'empty'}
              initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 10 }}
              transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
            >
              <Button
                type="submit"
                size="icon"
                disabled={!message.trim() || isLoading}
                className={cn(
                  'h-12 w-12 rounded-2xl transition-all duration-300 relative overflow-hidden',
                  message.trim() && !isLoading 
                    ? 'bg-gradient-to-br from-primary via-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105' 
                    : 'bg-muted/80'
                )}
              >
                {/* Button shimmer effect */}
                {message.trim() && !isLoading && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                )}
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 relative z-10" />
                )}
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center gap-3 mt-4"
      >
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-sage" />
          <p className="text-xs text-muted-foreground/80">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono mx-1">Enter</kbd> to send
          </p>
          <span className="text-muted-foreground/40">•</span>
          <p className="text-xs text-muted-foreground/80">
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono mx-1">Shift+Enter</kbd> for new line
          </p>
          <Sparkles className="w-3 h-3 text-lavender" />
        </div>
      </motion.div>
    </form>
  );
};
