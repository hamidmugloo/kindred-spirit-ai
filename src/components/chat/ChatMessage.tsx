import React from 'react';
import { motion } from 'framer-motion';
import { User, Sparkles, Heart, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isLatest?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  role, 
  content, 
  isLatest,
}) => {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'flex gap-4 max-w-3xl mx-auto group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar with enhanced glow effect */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, type: 'spring', stiffness: 200 }}
        className="relative flex-shrink-0"
      >
        {/* Glow ring */}
        <div className={cn(
          'absolute inset-0 rounded-2xl blur-md opacity-60 transition-opacity group-hover:opacity-100',
          isUser 
            ? 'bg-gradient-to-br from-primary/50 to-primary/30' 
            : 'bg-gradient-to-br from-sage/50 via-lavender/30 to-calm-blue/50'
        )} />
        
        <div
          className={cn(
            'relative w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-sm',
            isUser
              ? 'bg-gradient-to-br from-primary via-primary to-primary/80'
              : 'bg-gradient-to-br from-sage via-lavender to-calm-blue'
          )}
        >
          {isUser ? (
            <User className="w-5 h-5 text-primary-foreground" />
          ) : (
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              <Bot className="w-5 h-5 text-primary-foreground" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Message Bubble with glass morphism */}
      <motion.div
        initial={{ opacity: 0, x: isUser ? 15 : -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className={cn(
          'flex-1 relative overflow-hidden',
          isUser ? 'max-w-[85%]' : 'max-w-[90%]'
        )}
      >
        {/* Message container */}
        <div
          className={cn(
            'px-5 py-4 rounded-3xl relative',
            isUser
              ? 'bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground rounded-tr-lg shadow-lg shadow-primary/20'
              : 'bg-gradient-to-br from-card/80 via-card to-muted/40 border border-border/50 rounded-tl-lg shadow-lg backdrop-blur-md'
          )}
        >
          {/* Decorative shimmer for assistant */}
          {!isUser && (
            <>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-lavender/15 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-sage/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
            </>
          )}
          
          {/* Message label */}
          <div className={cn(
            'text-[10px] uppercase tracking-widest font-semibold mb-2.5 flex items-center gap-1.5',
            isUser ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}>
            {isUser ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/60" />
                You
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Heart className="w-3 h-3 text-sage" />
                MindfulAI
                <Sparkles className="w-3 h-3 text-lavender" />
              </span>
            )}
          </div>

          <p className="text-sm leading-relaxed whitespace-pre-wrap relative z-10">
            {content}
            {!content && isLatest && (
              <span className="inline-flex gap-2 items-center ml-1">
                <motion.span 
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 rounded-full bg-gradient-to-br from-sage to-sage/60" 
                />
                <motion.span 
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 rounded-full bg-gradient-to-br from-lavender to-lavender/60" 
                />
                <motion.span 
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 rounded-full bg-gradient-to-br from-calm-blue to-calm-blue/60" 
                />
              </span>
            )}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
