import React, { useState, useRef, useEffect } from 'react';
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

  const canSend = message.trim() && !isLoading;

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div 
        className={cn(
          'relative bg-gradient-to-br from-card via-card to-muted/30 border-2 rounded-[28px] overflow-hidden transition-all duration-300',
          isFocused 
            ? 'border-primary/50 ring-4 ring-primary/10 shadow-[0_0_40px_-5px_hsl(158_35%_45%/0.25),0_0_20px_-10px_hsl(var(--primary)/0.2)]' 
            : 'border-border/60 hover:border-border shadow-[0_8px_30px_-8px_hsl(220_15%_20%/0.1)]'
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
        
        <div className="relative flex items-end gap-2 p-3">
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
          
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            className={cn(
              'h-12 w-12 rounded-2xl transition-all duration-300 relative overflow-hidden flex-shrink-0',
              canSend 
                ? 'bg-gradient-to-br from-primary via-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105' 
                : 'bg-muted/80'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 relative z-10" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-3 mt-4">
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          <Sparkles className="w-3 h-3 text-sage" />
          <p className="text-xs text-muted-foreground/80">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono mx-1">Enter</kbd> to send
          </p>
          <Sparkles className="w-3 h-3 text-lavender" />
        </div>
      </div>
    </form>
  );
};
