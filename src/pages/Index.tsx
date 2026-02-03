import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Shield, MessageCircle, ArrowRight, Brain, Code, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import orbitLogo from '@/assets/orbit-logo.png';

const features = [
  {
    icon: Brain,
    title: 'Intelligent & Adaptive',
    description: 'Powered by advanced AI to understand context and provide thoughtful, accurate responses.',
    color: 'from-violet-500/20 to-purple-500/20',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description: 'Your conversations are encrypted and protected. Your data stays yours.',
    color: 'from-sage/20 to-calm-blue/20',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Get instant answers and solutions. No waiting, no delays—just results.',
    color: 'from-amber-500/20 to-orange-500/20',
  },
  {
    icon: Lightbulb,
    title: 'Creative Partner',
    description: 'From brainstorming ideas to solving complex problems, I help you think better.',
    color: 'from-lavender/20 to-accent/20',
  },
];

const useCases = [
  {
    emoji: '💡',
    title: 'Answer Questions',
    description: 'Get accurate answers to any question',
  },
  {
    emoji: '✍️',
    title: 'Write & Edit',
    description: 'Draft emails, essays, or creative content',
  },
  {
    emoji: '💻',
    title: 'Code Help',
    description: 'Debug, explain, or write code in any language',
  },
  {
    emoji: '📊',
    title: 'Analyze & Plan',
    description: 'Break down problems and create action plans',
  },
];

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 gradient-hero opacity-50" />
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-20 left-10 w-20 h-20 bg-sage/10 rounded-full blur-xl"
          />
          <motion.div
            animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute top-40 right-20 w-32 h-32 bg-lavender/20 rounded-full blur-xl"
          />
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute bottom-40 left-1/4 w-24 h-24 bg-calm-blue/10 rounded-full blur-xl"
          />
        </div>

        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">
                Your Intelligent AI Assistant
              </span>
            </motion.div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Think faster with{' '}
              <span className="text-gradient">ORBIT</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Your intelligent AI assistant that helps you answer questions, solve problems,
              write content, and tackle any challenge—instantly.
            </p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button variant="hero" size="xl" asChild>
                <Link to={user ? '/chat' : '/auth?mode=signup'}>
                  {user ? 'Continue Chatting' : 'Get Started Free'}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              {!user && (
                <Button variant="outline" size="xl" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
              )}
            </motion.div>
          </motion.div>

          {/* Hero Image/Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 max-w-3xl mx-auto"
          >
            <div className="bg-card rounded-3xl border border-border shadow-medium overflow-hidden">
              <div className="p-6 bg-muted/30 border-b border-border flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-destructive/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-sage/50" />
              </div>
              <div className="p-8 space-y-6">
                {/* Sample Chat Messages */}
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Code className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 max-w-md">
                    <p className="text-sm text-foreground">
                      Can you explain how async/await works in JavaScript?
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sage to-calm-blue flex items-center justify-center flex-shrink-0">
                    <img src={orbitLogo} alt="ORBIT" className="w-6 h-6 object-contain" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 max-w-md shadow-soft">
                    <p className="text-sm text-foreground leading-relaxed">
                      Great question! Async/await is syntactic sugar built on Promises 
                      that makes asynchronous code look and behave more like synchronous code.
                      The <code className="bg-muted px-1 rounded">async</code> keyword declares an async function,
                      while <code className="bg-muted px-1 rounded">await</code> pauses execution until a Promise resolves...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl mb-3">{useCase.emoji}</div>
                <h3 className="font-semibold text-foreground mb-1">{useCase.title}</h3>
                <p className="text-sm text-muted-foreground">{useCase.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Built for everything you need
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From simple questions to complex problems, ORBIT adapts to help you succeed
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card rounded-2xl border border-border p-6 shadow-soft hover:shadow-medium transition-all duration-300 group"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to boost your productivity?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of users who think faster and work smarter with ORBIT.
            </p>
            <Button variant="hero" size="xl" asChild>
              <Link to={user ? '/chat' : '/auth?mode=signup'}>
                {user ? 'Continue Chatting' : 'Start for Free'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={orbitLogo} alt="ORBIT" className="h-8 w-auto" />
              <span className="font-semibold text-foreground">ORBIT</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Your intelligent AI assistant for any question, task, or challenge.
            </p>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ORBIT
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
