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
import { GroundingExercise } from '@/components/grounding/GroundingExercise';
import { MeditationTimer } from '@/components/wellness/MeditationTimer';
import { JournalModal } from '@/components/journal/JournalModal';
import { WeeklyWellnessReport } from '@/components/wellness/WeeklyWellnessReport';
import { AchievementsModal } from '@/components/achievements/AchievementsModal';
import { GuidedMeditationModal } from '@/components/meditation/GuidedMeditationModal';
import { WellnessGoalsModal } from '@/components/goals/WellnessGoalsModal';
import { MemoryManagementModal } from '@/components/memory/MemoryManagementModal';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { useConversations } from '@/hooks/useConversations';
import { useMoodTracking } from '@/hooks/useMoodTracking';
import { useStreaksAndAchievements } from '@/hooks/useStreaksAndAchievements';
import { Loader2 } from 'lucide-react';

export default function Chat() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moodOpen, setMoodOpen] = useState(false);
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [groundingOpen, setGroundingOpen] = useState(false);
  const [meditationOpen, setMeditationOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [wellnessReportOpen, setWellnessReportOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [guidedMeditationOpen, setGuidedMeditationOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);

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

  const {
    streak,
    achievements,
    userAchievements,
    updateStreak,
    checkAndAwardAchievements,
  } = useStreaksAndAchievements();

  // Update streak on page load
  useEffect(() => {
    if (user) {
      updateStreak();
    }
  }, [user, updateStreak]);

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-sage/20 via-lavender/10 to-transparent rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-calm-blue/20 via-lavender/10 to-transparent rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full blur-3xl" />
      </div>

      <Header 
        onNewChat={handleNewConversation} 
        onOpenHistory={() => {
          loadConversations();
          setSidebarOpen(true);
        }}
        onOpenBreathing={() => setBreathingOpen(true)}
        onOpenMood={() => setMoodOpen(true)}
        onOpenGrounding={() => setGroundingOpen(true)}
        onOpenMeditation={() => setMeditationOpen(true)}
        onOpenJournal={() => setJournalOpen(true)}
        onOpenWellnessReport={() => setWellnessReportOpen(true)}
        onOpenAchievements={() => setAchievementsOpen(true)}
        onOpenGuidedMeditation={() => setGuidedMeditationOpen(true)}
        onOpenGoals={() => setGoalsOpen(true)}
        onOpenMemory={() => setMemoryOpen(true)}
        currentStreak={streak?.current_streak}
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

      {/* Grounding Exercise */}
      <GroundingExercise
        isOpen={groundingOpen}
        onClose={() => setGroundingOpen(false)}
      />

      {/* Meditation Timer */}
      <MeditationTimer
        isOpen={meditationOpen}
        onClose={() => setMeditationOpen(false)}
      />

      {/* Journal Modal */}
      <JournalModal
        isOpen={journalOpen}
        onClose={() => setJournalOpen(false)}
      />

      {/* Weekly Wellness Report */}
      <WeeklyWellnessReport
        isOpen={wellnessReportOpen}
        onClose={() => setWellnessReportOpen(false)}
      />

      {/* Achievements Modal */}
      <AchievementsModal
        isOpen={achievementsOpen}
        onClose={() => setAchievementsOpen(false)}
        achievements={achievements}
        userAchievements={userAchievements}
        streak={streak}
      />

      {/* Guided Meditation Modal */}
      <GuidedMeditationModal
        isOpen={guidedMeditationOpen}
        onClose={() => setGuidedMeditationOpen(false)}
        onComplete={() => {
          checkAndAwardAchievements({ meditation: 1 });
        }}
      />

      {/* Wellness Goals Modal */}
      <WellnessGoalsModal
        isOpen={goalsOpen}
        onClose={() => setGoalsOpen(false)}
        onGoalCreated={() => {
          checkAndAwardAchievements({ goals_created: 1 });
        }}
        onGoalCompleted={() => {
          checkAndAwardAchievements({ goals_completed: 1 });
        }}
      />

      {/* Memory Management Modal */}
      <MemoryManagementModal
        isOpen={memoryOpen}
        onClose={() => setMemoryOpen(false)}
      />

      <main className="flex-1 flex flex-col relative z-10">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            {messages.length === 0 ? (
              <WelcomeScreen onStarterClick={handleStarterClick} />
            ) : (
              <motion.div 
                className="space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    isLatest={index === messages.length - 1 && message.role === 'assistant'}
                  />
                ))}
                <div ref={messagesEndRef} className="h-4" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 bg-gradient-to-t from-background via-background/95 to-background/80 backdrop-blur-xl border-t border-border/30 shadow-[0_-10px_40px_-10px_hsl(var(--primary)/0.1)]"
        >
          <div className="container mx-auto px-4 py-5 max-w-3xl">
            <ChatInput
              onSend={sendMessage}
              isLoading={isLoading}
              placeholder={
                messages.length === 0
                  ? "Share what's on your mind... 💭"
                  : 'Continue our conversation... ✨'
              }
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
}
