import React, { useEffect, useState, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { VirtualizedChatList } from '@/components/chat/VirtualizedChatList';
import { OptimizedChatInput } from '@/components/chat/OptimizedChatInput';
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
import { useVoiceConversation } from '@/hooks/useVoiceConversation';
import { VoiceModeOverlay } from '@/components/voice/VoiceModeOverlay';
import { Loader2 } from 'lucide-react';

export default function Chat() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
   // Unified voice conversation hook
  const {
    isListening,
    isSpeaking,
    voiceModeEnabled,
    lastInputWasVoice,
    liveTranscript,
    inputLevel,
    outputLevel,
    isVoiceSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    toggleVoiceMode,
    markInputAsText,
  } = useVoiceConversation();

  const [voiceOverlayOpen, setVoiceOverlayOpen] = useState(false);
  
  // UI State - separated for minimal re-renders
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
 
   // Auto-speak assistant responses when voice mode is enabled
   const lastMessageRef = React.useRef<string | null>(null);
 
   React.useEffect(() => {
     if (messages.length === 0 || isLoading) return;
 
     const lastMessage = messages[messages.length - 1];
     
     // Only speak when the user is actively in voice mode (overlay open) or just spoke via mic
     const shouldSpeak = (voiceModeEnabled && voiceOverlayOpen) || lastInputWasVoice;
     
     if (
       shouldSpeak &&
       lastMessage.role === 'assistant' &&
       lastMessage.content &&
       lastMessage.content !== lastMessageRef.current
     ) {
       lastMessageRef.current = lastMessage.content;
       speak(lastMessage.content, true); // Force speak
     }
   }, [messages, voiceModeEnabled, lastInputWasVoice, isLoading, speak]);

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
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Simplified background - reduced blur effects for mobile perf */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sage/10 rounded-full opacity-50" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-calm-blue/10 rounded-full opacity-50" />
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
        {/* Messages Area - Virtualized for performance */}
        {messages.length === 0 ? (
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
              <WelcomeScreen onStarterClick={handleStarterClick} />
            </div>
          </div>
        ) : (
          <VirtualizedChatList messages={messages} isLoading={isLoading} />
        )}

        {/* Input Area - Simplified, no heavy animations */}
        <div className="sticky bottom-0 bg-gradient-to-t from-background via-background/95 to-background/80 backdrop-blur-sm border-t border-border/30">
          <div className="container mx-auto px-4 py-4 max-w-3xl">
            <OptimizedChatInput
              onSend={sendMessage}
              isLoading={isLoading}
              placeholder={
                messages.length === 0
                  ? "Share what's on your mind..."
                  : 'Continue our conversation...'
              }
              isVoiceSupported={isVoiceSupported}
              isListening={isListening}
              onStartListening={startListening}
              onStopListening={stopListening}
              voiceModeEnabled={voiceModeEnabled}
              onToggleVoiceMode={() => {
                if (!voiceModeEnabled) toggleVoiceMode();
                setVoiceOverlayOpen(true);
              }}
              isSpeaking={isSpeaking}
              onStopSpeaking={stopSpeaking}
              onTextInput={markInputAsText}
            />
          </div>
        </div>
      </main>

      <VoiceModeOverlay
        open={voiceOverlayOpen}
        onClose={() => {
          setVoiceOverlayOpen(false);
          stopListening();
          stopSpeaking();
        }}
        isListening={isListening}
        isSpeaking={isSpeaking}
        liveTranscript={liveTranscript}
        inputLevel={inputLevel}
        outputLevel={outputLevel}
        lastAssistantMessage={
          messages.length > 0 && messages[messages.length - 1].role === 'assistant'
            ? messages[messages.length - 1].content
            : undefined
        }
        onStartListening={() => {
          let finalText = '';
          startListening(
            (text) => { finalText = text; },
            () => {
              const trimmed = finalText.trim();
              if (trimmed) sendMessage(trimmed);
            }
          );
        }}
        onStopListening={stopListening}
        onStopSpeaking={stopSpeaking}
      />
    </div>
  );
}
