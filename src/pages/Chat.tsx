import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { WelcomeScreen } from '@/components/chat/WelcomeScreen';
import { ConversationSidebar } from '@/components/chat/ConversationSidebar';
import { MoodTracker } from '@/components/mood/MoodTracker';
import { BreathingExercise } from '@/components/breathing/BreathingExercise';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useConversations } from '@/hooks/useConversations';
import { useMoodTracking } from '@/hooks/useMoodTracking';
import { Loader2 } from 'lucide-react';

export default function Chat() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moodOpen, setMoodOpen] = useState(false);
  const [breathingOpen, setBreathingOpen] = useState(false);

  const {
    messages,
    isLoading,
    sendMessage,
    startNewConversation,
    loadConversation,
    currentConversation,
    setCurrentConversation,
  } = useChat();

  const {
    conversations,
    loadConversations,
    deleteConversation,
  } = useConversations();

  const {
    moodEntries,
    todayMood,
    logMood,
  } = useMoodTracking();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStarterClick = (starter: string) => {
    sendMessage(starter);
  };

  const handleSelectConversation = async (conversationId: string) => {
    const selected = conversations.find((c) => c.id === conversationId);
    if (selected) {
      setCurrentConversation({
        id: selected.id,
        title: selected.title,
        createdAt: selected.createdAt,
      });
      await loadConversation(conversationId);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    await deleteConversation(conversationId);
    if (currentConversation?.id === conversationId) {
      startNewConversation();
    }
    loadConversations();
  };

  const handleNewConversation = () => {
    startNewConversation();
    loadConversations();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        onNewChat={handleNewConversation} 
        onOpenHistory={() => {
          loadConversations();
          setSidebarOpen(true);
        }}
        onOpenBreathing={() => setBreathingOpen(true)}
        onOpenMood={() => setMoodOpen(true)}
      />

      {/* Conversation Sidebar */}
      <ConversationSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        currentConversationId={currentConversation?.id}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onNewConversation={handleNewConversation}
      />

      {/* Mood Tracker */}
      <MoodTracker
        isOpen={moodOpen}
        onClose={() => setMoodOpen(false)}
        todayMood={todayMood}
        moodEntries={moodEntries}
        onLogMood={logMood}
      />

      {/* Breathing Exercise */}
      <BreathingExercise
        isOpen={breathingOpen}
        onClose={() => setBreathingOpen(false)}
      />

      <main className="flex-1 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            {messages.length === 0 ? (
              <WelcomeScreen onStarterClick={handleStarterClick} />
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    isLatest={index === messages.length - 1 && message.role === 'assistant'}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 bg-background/80 backdrop-blur-lg border-t border-border"
        >
          <div className="container mx-auto px-4 py-4 max-w-3xl">
            <ChatInput
              onSend={sendMessage}
              isLoading={isLoading}
              placeholder={
                messages.length === 0
                  ? "Share what's on your mind..."
                  : 'Continue our conversation...'
              }
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
}
