import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const affirmations = [
  { text: "You are worthy of love and kindness, especially from yourself.", emoji: "💜" },
  { text: "Every breath you take is a new opportunity to start fresh.", emoji: "🌸" },
  { text: "Your feelings are valid. It's okay to feel what you're feeling.", emoji: "💙" },
  { text: "You are stronger than you know and braver than you believe.", emoji: "💪" },
  { text: "Progress, not perfection. Every small step counts.", emoji: "🌟" },
  { text: "You deserve peace, joy, and all the beautiful things life has to offer.", emoji: "✨" },
  { text: "It's okay to rest. You don't have to earn your break.", emoji: "🌿" },
  { text: "You are enough, just as you are, right now.", emoji: "🦋" },
  { text: "Your presence in this world makes it a better place.", emoji: "🌈" },
  { text: "Be gentle with yourself. You're doing the best you can.", emoji: "🤗" },
  { text: "Every ending is a new beginning in disguise.", emoji: "🌅" },
  { text: "Your voice matters. Your story matters. You matter.", emoji: "💕" },
  { text: "Embrace uncertainty; it's where growth begins.", emoji: "🌱" },
  { text: "You are not your thoughts. You are the awareness behind them.", emoji: "🧘" },
  { text: "Today, you choose to be kind to yourself.", emoji: "❤️" },
];

export const DailyAffirmation: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Get a random affirmation based on the day
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('affirmation_date');
    const storedIndex = localStorage.getItem('affirmation_index');

    if (storedDate === today && storedIndex) {
      setCurrentIndex(parseInt(storedIndex));
    } else {
      const randomIndex = Math.floor(Math.random() * affirmations.length);
      setCurrentIndex(randomIndex);
      localStorage.setItem('affirmation_date', today);
      localStorage.setItem('affirmation_index', randomIndex.toString());
    }
  }, []);

  const getNewAffirmation = () => {
    setIsAnimating(true);
    setTimeout(() => {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * affirmations.length);
      } while (newIndex === currentIndex);
      setCurrentIndex(newIndex);
      setIsAnimating(false);
    }, 300);
  };

  const affirmation = affirmations[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-lavender/20 via-sage/10 to-calm-blue/20 rounded-2xl blur-xl" />
      
      <div className="relative bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Daily Affirmation</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={getNewAffirmation}
            disabled={isAnimating}
            className="h-8 w-8 rounded-full hover:bg-primary/10"
          >
            <RefreshCw className={`w-4 h-4 ${isAnimating ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Affirmation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-center py-4"
          >
            <motion.span
              className="text-4xl mb-4 block"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              {affirmation.emoji}
            </motion.span>
            <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed">
              "{affirmation.text}"
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border/30">
          <Heart className="w-4 h-4 text-rose-400" />
          <span className="text-xs text-muted-foreground">Remember: You are loved 💜</span>
        </div>
      </div>
    </motion.div>
  );
};
