import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Timer, Waves, Wind, CloudRain, Bird } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface MeditationTimerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_DURATIONS = [
  { label: '1 min', seconds: 60 },
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '15 min', seconds: 900 },
  { label: '20 min', seconds: 1200 },
];

const AMBIENT_SOUNDS = [
  { id: 'silence', label: 'Silence', icon: VolumeX, color: 'from-gray-400 to-gray-500' },
  { id: 'rain', label: 'Rain', icon: CloudRain, color: 'from-blue-400 to-cyan-500' },
  { id: 'waves', label: 'Ocean', icon: Waves, color: 'from-teal-400 to-blue-500' },
  { id: 'wind', label: 'Wind', icon: Wind, color: 'from-green-400 to-emerald-500' },
  { id: 'birds', label: 'Birds', icon: Bird, color: 'from-amber-400 to-orange-500' },
];

// Audio oscillator for ambient sounds simulation
const createAmbientSound = (type: string, audioContext: AudioContext): OscillatorNode | null => {
  if (type === 'silence') return null;
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  switch (type) {
    case 'rain':
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.03, audioContext.currentTime);
      break;
    case 'waves':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      break;
    case 'wind':
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.02, audioContext.currentTime);
      break;
    case 'birds':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.02, audioContext.currentTime);
      break;
    default:
      return null;
  }
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  return oscillator;
};

export const MeditationTimer: React.FC<MeditationTimerProps> = ({ isOpen, onClose }) => {
  const [duration, setDuration] = useState(300); // 5 minutes default
  const [timeLeft, setTimeLeft] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSound, setSelectedSound] = useState('silence');
  const [volume, setVolume] = useState(50);
  const [showCompleted, setShowCompleted] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopSound = useCallback(() => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch {
        // Already stopped
      }
      oscillatorRef.current = null;
    }
  }, []);

  const startSound = useCallback(() => {
    if (selectedSound === 'silence') return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    stopSound();
    oscillatorRef.current = createAmbientSound(selectedSound, audioContextRef.current);
    if (oscillatorRef.current) {
      oscillatorRef.current.start();
    }
  }, [selectedSound, stopSound]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            stopSound();
            setShowCompleted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      startSound();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      stopSound();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      stopSound();
    };
  }, [isRunning, startSound, stopSound]);

  useEffect(() => {
    if (!isOpen) {
      setIsRunning(false);
      stopSound();
    }
  }, [isOpen, stopSound]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDurationSelect = (seconds: number) => {
    setDuration(seconds);
    setTimeLeft(seconds);
    setIsRunning(false);
    setShowCompleted(false);
  };

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
    setShowCompleted(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    setShowCompleted(false);
    stopSound();
  };

  const progress = ((duration - timeLeft) / duration) * 100;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-gradient-to-br from-card via-card to-muted/50 rounded-3xl shadow-2xl border border-border/50 w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-lavender/30 to-calm-blue/20 rounded-full blur-3xl"
              animate={{ scale: isRunning ? [1, 1.2, 1] : 1, opacity: isRunning ? [0.5, 0.8, 0.5] : 0.5 }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-sage/30 to-lavender/20 rounded-full blur-3xl"
              animate={{ scale: isRunning ? [1.2, 1, 1.2] : 1, opacity: isRunning ? [0.5, 0.8, 0.5] : 0.5 }}
              transition={{ duration: 4, repeat: Infinity, delay: 2 }}
            />
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 rounded-full bg-background/50 backdrop-blur-sm"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="relative p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Timer className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Meditation Timer</h2>
              </div>
              <p className="text-sm text-muted-foreground">Find your calm 🧘✨</p>
            </div>

            {/* Timer Display */}
            <div className="relative flex items-center justify-center mb-8">
              {/* Progress ring */}
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/30"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="url(#timerGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={553}
                  strokeDashoffset={553 - (553 * progress) / 100}
                  initial={{ strokeDashoffset: 553 }}
                  animate={{ strokeDashoffset: 553 - (553 * progress) / 100 }}
                  transition={{ duration: 0.5 }}
                />
                <defs>
                  <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--sage))" />
                    <stop offset="50%" stopColor="hsl(var(--lavender))" />
                    <stop offset="100%" stopColor="hsl(var(--calm-blue))" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Time display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {showCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-center"
                  >
                    <span className="text-4xl mb-2 block">🎉</span>
                    <p className="text-lg font-semibold text-foreground">Well done!</p>
                    <p className="text-sm text-muted-foreground">Session complete</p>
                  </motion.div>
                ) : (
                  <>
                    <motion.span
                      key={timeLeft}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className="text-5xl font-bold text-foreground tabular-nums"
                    >
                      {formatTime(timeLeft)}
                    </motion.span>
                    <span className="text-sm text-muted-foreground mt-1">
                      {isRunning ? 'Breathe deeply...' : 'Ready to begin'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Duration Presets */}
            <div className="mb-6">
              <p className="text-xs font-medium text-muted-foreground mb-3 text-center">Duration</p>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_DURATIONS.map((preset) => (
                  <Button
                    key={preset.seconds}
                    variant={duration === preset.seconds ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDurationSelect(preset.seconds)}
                    className={`text-xs ${duration === preset.seconds ? 'bg-gradient-to-r from-sage to-calm-blue' : ''}`}
                    disabled={isRunning}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Ambient Sounds */}
            <div className="mb-6">
              <p className="text-xs font-medium text-muted-foreground mb-3 text-center">Ambient Sound</p>
              <div className="grid grid-cols-5 gap-2">
                {AMBIENT_SOUNDS.map((sound) => (
                  <button
                    key={sound.id}
                    onClick={() => setSelectedSound(sound.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                      selectedSound === sound.id
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border/50 hover:border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${sound.color} flex items-center justify-center`}>
                      <sound.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{sound.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Control */}
            {selectedSound !== 'silence' && (
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                  <Slider
                    value={[volume]}
                    onValueChange={(v) => setVolume(v[0])}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-8">{volume}%</span>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handleReset}
                className="w-12 h-12 rounded-full"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
              
              <Button
                onClick={handlePlayPause}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-sage via-lavender to-calm-blue hover:opacity-90 shadow-lg"
              >
                {isRunning ? (
                  <Pause className="w-7 h-7 text-primary-foreground" />
                ) : (
                  <Play className="w-7 h-7 text-primary-foreground ml-1" />
                )}
              </Button>
              
              <div className="w-12 h-12" /> {/* Spacer for symmetry */}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
