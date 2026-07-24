import React, { memo } from 'react';
import { User, Heart, Bot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MemoizedChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isLatest?: boolean;
}

// Lightweight typing indicator without heavy animations
const TypingIndicator = memo(() => (
  <span className="inline-flex gap-1.5 items-center ml-1">
    <span className="w-2 h-2 rounded-full bg-sage animate-pulse" />
    <span className="w-2 h-2 rounded-full bg-lavender animate-pulse" style={{ animationDelay: '150ms' }} />
    <span className="w-2 h-2 rounded-full bg-calm-blue animate-pulse" style={{ animationDelay: '300ms' }} />
  </span>
));
TypingIndicator.displayName = 'TypingIndicator';

// Memoized message component - no framer-motion for better mobile perf
const MemoizedChatMessage = memo<MemoizedChatMessageProps>(({ 
  role, 
  content, 
  isLatest,
}) => {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 max-w-3xl mx-auto group animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Simplified avatar - no glow effects on mobile */}
      <div className="relative flex-shrink-0">
        <div
          className={cn(
            'w-10 h-10 rounded-2xl flex items-center justify-center shadow-md border border-border/30',
            isUser
              ? 'bg-primary'
              : 'bg-gradient-to-br from-sage to-lavender'
          )}
        >
          {isUser ? (
            <User className="w-4 h-4 text-primary-foreground" />
          ) : (
            <Bot className="w-4 h-4 text-primary-foreground" />
          )}
        </div>
      </div>

      {/* Simplified message bubble - reduced effects */}
      <div
        className={cn(
          'flex-1',
          isUser ? 'max-w-[85%]' : 'max-w-[90%]'
        )}
      >
        <div
          className={cn(
            'px-4 py-3 rounded-2xl relative',
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-md shadow-sm'
              : 'bg-card border border-border/50 rounded-tl-md shadow-sm'
          )}
        >
          {/* Simplified label */}
          <div className={cn(
            'text-[10px] uppercase tracking-wider font-medium mb-2 flex items-center gap-1',
            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}>
            {isUser ? (
              <span>You</span>
            ) : (
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3 text-sage" />
                ORBIT
                <Sparkles className="w-3 h-3 text-lavender" />
              </span>
            )}
          </div>

          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          ) : (
            <div className="text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:mt-3 prose-headings:mb-2 prose-pre:my-2 prose-pre:bg-muted prose-pre:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-a:text-primary prose-li:my-0.5">
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              ) : (
                isLatest && <TypingIndicator />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better memoization
  return (
    prevProps.role === nextProps.role &&
    prevProps.content === nextProps.content &&
    prevProps.isLatest === nextProps.isLatest
  );
});

MemoizedChatMessage.displayName = 'MemoizedChatMessage';

export { MemoizedChatMessage };
