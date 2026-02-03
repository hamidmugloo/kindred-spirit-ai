import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Shield, Zap, Sparkles, ArrowRight, Code, Lightbulb, MessageSquare } from 'lucide-react';
import orbitLogo from '@/assets/orbit-logo.png';

const features = [
  {
    icon: Brain,
    title: 'Smart & Capable 🧠',
    description: 'I can help with questions, analysis, writing, coding, and creative tasks.',
    gradient: 'from-violet-500/20 to-purple-500/10',
    iconColor: 'text-violet-500',
  },
  {
    icon: Shield,
    title: 'Private & Secure 🛡️',
    description: 'Your conversations are protected. Chat freely without worry.',
    gradient: 'from-emerald-500/20 to-teal-500/10',
    iconColor: 'text-emerald-500',
  },
  {
    icon: Zap,
    title: 'Fast Responses ⚡',
    description: 'Get instant, thoughtful answers to any question you have.',
    gradient: 'from-amber-500/20 to-orange-500/10',
    iconColor: 'text-amber-500',
  },
  {
    icon: Lightbulb,
    title: 'Always Learning ✨',
    description: 'I adapt to your needs and remember our conversations for better help.',
    gradient: 'from-blue-500/20 to-cyan-500/10',
    iconColor: 'text-blue-500',
  },
];

const starters = [
  { text: 'Explain a complex topic to me', emoji: '📚' },
  { text: 'Help me write a professional email', emoji: '✉️' },
  { text: 'Can you help me debug some code?', emoji: '💻' },
  { text: 'I need help brainstorming ideas', emoji: '💡' },
];

interface WelcomeScreenProps {
  onStarterClick: (starter: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStarterClick }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center max-w-3xl"
      >
        {/* Logo/Avatar with enhanced animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, type: 'spring', stiffness: 150 }}
          className="relative w-24 h-24 mx-auto mb-8"
        >
          {/* Outer glow rings */}
          <motion.div 
            className="absolute inset-[-8px] rounded-full bg-gradient-to-br from-sage/30 via-lavender/20 to-calm-blue/30 blur-xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div 
            className="absolute inset-[-4px] rounded-full bg-gradient-to-br from-sage via-lavender to-calm-blue opacity-40"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* Main avatar with logo */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-sage via-lavender to-calm-blue flex items-center justify-center shadow-2xl shadow-primary/20 border-2 border-white/20 p-4">
            <img src={orbitLogo} alt="ORBIT" className="w-full h-full object-contain" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Hi, I'm{' '}
            <span className="text-gradient bg-gradient-to-r from-sage via-lavender to-calm-blue bg-clip-text text-transparent">ORBIT</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl mb-10 leading-relaxed max-w-xl mx-auto">
            Your intelligent AI assistant. Ask me anything—I'm here to help you 
            think, create, and solve problems. 🚀
          </p>
        </motion.div>

        {/* Features Grid with glass cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              className="group relative"
            >
              <div className={cn(
                'absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl',
                feature.gradient
              )} />
              <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 text-left shadow-lg hover:shadow-xl transition-all duration-300 hover:border-border hover:-translate-y-1">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br',
                  feature.gradient
                )}>
                  <feature.icon className={cn('w-6 h-6', feature.iconColor)} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Conversation Starters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Try asking me something
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {starters.map((starter, index) => (
              <motion.button
                key={starter.text}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onStarterClick(starter.text)}
                className="group flex items-center gap-2 px-5 py-3 bg-gradient-to-br from-secondary/80 to-secondary/60 hover:from-secondary hover:to-secondary/80 text-secondary-foreground text-sm rounded-2xl transition-all duration-300 border border-border/30 hover:border-border shadow-md hover:shadow-lg"
              >
                <span>{starter.emoji}</span>
                <span>{starter.text}</span>
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
