import React from 'react';
import { motion } from 'framer-motion';
import { User, Sparkles, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isLatest?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, isLatest }) => {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'flex gap-4 max-w-3xl mx-auto group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar with glow effect */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-medium transition-all duration-300',
          isUser
            ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground'
            : 'bg-gradient-to-br from-sage via-lavender to-calm-blue text-primary-foreground animate-pulse-soft'
        )}
      >
        {isUser ? (
          <User className="w-5 h-5" />
        ) : (
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Sparkles className="w-5 h-5" />
          </motion.div>
        )}
      </motion.div>

      {/* Message Bubble with enhanced styling */}
      <motion.div
        initial={{ opacity: 0, x: isUser ? 10 : -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className={cn(
          'flex-1 px-5 py-4 rounded-3xl relative overflow-hidden',
          isUser
            ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-lg shadow-medium'
            : 'bg-gradient-to-br from-card via-card to-muted/30 border border-border/50 rounded-tl-lg shadow-soft backdrop-blur-sm'
        )}
      >
        {/* Decorative element for assistant messages */}
        {!isUser && (
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-lavender/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        )}
        
        {/* Message label */}
        <div className={cn(
          'text-[10px] uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5',
          isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          {isUser ? (
            <>You</>
          ) : (
            <>
              <Heart className="w-3 h-3 text-sage" />
              MindfulAI
            </>
          )}
        </div>

        <p className="text-sm leading-relaxed whitespace-pre-wrap relative z-10">
          {content}
          {!content && isLatest && (
            <span className="inline-flex gap-1.5 items-center">
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                className="w-2 h-2 rounded-full bg-sage" 
              />
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 rounded-full bg-lavender" 
              />
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                className="w-2 h-2 rounded-full bg-calm-blue" 
              />
            </span>
          )}
        </p>
      </motion.div>
    </motion.div>
  );
};
