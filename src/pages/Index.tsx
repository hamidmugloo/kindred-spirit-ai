import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Heart, Shield, MessageCircle, ArrowRight, Leaf, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  {
    icon: Heart,
    title: 'Emotionally Intelligent',
    description: 'I understand and respond to your unique emotional state with genuine empathy and care.',
    color: 'from-pink-500/20 to-rose-500/20',
  },
  {
    icon: Shield,
    title: 'Safe & Private',
    description: 'Your conversations are encrypted and secure. This is your personal sanctuary.',
    color: 'from-sage/20 to-calm-blue/20',
  },
  {
    icon: MessageCircle,
    title: 'Always Here for You',
    description: 'Available 24/7, I provide consistent support whenever you need someone to talk to.',
    color: 'from-lavender/20 to-accent/20',
  },
  {
    icon: Leaf,
    title: 'Growth-Focused',
    description: 'Together, we explore coping strategies and techniques to help you flourish.',
    color: 'from-sage/20 to-emerald-500/20',
  },
];

const testimonials = [
  {
    quote: "ORBIT helped me through some of my darkest moments. It's like having a caring friend who truly listens.",
    author: 'A grateful user',
  },
  {
    quote: "The personalized responses make such a difference. It doesn't feel like talking to a robot at all.",
    author: 'Finding peace',
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
              className="inline-flex items-center gap-2 bg-sage-light border border-sage/20 rounded-full px-4 py-2 mb-8"
            >
              <Sparkles className="w-4 h-4 text-sage" />
              <span className="text-sm text-sage-dark font-medium">
                Your Mental Wellness Companion
              </span>
            </motion.div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Find peace in{' '}
              <span className="text-gradient">conversation</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              ORBIT is your compassionate AI companion, offering empathetic
              support, understanding, and gentle guidance whenever you need
              someone to talk to.
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
                  {user ? 'Continue Chatting' : 'Start Your Journey'}
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
                    <Sun className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 max-w-md">
                    <p className="text-sm text-foreground">
                      I've been feeling really anxious about everything lately...
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sage to-calm-blue flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 max-w-md shadow-soft">
                    <p className="text-sm text-foreground leading-relaxed">
                      I hear you, and I want you to know that what you're feeling
                      is completely valid. Anxiety can feel overwhelming, like
                      carrying a weight that nobody else can see. Let's take a
                      breath together. Can you tell me more about what's been
                      weighing on your mind?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
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
              Support designed for you
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Every feature is crafted with your mental wellness in mind
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

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.blockquote
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="bg-card rounded-2xl border border-border p-8 shadow-soft"
                >
                  <p className="text-foreground italic mb-4 leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                  <cite className="text-muted-foreground text-sm not-italic">
                    — {testimonial.author}
                  </cite>
                </motion.blockquote>
              ))}
            </div>
          </motion.div>
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
              Ready to start your journey?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Take the first step toward better mental wellness. I'm here to
              listen, support, and grow with you.
            </p>
            <Button variant="hero" size="xl" asChild>
              <Link to={user ? '/chat' : '/auth?mode=signup'}>
                {user ? 'Continue Chatting' : 'Begin Now'}
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
              <img src="/orbit-logo.png" alt="ORBIT" className="h-8 w-auto" />
              <span className="font-semibold text-foreground">ORBIT</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              ORBIT is a supportive companion, not a replacement for
              professional mental health care.
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
