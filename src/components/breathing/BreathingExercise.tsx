import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BreathingExerciseProps {
  isOpen: boolean;
  onClose: () => void;
}

type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'rest';

const BREATHING_PATTERN = {
  inhale: 4,
  hold: 4,
  exhale: 4,
  rest: 2,
};

const PHASE_LABELS: Record<BreathPhase, string> = {
  inhale: 'Breathe In',
  hold: 'Hold',
  exhale: 'Breathe Out',
  rest: 'Rest',
};

export const BreathingExercise: React.FC<BreathingExerciseProps> = ({
  isOpen,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [countdown, setCountdown] = useState(BREATHING_PATTERN.inhale);
  const [totalCycles, setTotalCycles] = useState(0);

  const getNextPhase = useCallback((currentPhase: BreathPhase): BreathPhase => {
    const phases: BreathPhase[] = ['inhale', 'hold', 'exhale', 'rest'];
    const currentIndex = phases.indexOf(currentPhase);
    return phases[(currentIndex + 1) % phases.length];
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          const nextPhase = getNextPhase(phase);
          setPhase(nextPhase);
          
          if (nextPhase === 'inhale') {
            setTotalCycles((c) => c + 1);
          }
          
          return BREATHING_PATTERN[nextPhase];
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, phase, getNextPhase]);

  const reset = () => {
    setIsPlaying(false);
    setPhase('inhale');
    setCountdown(BREATHING_PATTERN.inhale);
    setTotalCycles(0);
  };

  const getCircleScale = () => {
    switch (phase) {
      case 'inhale':
        return 1.3;
      case 'hold':
        return 1.3;
      case 'exhale':
        return 1;
      case 'rest':
        return 1;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/30 backdrop-blur-md z-50"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] md:h-[520px] bg-card rounded-3xl shadow-medium border border-border z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Breathing Exercise</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              {/* Breathing Circle */}
              <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: getCircleScale(),
                    opacity: phase === 'rest' ? 0.5 : 1,
                  }}
                  transition={{
                    duration: BREATHING_PATTERN[phase],
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-calm-blue/30 border-2 border-primary/50"
                />
                <motion.div
                  animate={{
                    scale: getCircleScale() * 0.8,
                    opacity: phase === 'rest' ? 0.3 : 0.7,
                  }}
                  transition={{
                    duration: BREATHING_PATTERN[phase],
                    ease: 'easeInOut',
                  }}
                  className="absolute inset-6 rounded-full bg-gradient-to-br from-primary/20 to-lavender/20"
                />
                <div className="relative z-10 text-center">
                  <motion.p
                    key={phase}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xl font-medium text-foreground mb-1"
                  >
                    {PHASE_LABELS[phase]}
                  </motion.p>
                  <motion.span
                    key={countdown}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-bold text-primary"
                  >
                    {countdown}
                  </motion.span>
                </div>
              </div>

              {/* Cycles Counter */}
              {totalCycles > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 text-sm text-muted-foreground"
                >
                  Cycles completed: {totalCycles}
                </motion.p>
              )}

              {/* Pattern Info */}
              <div className="mt-6 flex gap-4 text-xs text-muted-foreground">
                <span>Inhale: {BREATHING_PATTERN.inhale}s</span>
                <span>Hold: {BREATHING_PATTERN.hold}s</span>
                <span>Exhale: {BREATHING_PATTERN.exhale}s</span>
              </div>
            </div>

            {/* Controls */}
            <div className="p-4 border-t border-border flex items-center justify-center gap-3">
              <Button variant="ghost" size="icon" onClick={reset}>
                <RotateCcw className="w-5 h-5" />
              </Button>
              <Button
                variant="hero"
                size="lg"
                className="px-8"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    {totalCycles > 0 ? 'Resume' : 'Start'}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
