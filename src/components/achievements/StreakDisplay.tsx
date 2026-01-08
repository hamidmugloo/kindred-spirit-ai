import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Calendar, Trophy } from 'lucide-react';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
}

export function StreakDisplay({ currentStreak, longestStreak, totalDays }: StreakDisplayProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-4 text-center border border-orange-500/30"
      >
        <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
        <p className="text-2xl font-bold text-foreground">{currentStreak}</p>
        <p className="text-xs text-muted-foreground">Current Streak</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-xl p-4 text-center border border-yellow-500/30"
      >
        <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
        <p className="text-2xl font-bold text-foreground">{longestStreak}</p>
        <p className="text-xs text-muted-foreground">Best Streak</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-4 text-center border border-blue-500/30"
      >
        <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-500" />
        <p className="text-2xl font-bold text-foreground">{totalDays}</p>
        <p className="text-xs text-muted-foreground">Total Days</p>
      </motion.div>
    </div>
  );
}
