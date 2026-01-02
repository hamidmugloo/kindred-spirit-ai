import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Shield, MessageCircle, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Heart,
    title: 'Empathetic Support',
    description: 'I listen without judgment and respond with genuine care and understanding.',
  },
  {
    icon: Shield,
    title: 'Safe Space',
    description: 'Your conversations are private. This is your sanctuary to express freely.',
  },
  {
    icon: MessageCircle,
    title: 'Always Available',
    description: "I'm here whenever you need to talk, day or night, no appointments needed.",
  },
  {
    icon: Sparkles,
    title: 'Personalized Care',
    description: 'I adapt to your unique needs and remember our conversations for better support.',
  },
];

const starters = [
  "I'm feeling overwhelmed today...",
  'I need help processing my thoughts',
  "I'm struggling with anxiety",
  'Can we talk about stress management?',
];

interface WelcomeScreenProps {
  onStarterClick: (starter: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStarterClick }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl"
      >
        {/* Logo/Avatar */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-sage via-lavender to-calm-blue flex items-center justify-center shadow-glow"
        >
          <Sparkles className="w-10 h-10 text-primary-foreground" />
        </motion.div>

        <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">
          Welcome to{' '}
          <span className="text-gradient">MindfulAI</span>
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          Your compassionate companion for mental wellness. I'm here to listen,
          support, and help you navigate life's challenges.
        </p>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              className="bg-card border border-border rounded-xl p-4 text-left shadow-soft"
            >
              <div className="w-10 h-10 rounded-lg bg-sage-light flex items-center justify-center mb-3">
                <feature.icon className="w-5 h-5 text-sage" />
              </div>
              <h3 className="font-medium text-foreground text-sm mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Conversation Starters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <p className="text-sm text-muted-foreground mb-3">
            Not sure where to start? Try one of these:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {starters.map((starter) => (
              <button
                key={starter}
                onClick={() => onStarterClick(starter)}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm rounded-full transition-colors duration-200"
              >
                {starter}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Safety Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
        className="mt-10 text-center max-w-xl"
      >
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-3">
          <strong>Important:</strong> MindfulAI is a supportive companion, not a
          replacement for professional mental health care. If you're in crisis,
          please reach out to a crisis helpline:{' '}
          <span className="text-primary font-medium">988</span> (US) or your
          local emergency services.
        </p>
      </motion.div>
    </div>
  );
};
