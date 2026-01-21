import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export const useChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);

  const createConversation = async (): Promise<string | null> => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: 'New Conversation' })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
    
    setCurrentConversation({
      id: data.id,
      title: data.title || 'New Conversation',
      createdAt: new Date(data.created_at),
    });
    
    return data.id;
  };

  const loadConversation = async (conversationId: string) => {
    if (!user) return;
    
    const { data: messagesData, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error loading messages:', error);
      return;
    }
    
    setMessages(
      messagesData.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        createdAt: new Date(msg.created_at),
      }))
    );
  };

  const saveMessage = async (
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ) => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role,
        content,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving message:', error);
      return null;
    }
    
    return data.id;
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!user || isLoading) return;
    
    setIsLoading(true);
    
    let conversationId = currentConversation?.id;
    if (!conversationId) {
      conversationId = await createConversation();
      if (!conversationId) {
        setIsLoading(false);
        toast.error('Failed to start conversation');
        return;
      }
    }
    
    // Add user message to state
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    
    // Save user message to database
    await saveMessage(conversationId, 'user', content);
    
    // Build conversation history for context
    const conversationHistory = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
    
    try {
      // Get current session token for memory access
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;
      
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authToken ? `Bearer ${authToken}` : `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content }],
          conversationHistory,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }
      
      if (!response.body) {
        throw new Error('No response body');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let assistantMessageId = crypto.randomUUID();
      
      // Add initial assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          createdAt: new Date(),
        },
      ]);
      
      let textBuffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (deltaContent) {
              assistantContent += deltaContent;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: assistantContent }
                    : msg
                )
              );
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
      
      // Save assistant message to database
      if (assistantContent) {
        await saveMessage(conversationId, 'assistant', assistantContent);
        
        // Update conversation title based on first exchange
        if (messages.length === 0) {
          const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
          await supabase
            .from('conversations')
            .update({ title })
            .eq('id', conversationId);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
      // Remove the empty assistant message on error
      setMessages((prev) => prev.filter((msg) => msg.content !== ''));
    } finally {
      setIsLoading(false);
    }
  }, [user, isLoading, currentConversation, messages]);

  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversation(null);
  };

  return {
    messages,
    isLoading,
    currentConversation,
    sendMessage,
    loadConversation,
    startNewConversation,
    setCurrentConversation,
  };
};
