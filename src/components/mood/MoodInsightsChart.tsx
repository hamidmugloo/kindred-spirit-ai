import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format, subDays } from 'date-fns';
import { MoodEntry, MOODS } from '@/hooks/useMoodTracking';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MoodInsightsChartProps {
  moodEntries: MoodEntry[];
}

export const MoodInsightsChart: React.FC<MoodInsightsChartProps> = ({ moodEntries }) => {
  // Prepare last 14 days of data
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const entry = moodEntries.find((e) => {
      const entryDate = new Date(e.createdAt);
      return (
        entryDate.getDate() === date.getDate() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getFullYear() === date.getFullYear()
      );
    });
    return {
      date: format(date, 'MMM d'),
      score: entry?.moodScore || null,
      emoji: entry?.mood || '',
    };
  });

  // Calculate insights
  const entriesWithScores = last14Days.filter((d) => d.score !== null);
  const avgScore = entriesWithScores.length > 0 
    ? entriesWithScores.reduce((sum, d) => sum + (d.score || 0), 0) / entriesWithScores.length 
    : 0;

  // Trend calculation (last 7 days vs previous 7 days)
  const recentWeek = last14Days.slice(7).filter((d) => d.score !== null);
  const previousWeek = last14Days.slice(0, 7).filter((d) => d.score !== null);
  const recentAvg = recentWeek.length > 0 
    ? recentWeek.reduce((sum, d) => sum + (d.score || 0), 0) / recentWeek.length 
    : 0;
  const previousAvg = previousWeek.length > 0 
    ? previousWeek.reduce((sum, d) => sum + (d.score || 0), 0) / previousWeek.length 
    : 0;
  const trend = recentAvg - previousAvg;

  const getMoodLabel = (score: number) => {
    return MOODS.find((m) => m.score === Math.round(score))?.label || 'Unknown';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && payload[0].value !== null) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-2xl">{data.emoji}</p>
          <p className="text-xs text-muted-foreground">
            Score: {payload[0].value}/5
          </p>
        </div>
      );
    }
    return null;
  };

  if (entriesWithScores.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p className="text-sm">📊 Start tracking your mood to see insights!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Insights Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Average Mood</p>
          <p className="text-2xl mb-1">
            {MOODS.find((m) => m.score === Math.round(avgScore))?.emoji || '😐'}
          </p>
          <p className="text-xs font-medium text-foreground">{getMoodLabel(avgScore)}</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Weekly Trend</p>
          <div className="flex items-center justify-center gap-1">
            {trend > 0.2 ? (
              <TrendingUp className="w-5 h-5 text-green-500" />
            ) : trend < -0.2 ? (
              <TrendingDown className="w-5 h-5 text-red-500" />
            ) : (
              <Minus className="w-5 h-5 text-muted-foreground" />
            )}
            <span className={`text-sm font-medium ${
              trend > 0.2 ? 'text-green-500' : trend < -0.2 ? 'text-red-500' : 'text-muted-foreground'
            }`}>
              {trend > 0.2 ? 'Improving' : trend < -0.2 ? 'Declining' : 'Stable'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {entriesWithScores.length} entries
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={last14Days} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[1, 5]} 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              ticks={[1, 3, 5]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#moodGradient)"
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
