import React from 'react';
import { motion } from 'framer-motion';
import { User, Sparkles } from 'lucide-react';
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex gap-3 max-w-3xl mx-auto',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-gradient-to-br from-sage to-calm-blue text-primary-foreground'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={cn(
          'flex-1 px-4 py-3 rounded-2xl',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-card border border-border rounded-bl-md shadow-soft'
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {content}
          {!content && isLatest && (
            <span className="inline-flex gap-1">
              <span className="w-2 h-2 rounded-full bg-current animate-typing" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-current animate-typing" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-current animate-typing" style={{ animationDelay: '300ms' }} />
            </span>
          )}
        </p>
      </div>
    </motion.div>
  );
};
