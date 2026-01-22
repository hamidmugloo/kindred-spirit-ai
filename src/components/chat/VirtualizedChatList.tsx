import React, { useRef, useEffect, memo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MemoizedChatMessage } from './MemoizedChatMessage';
import type { Message } from '@/hooks/useChat';

interface VirtualizedChatListProps {
  messages: Message[];
  isLoading: boolean;
}

// Limit messages to render for performance
const MAX_VISIBLE_MESSAGES = 50;

const VirtualizedChatList = memo<VirtualizedChatListProps>(({ messages, isLoading }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(messages.length);
  
  // Only render the most recent messages for performance
  const visibleMessages = messages.slice(-MAX_VISIBLE_MESSAGES);
  
  const virtualizer = useVirtualizer({
    count: visibleMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 120, []), // Estimated row height
    overscan: 5, // Render 5 extra items above/below viewport
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      // Use requestAnimationFrame to avoid blocking
      requestAnimationFrame(() => {
        if (parentRef.current) {
          parentRef.current.scrollTop = parentRef.current.scrollHeight;
        }
      });
    }
    lastMessageCountRef.current = messages.length;
  }, [messages.length]);

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      style={{ contain: 'strict' }}
    >
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {items.map((virtualRow) => {
            const message = visibleMessages[virtualRow.index];
            const isLatest = virtualRow.index === visibleMessages.length - 1 && 
                            message.role === 'assistant' && 
                            isLoading;
            
            return (
              <div
                key={message.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="pb-6"
              >
                <MemoizedChatMessage
                  role={message.role}
                  content={message.content}
                  isLatest={isLatest}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

VirtualizedChatList.displayName = 'VirtualizedChatList';

export { VirtualizedChatList };
