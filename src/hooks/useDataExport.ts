import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ExportData {
  exportedAt: string;
  user: {
    email: string;
    memberSince: string;
  };
  conversations: any[];
  messages: any[];
  moodEntries: any[];
  journalEntries: any[];
  wellnessGoals: any[];
  streaks: any[];
  achievements: any[];
}

export const useDataExport = () => {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);

  const exportData = useCallback(async (format: 'json' | 'csv' = 'json') => {
    if (!user) {
      toast.error('Please sign in to export your data');
      return;
    }

    setIsExporting(true);

    try {
      // Fetch all user data in parallel
      const [
        conversationsResult,
        messagesResult,
        moodResult,
        journalResult,
        goalsResult,
        streaksResult,
        achievementsResult,
      ] = await Promise.all([
        supabase.from('conversations').select('*').eq('user_id', user.id),
        supabase.from('messages').select('*').eq('user_id', user.id),
        supabase.from('mood_entries').select('*').eq('user_id', user.id),
        supabase.from('journal_entries').select('*').eq('user_id', user.id),
        supabase.from('wellness_goals').select('*').eq('user_id', user.id),
        supabase.from('user_streaks').select('*').eq('user_id', user.id),
        supabase
          .from('user_achievements')
          .select('*, achievements(*)')
          .eq('user_id', user.id),
      ]);

      const exportData: ExportData = {
        exportedAt: new Date().toISOString(),
        user: {
          email: user.email || '',
          memberSince: user.created_at,
        },
        conversations: conversationsResult.data || [],
        messages: messagesResult.data || [],
        moodEntries: moodResult.data || [],
        journalEntries: journalResult.data || [],
        wellnessGoals: goalsResult.data || [],
        streaks: streaksResult.data || [],
        achievements: achievementsResult.data || [],
      };

      let blob: Blob;
      let filename: string;

      if (format === 'json') {
        blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });
        filename = `orbit-export-${new Date().toISOString().split('T')[0]}.json`;
      } else {
        // Convert to CSV format
        const csvSections: string[] = [];

        // Helper to convert array to CSV
        const arrayToCSV = (arr: any[], title: string) => {
          if (arr.length === 0) return '';
          const headers = Object.keys(arr[0]);
          const rows = arr.map(obj =>
            headers.map(h => `"${String(obj[h] || '').replace(/"/g, '""')}"`).join(',')
          );
          return `\n--- ${title} ---\n${headers.join(',')}\n${rows.join('\n')}`;
        };

        csvSections.push(`ORBIT Data Export - ${exportData.exportedAt}`);
        csvSections.push(`User Email: ${exportData.user.email}`);
        csvSections.push(`Member Since: ${exportData.user.memberSince}`);
        csvSections.push(arrayToCSV(exportData.conversations, 'Conversations'));
        csvSections.push(arrayToCSV(exportData.messages, 'Messages'));
        csvSections.push(arrayToCSV(exportData.moodEntries, 'Mood Entries'));
        csvSections.push(arrayToCSV(exportData.journalEntries, 'Journal Entries'));
        csvSections.push(arrayToCSV(exportData.wellnessGoals, 'Wellness Goals'));
        csvSections.push(arrayToCSV(exportData.streaks, 'Streaks'));

        blob = new Blob([csvSections.join('\n')], { type: 'text/csv' });
        filename = `orbit-export-${new Date().toISOString().split('T')[0]}.csv`;
      }

      // Download file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('🎉 Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [user]);

  return { exportData, isExporting };
};
