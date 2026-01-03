import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      setConversations(
        data.map((conv) => ({
          id: conv.id,
          title: conv.title || 'New Conversation',
          createdAt: new Date(conv.created_at),
          updatedAt: new Date(conv.updated_at),
        }))
      );
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const deleteConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);
      
      if (error) throw error;
      
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  return {
    conversations,
    isLoading,
    loadConversations,
    deleteConversation,
  };
};
