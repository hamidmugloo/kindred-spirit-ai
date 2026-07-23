import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Loader2, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import orbitLogo from '@/assets/orbit-logo.png';

const SUPPORT_TONES = [
  { id: 'warm', label: 'Warm & Empathetic', desc: 'Gentle, encouraging, feels like a friend.' },
  { id: 'direct', label: 'Direct & Practical', desc: 'Straight to the point with clear steps.' },
  { id: 'playful', label: 'Playful & Curious', desc: 'Light, creative, keeps things fun.' },
  { id: 'coach', label: 'Motivating Coach', desc: 'Energetic, holds you accountable.' },
];

const GOAL_OPTIONS = [
  'Brainstorm ideas',
  'Learn new things',
  'Boost productivity',
  'Write & edit content',
  'Solve problems',
  'Plan & organize',
  'Code & debug',
  'Reflect & journal',
];

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [tone, setTone] = useState<string>('');
  const [goals, setGoals] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name, support_tone, goals, onboarding_completed')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.onboarding_completed) {
          navigate('/chat');
          return;
        }
        if (data?.display_name) setName(data.display_name);
        if (data?.support_tone) setTone(data.support_tone);
        if (data?.goals) setGoals(data.goals);
      });
  }, [user, navigate]);

  const toggleGoal = (g: string) =>
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const canNext =
    (step === 0 && name.trim().length > 0) ||
    (step === 1 && tone !== '') ||
    (step === 2 && goals.length > 0);

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: name.trim(),
        support_tone: tone,
        goals,
        onboarding_completed: true,
      })
      .eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast.error('Could not save your preferences. Try again.');
      return;
    }
    toast.success("You're all set. Let's begin.");
    navigate('/chat');
  };

  const next = () => {
    if (step < 2) setStep(step + 1);
    else handleFinish();
  };

  const stepTitles = ['What should I call you?', 'Pick a support tone', 'What are your goals?'];
  const stepSubs = [
    "I'll use this name in our conversations.",
    'This shapes how I respond to you.',
    'Choose any that fit — you can change this later.',
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-sage/20 via-primary/10 to-lavender/20 pointer-events-none" />
      <motion.div
        className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-24 -right-24 w-96 h-96 bg-lavender/20 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div className="w-full max-w-lg relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sage to-calm-blue p-2 shadow-lg">
            <img src={orbitLogo} alt="ORBIT" className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="bg-card/80 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl p-8">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-2 flex items-center gap-2 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" /> Step {step + 1} of 3
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">{stepTitles[step]}</h1>
              <p className="text-muted-foreground mb-6">{stepSubs[step]}</p>

              {step === 0 && (
                <div className="space-y-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    id="name"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="h-12 text-base"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && canNext) next();
                    }}
                  />
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-3">
                  {SUPPORT_TONES.map((t) => {
                    const active = tone === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTone(t.id)}
                        className={`text-left p-4 rounded-2xl border-2 transition-all ${
                          active
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-border/50 hover:border-primary/50 bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-foreground">{t.label}</div>
                            <div className="text-sm text-muted-foreground mt-0.5">{t.desc}</div>
                          </div>
                          {active && <Check className="w-5 h-5 text-primary shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-wrap gap-2">
                  {GOAL_OPTIONS.map((g) => {
                    const active = goals.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGoal(g)}
                        className={`px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-all ${
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border/60 bg-muted/40 text-foreground hover:border-primary/50'
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                        {g}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 gap-3">
            {step > 0 ? (
              <Button
                variant="ghost"
                onClick={() => setStep(step - 1)}
                disabled={saving}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now
              </button>
            )}

            <Button
              onClick={next}
              disabled={!canNext || saving}
              size="lg"
              className="bg-gradient-to-r from-sage to-primary text-primary-foreground shadow-lg"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {step === 2 ? 'Finish' : 'Continue'}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
