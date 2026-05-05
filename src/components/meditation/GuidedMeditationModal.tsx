import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, SkipBack, Volume2, Moon, Sun, Brain, Heart, Leaf, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface GuidedMeditationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

interface MeditationSession {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  icon: React.ReactNode;
  color: string;
  steps: { time: number; instruction: string }[];
}

const MEDITATION_SESSIONS: MeditationSession[] = [
  {
    id: 'sleep',
    title: 'Sleep & Relaxation',
    description: 'Calm your mind for restful sleep',
    duration: 300,
    icon: <Moon className="w-6 h-6" />,
    color: 'from-indigo-500/20 to-purple-500/20',
    steps: [
      { time: 0, instruction: '🌙 Find a comfortable position and close your eyes...' },
      { time: 30, instruction: '🌊 Take a deep breath in... and slowly release...' },
      { time: 60, instruction: '✨ Imagine a warm, peaceful light surrounding you...' },
      { time: 90, instruction: '🍃 Let go of any tension in your shoulders and neck...' },
      { time: 120, instruction: '💭 Release any thoughts... let them float away like clouds...' },
      { time: 150, instruction: '🌸 Feel yourself becoming lighter and more relaxed...' },
      { time: 180, instruction: '🌙 Your body is heavy and comfortable...' },
      { time: 210, instruction: '💫 Breathe slowly... peace fills every part of you...' },
      { time: 240, instruction: '🌟 You are safe... you are calm... you are at peace...' },
      { time: 270, instruction: '😴 Drift gently into restful sleep...' },
    ],
  },
  {
    id: 'focus',
    title: 'Focus & Clarity',
    description: 'Sharpen your mind and concentration',
    duration: 300,
    icon: <Brain className="w-6 h-6" />,
    color: 'from-blue-500/20 to-cyan-500/20',
    steps: [
      { time: 0, instruction: '🎯 Sit comfortably and bring your attention inward...' },
      { time: 30, instruction: '👁️ Focus on a single point in your mind...' },
      { time: 60, instruction: '🌊 Breathe deeply... feel your mind becoming clearer...' },
      { time: 90, instruction: '✨ With each breath, distractions fade away...' },
      { time: 120, instruction: '💎 Your thoughts become crystal clear...' },
      { time: 150, instruction: '🔮 Visualize your goals with perfect clarity...' },
      { time: 180, instruction: '⚡ Feel focused energy flowing through you...' },
      { time: 210, instruction: '🎯 Your concentration is sharp and unwavering...' },
      { time: 240, instruction: '🧠 You are fully present and aware...' },
      { time: 270, instruction: '✅ Carry this focus with you throughout your day...' },
    ],
  },
  {
    id: 'anxiety',
    title: 'Anxiety Relief',
    description: 'Release worry and find calm',
    duration: 300,
    icon: <Heart className="w-6 h-6" />,
    color: 'from-rose-500/20 to-pink-500/20',
    steps: [
      { time: 0, instruction: '💗 Place your hand on your heart... feel its rhythm...' },
      { time: 30, instruction: '🌬️ Take a slow, deep breath... you are safe here...' },
      { time: 60, instruction: '🌊 Imagine anxiety as a wave... watch it pass...' },
      { time: 90, instruction: '🌸 With each exhale, release tension and worry...' },
      { time: 120, instruction: '💭 Your thoughts do not control you...' },
      { time: 150, instruction: '🌈 Breathe in peace... breathe out fear...' },
      { time: 180, instruction: '🤗 Wrap yourself in comfort and compassion...' },
      { time: 210, instruction: '✨ You are stronger than any anxious thought...' },
      { time: 240, instruction: '🌿 Feel grounded and centered in this moment...' },
      { time: 270, instruction: '💝 You are calm, you are capable, you are enough...' },
    ],
  },
  {
    id: 'gratitude',
    title: 'Gratitude Practice',
    description: 'Cultivate appreciation and joy',
    duration: 300,
    icon: <Sun className="w-6 h-6" />,
    color: 'from-amber-500/20 to-yellow-500/20',
    steps: [
      { time: 0, instruction: '☀️ Close your eyes and smile gently...' },
      { time: 30, instruction: '💛 Think of something small that brought you joy today...' },
      { time: 60, instruction: '🏠 Feel grateful for the safety and comfort around you...' },
      { time: 90, instruction: '👥 Think of someone who has supported you...' },
      { time: 120, instruction: '💝 Send them love and appreciation in your heart...' },
      { time: 150, instruction: '🌱 Be thankful for your body and its strength...' },
      { time: 180, instruction: '✨ Appreciate this moment of peace...' },
      { time: 210, instruction: '🌈 Feel the warmth of gratitude filling you...' },
      { time: 240, instruction: '🙏 Thank yourself for taking this time to heal...' },
      { time: 270, instruction: '💫 Carry this gratitude with you always...' },
    ],
  },
  {
    id: 'nature',
    title: 'Nature Connection',
    description: 'Feel grounded with nature visualization',
    duration: 300,
    icon: <Leaf className="w-6 h-6" />,
    color: 'from-green-500/20 to-emerald-500/20',
    steps: [
      { time: 0, instruction: '🌲 Imagine yourself in a peaceful forest...' },
      { time: 30, instruction: '🍃 Feel a gentle breeze on your skin...' },
      { time: 60, instruction: '🌿 Smell the fresh, earthy scent of nature...' },
      { time: 90, instruction: '💧 Hear a gentle stream flowing nearby...' },
      { time: 120, instruction: '☀️ Warm sunlight filters through the leaves...' },
      { time: 150, instruction: '🦋 Watch butterflies dance around you...' },
      { time: 180, instruction: '🌳 Feel roots growing from your feet into the earth...' },
      { time: 210, instruction: '🌸 Breathe in the healing energy of nature...' },
      { time: 240, instruction: '🌍 You are connected to all living things...' },
      { time: 270, instruction: '🌿 Carry nature\'s peace within you always...' },
    ],
  },
  {
    id: 'breathing',
    title: 'Deep Breathing',
    description: 'Master your breath for calm',
    duration: 300,
    icon: <Wind className="w-6 h-6" />,
    color: 'from-sky-500/20 to-blue-500/20',
    steps: [
      { time: 0, instruction: '🌬️ Begin with natural breathing... observe your breath...' },
      { time: 30, instruction: '📥 Breathe in slowly for 4 counts... 1... 2... 3... 4...' },
      { time: 60, instruction: '⏸️ Hold gently for 4 counts... 1... 2... 3... 4...' },
      { time: 90, instruction: '📤 Exhale slowly for 6 counts... feel tension release...' },
      { time: 120, instruction: '🔄 Continue this rhythm... in... hold... out...' },
      { time: 150, instruction: '🌊 Your breath is like ocean waves... steady and calm...' },
      { time: 180, instruction: '✨ Each breath brings more peace...' },
      { time: 210, instruction: '💫 Your body relaxes deeper with each cycle...' },
      { time: 240, instruction: '🎐 You are in complete control of your calm...' },
      { time: 270, instruction: '🙏 Return to natural breathing... feeling renewed...' },
    ],
  },
];

