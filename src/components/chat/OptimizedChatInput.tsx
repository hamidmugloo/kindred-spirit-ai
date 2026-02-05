 import React, { useCallback, useRef, useState, memo } from 'react';
 import { Send, Loader2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OptimizedChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
  isVoiceSupported: boolean;
  isListening: boolean;
  onStartListening: (callback: (text: string) => void) => void;
  onStopListening: () => void;
 voiceOutputEnabled?: boolean;
 onToggleVoiceOutput?: () => void;
 isTTSSupported?: boolean;
}

// Isolated input component to prevent parent re-renders
const OptimizedChatInput = memo<OptimizedChatInputProps>(({
  onSend,
  isLoading,
  placeholder = "Share what's on your mind...",
  isVoiceSupported,
  isListening,
  onStartListening,
  onStopListening,
 voiceOutputEnabled = false,
 onToggleVoiceOutput,
 isTTSSupported = false,
}) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autosize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.style.height = '0px';
      el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
    });
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    autosize();
  }, [autosize]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (trimmed && !isLoading) {
      onSend(trimmed);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [message, isLoading, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening((transcript) => {
        setMessage(transcript);
        autosize();
      });
    }
  }, [isListening, onStartListening, onStopListening, autosize]);

  const canSend = message.trim() && !isLoading;

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div 
        className={cn(
          'relative bg-card border-2 rounded-3xl overflow-hidden transition-colors duration-200',
          isFocused 
            ? 'border-primary/50 shadow-md' 
            : 'border-border/60'
        )}
      >
        <div className="relative flex items-end gap-2 p-3">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            rows={1}
            disabled={isLoading}
            className={cn(
              'flex-1 resize-none bg-transparent px-3 py-3 text-foreground caret-primary',
              'placeholder:text-muted-foreground/70 focus:outline-none text-sm leading-relaxed',
              'min-h-[48px] max-h-[150px]'
            )}
          />
          
          {isVoiceSupported && (
             <div className="flex flex-col items-center gap-1">
               <Button
                 type="button"
                 size="icon"
                 variant="ghost"
                 onClick={toggleVoice}
                 disabled={isLoading}
                 className={cn(
                   'h-10 w-10 rounded-xl flex-shrink-0 transition-colors',
                   isListening 
                     ? 'bg-destructive/20 text-destructive animate-pulse' 
                     : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                 )}
               >
                 {isListening ? (
                   <MicOff className="w-5 h-5" />
                 ) : (
                   <Mic className="w-5 h-5" />
                 )}
               </Button>
               {isListening && (
                 <span className="text-[10px] text-destructive font-medium animate-pulse">
                   Listening...
                 </span>
               )}
             </div>
           )}
 
           {isTTSSupported && onToggleVoiceOutput && (
             <Button
               type="button"
               size="icon"
               variant="ghost"
               onClick={onToggleVoiceOutput}
               className={cn(
                 'h-10 w-10 rounded-xl flex-shrink-0 transition-colors',
                 voiceOutputEnabled 
                   ? 'bg-primary/20 text-primary' 
                   : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
               )}
               title={voiceOutputEnabled ? 'Voice replies on' : 'Voice replies off'}
             >
               {voiceOutputEnabled ? (
                 <Volume2 className="w-5 h-5" />
               ) : (
                 <VolumeX className="w-5 h-5" />
               )}
             </Button>
          )}
          
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            className={cn(
              'h-12 w-12 rounded-2xl transition-colors flex-shrink-0',
              canSend 
                ? 'bg-primary hover:bg-primary/90 shadow-md' 
                : 'bg-muted/80'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2 mt-3">
        <p className="text-xs text-muted-foreground/70">
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-mono mx-1">Enter</kbd> to send
           {isVoiceSupported && ' • Mic for voice'}
           {isTTSSupported && ' • Speaker for replies'}
        </p>
      </div>
    </form>
  );
});

OptimizedChatInput.displayName = 'OptimizedChatInput';

export { OptimizedChatInput };
