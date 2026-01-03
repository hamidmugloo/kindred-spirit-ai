import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Trash2, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Conversation } from '@/hooks/useConversations';
import { formatDistanceToNow } from 'date-fns';

interface ConversationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  currentConversationId?: string;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewConversation: () => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
}) => {
  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 bg-card border-r border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Conversations</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* New Chat Button */}
            <div className="p-4">
              <Button 
                variant="calm" 
                className="w-full" 
                onClick={() => {
                  onNewConversation();
                  onClose();
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Conversation
              </Button>
            </div>

            {/* Conversation List */}
            <ScrollArea className="flex-1 px-2">
              <div className="space-y-1 pb-4">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <motion.div
                      key={conversation.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`group relative rounded-lg p-3 cursor-pointer transition-colors ${
                        currentConversationId === conversation.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => {
                        onSelectConversation(conversation.id);
                        onClose();
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {conversation.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDistanceToNow(conversation.updatedAt, { addSuffix: true })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conversation.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
