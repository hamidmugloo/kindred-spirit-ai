import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Trash2, X, Plus, History, Sparkles } from 'lucide-react';
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
            className="fixed inset-0 bg-foreground/30 backdrop-blur-md z-40"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -340, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed left-0 top-0 h-full w-80 bg-gradient-to-b from-card via-card to-background border-r border-border/50 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 border-b border-border/50 bg-gradient-to-r from-card to-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage/20 via-lavender/20 to-calm-blue/20 flex items-center justify-center">
                    <History className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">Conversations</h2>
                    <p className="text-xs text-muted-foreground">{conversations.length} chats</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  className="rounded-xl hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* New Chat Button */}
            <div className="p-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="calm" 
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 border-0" 
                  onClick={() => {
                    onNewConversation();
                    onClose();
                  }}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  New Conversation
                  <Sparkles className="w-4 h-4 ml-2 opacity-70" />
                </Button>
              </motion.div>
            </div>

            {/* Conversation List */}
            <ScrollArea className="flex-1 px-3">
              <div className="space-y-2 pb-6">
                {conversations.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">No conversations yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Start a new chat to begin</p>
                  </motion.div>
                ) : (
                  conversations.map((conversation, index) => (
                    <motion.div
                      key={conversation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4 }}
                      className={`group relative rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                        currentConversationId === conversation.id
                          ? 'bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/30 shadow-md'
                          : 'hover:bg-muted/60 border border-transparent hover:border-border/50'
                      }`}
                      onClick={() => {
                        onSelectConversation(conversation.id);
                        onClose();
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          currentConversationId === conversation.id
                            ? 'bg-primary/20'
                            : 'bg-muted'
                        }`}>
                          <MessageSquare className={`w-4 h-4 ${
                            currentConversationId === conversation.id
                              ? 'text-primary'
                              : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {conversation.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(conversation.updatedAt, { addSuffix: true })}
                          </p>
                        </div>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ opacity: 1, scale: 1 }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(conversation.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t border-border/50 bg-gradient-to-t from-muted/30 to-transparent">
              <p className="text-[10px] text-center text-muted-foreground/60">
                Your conversations are private and secure 🔒
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