export function GuidedMeditationModal({ isOpen, onClose, onComplete }: GuidedMeditationModalProps) {
  const [selectedSession, setSelectedSession] = useState<MeditationSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!selectedSession) return;

    const step = [...selectedSession.steps]
      .reverse()
      .find(s => s.time <= elapsedTime);
    
    if (step) {
      setCurrentInstruction(step.instruction);
    }
  }, [elapsedTime, selectedSession]);

  useEffect(() => {
    if (isPlaying && selectedSession) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => {
          if (prev >= selectedSession.duration) {
            setIsPlaying(false);
            onComplete?.();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, selectedSession, onComplete]);

  const handleSelectSession = (session: MeditationSession) => {
    setSelectedSession(session);
    setElapsedTime(0);
    setIsPlaying(false);
    setCurrentInstruction(session.steps[0].instruction);
  };

  const handleBack = () => {
    setSelectedSession(null);
    setElapsedTime(0);
    setIsPlaying(false);
  };

  const handleClose = () => {
    setSelectedSession(null);
    setElapsedTime(0);
    setIsPlaying(false);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = selectedSession ? (elapsedTime / selectedSession.duration) * 100 : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-primary/10 via-accent/10 to-sage-light/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Guided Meditations</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedSession ? selectedSession.title : 'Choose a session'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {!selectedSession ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {MEDITATION_SESSIONS.map((session, index) => (
                    <motion.button
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSelectSession(session)}
                      className={`bg-gradient-to-br ${session.color} rounded-xl p-5 text-left border border-border hover:border-primary/50 transition-all hover:scale-[1.02]`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-background/50 flex items-center justify-center text-primary">
                          {session.icon}
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{session.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{session.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {Math.floor(session.duration / 60)} minutes
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatTime(elapsedTime)}</span>
                      <span>{formatTime(selectedSession.duration)}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Instruction Display */}
                  <motion.div
                    key={currentInstruction}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-gradient-to-br ${selectedSession.color} rounded-2xl p-8 text-center min-h-[200px] flex items-center justify-center`}
                  >
                    <p className="text-xl font-medium text-foreground leading-relaxed">
                      {currentInstruction}
                    </p>
                  </motion.div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleBack}
                      className="rounded-full w-12 h-12"
                    >
                      <SkipBack className="w-5 h-5" />
                    </Button>
                    <Button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="rounded-full w-16 h-16 bg-primary hover:bg-primary/90"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6 ml-1" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setElapsedTime(0);
                        setIsPlaying(false);
                      }}
                      className="rounded-full w-12 h-12"
                    >
                      <SkipBack className="w-5 h-5 rotate-180" />
                    </Button>
                  </div>

                  {elapsedTime >= selectedSession.duration && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-4"
                    >
                      <p className="text-lg font-medium text-primary">✨ Session Complete! ✨</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Well done on completing this meditation
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
