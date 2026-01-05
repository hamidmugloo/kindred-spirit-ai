import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MOODS, MoodEntry } from '@/hooks/useMoodTracking';
import { format } from 'date-fns';
import { MoodInsightsChart } from './MoodInsightsChart';
interface MoodTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  todayMood: MoodEntry | null;
  moodEntries: MoodEntry[];
  onLogMood: (mood: string, score: number, note?: string) => void;
}

export const MoodTracker: React.FC<MoodTrackerProps> = ({
  isOpen,
  onClose,
  todayMood,
  moodEntries,
  onLogMood,
}) => {
  const [selectedMood, setSelectedMood] = useState<typeof MOODS[0] | null>(null);
  const [note, setNote] = useState('');
  const [showInsights, setShowInsights] = useState(false);

  const handleSubmit = () => {
    if (!selectedMood) return;
    onLogMood(selectedMood.emoji, selectedMood.score, note || undefined);
    setSelectedMood(null);
    setNote('');
    onClose();
  };

  const last7Days = moodEntries.slice(0, 7);
  const averageMood = last7Days.length > 0
    ? last7Days.reduce((sum, entry) => sum + entry.moodScore, 0) / last7Days.length
    : 0;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-card rounded-2xl shadow-medium border border-border z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">How are you feeling?</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {todayMood ? (
                <div className="text-center py-4">
                  <p className="text-6xl mb-3">{todayMood.mood}</p>
                  <p className="text-muted-foreground">
                    You logged your mood today as{' '}
                    <span className="text-foreground font-medium">
                      {MOODS.find((m) => m.score === todayMood.moodScore)?.label}
                    </span>
                  </p>
                </div>
              ) : (
                <>
                  {/* Mood Picker */}
                  <div className="flex justify-center gap-3">
                    {MOODS.map((mood) => (
                      <motion.button
                        key={mood.score}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedMood(mood)}
                        className={`text-4xl p-2 rounded-xl transition-all ${
                          selectedMood?.score === mood.score
                            ? 'bg-primary/20 ring-2 ring-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {mood.emoji}
                      </motion.button>
                    ))}
                  </div>

                  {selectedMood && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-muted-foreground"
                    >
                      {selectedMood.label}
                    </motion.p>
                  )}

                  {/* Note */}
                  <Textarea
                    placeholder="Add a note about how you're feeling... (optional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />

                  <Button
                    variant="hero"
                    className="w-full"
                    disabled={!selectedMood}
                    onClick={handleSubmit}
                  >
                    Log Mood
                  </Button>
                </>
              )}

              {/* Stats / Insights Toggle */}
              {moodEntries.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {showInsights ? (
                        <BarChart3 className="w-4 h-4 text-primary" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-primary" />
                      )}
                      <span className="text-sm font-medium text-foreground">
                        {showInsights ? 'Mood Insights' : 'Last 7 days'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowInsights(!showInsights)}
                      className="text-xs"
                    >
                      {showInsights ? 'Show Week' : 'Show Insights'}
                    </Button>
                  </div>
                  
                  {showInsights ? (
                    <MoodInsightsChart moodEntries={moodEntries} />
                  ) : (
                    <>
                      <div className="flex gap-1">
                        {last7Days.reverse().map((entry) => (
                          <div
                            key={entry.id}
                            className="flex-1 flex flex-col items-center gap-1"
                          >
                            <span className="text-lg">{entry.mood}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(entry.createdAt, 'EEE')}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 text-center">
                        Average mood: {averageMood.toFixed(1)} / 5
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
