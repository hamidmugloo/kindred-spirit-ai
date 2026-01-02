import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, MessageCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  conversationCount: number;
  messageCount: number;
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ conversationCount: 0, messageCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        const [conversationsResult, messagesResult] = await Promise.all([
          supabase
            .from('conversations')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
        ]);

        setStats({
          conversationCount: conversationsResult.count || 0,
          messageCount: messagesResult.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/chat')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Chat
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Profile Card */}
          <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
            <div className="gradient-hero p-8 text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-card border-4 border-background flex items-center justify-center shadow-medium">
                <User className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mt-4">
                {user.user_metadata?.display_name || 'Friend'}
              </h1>
              <p className="text-muted-foreground">MindfulAI Member</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-foreground">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-foreground">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Member Since</p>
                  <p className="text-sm font-medium">{memberSince}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-card rounded-2xl border border-border shadow-soft p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Your Journey
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-sage-light rounded-xl p-4 text-center">
                <MessageCircle className="w-6 h-6 text-sage mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {stats.conversationCount}
                </p>
                <p className="text-xs text-muted-foreground">Conversations</p>
              </div>
              <div className="bg-lavender-light rounded-xl p-4 text-center">
                <MessageCircle className="w-6 h-6 text-accent-foreground mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {stats.messageCount}
                </p>
                <p className="text-xs text-muted-foreground">Messages Shared</p>
              </div>
            </div>
          </div>

          {/* Encouragement Card */}
          <div className="bg-gradient-to-br from-sage-light to-lavender-light rounded-2xl border border-border p-6 text-center">
            <p className="text-foreground font-medium mb-2">
              Every conversation is a step forward
            </p>
            <p className="text-sm text-muted-foreground">
              Thank you for trusting MindfulAI with your thoughts and feelings.
              Remember, seeking support is a sign of strength.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
