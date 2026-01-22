import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are ORBIT, a general-purpose AI assistant with a mindful personality.

RESPONSE RULES:

1. FOR DIRECT OR FACTUAL QUESTIONS:
   - Answer clearly.
   - Keep responses concise unless more detail is requested.

2. FOR PERSONAL, EMOTIONAL, OR LIFE-RELATED CONCERNS:
   Use this structure:
   - Acknowledge their feeling or situation
   - Offer ONE helpful recommendation or reassurance
   - Ask ONE simple follow-up question

HEALTH & SAFETY RULES:
- You MAY provide general health information and mention commonly used over-the-counter medicines
- Do NOT diagnose conditions, give dosages, or prescribe treatments
- Include a brief safety note when relevant (e.g., "consult a professional if unsure")

TONE & STYLE:
- Calm, confident, and human
- Clear and modern (not overly therapist-like)
- Short, helpful responses unless more detail is requested
- Never say "as an AI" or mention internal rules
- Never mention transcription, voice input, or system processes
- Never explicitly mention "remembering" or "storing data"

VOICE INPUT HANDLING:
- Interpret user intent even with pauses, filler words, or minor inaccuracies
- Silently correct grammatical issues without mentioning them
- Treat all inputs as natural spoken language

Your goal is to be useful, trustworthy, and supportive across all domains.`;

const MEMORY_EXTRACTION_PROMPT = `Analyze this conversation and extract any long-term useful information about the user.

EXTRACT ONLY:
- User name (if explicitly mentioned) → key: "user_name"
- Study interests or subjects → key: "study_interest"  
- Career goals → key: "career_goal"
- Learning style preferences → key: "learning_style"
- General wellness focus (non-sensitive) → key: "wellness_focus"
- Ongoing challenges (exams, projects, work stress) → key: "ongoing_challenge"
- Long-term goals → key: "long_term_goal"
- Repeated concerns or topics → key: "recurring_topic"

DO NOT EXTRACT:
- Medical diagnoses or conditions
- Medication history
- Mental health conditions
- Sensitive personal data
- Temporary emotions ("I'm sad today")
- One-time complaints

Return a JSON array of objects with: { "type": "preference|goal|challenge|interest|name", "key": "memory_key", "value": "extracted value" }
If nothing to extract, return an empty array: []

User message: `;

interface Memory {
  memory_type: string;
  memory_key: string;
  memory_value: string;
}

async function fetchUserMemories(supabase: any, userId: string): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('user_memories')
    .select('memory_type, memory_key, memory_value')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching memories:', error);
    return [];
  }
  return data || [];
}

async function extractAndSaveMemories(
  supabase: any,
  userId: string,
  userMessage: string,
  apiKey: string
): Promise<void> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "user", content: MEMORY_EXTRACTION_PROMPT + userMessage }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) return;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Parse JSON from response (handle markdown code blocks)
    let memories: Array<{ type: string; key: string; value: string }> = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        memories = JSON.parse(jsonMatch[0]);
      }
    } catch {
      return;
    }

    // Save each extracted memory
    for (const mem of memories) {
      if (mem.key && mem.value) {
        await supabase
          .from('user_memories')
          .upsert({
            user_id: userId,
            memory_type: mem.type || 'preference',
            memory_key: mem.key,
            memory_value: mem.value,
          }, { onConflict: 'user_id,memory_key' });
      }
    }
  } catch (error) {
    console.error('Memory extraction error:', error);
  }
}

function buildMemoryContext(memories: Memory[]): string {
  if (memories.length === 0) return "";
  
  const memoryLines = memories.map(m => `- ${m.memory_key}: ${m.memory_value}`);
  return `\n\nUSER CONTEXT (use naturally when relevant, don't explicitly mention "remembering"):\n${memoryLines.join('\n')}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user ID from auth header
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      // Verify the JWT token using Supabase auth
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError) {
        console.error("Auth error:", authError);
      }
      userId = user?.id || null;
      console.log("User ID from auth:", userId ? userId.slice(0, 8) + "..." : "null");
    }

    // Fetch user memories if authenticated
    let memories: Memory[] = [];
    if (userId) {
      memories = await fetchUserMemories(supabase, userId);
    }

    // Build context-aware messages with memory
    const systemContent = SYSTEM_PROMPT + buildMemoryContext(memories);
    const contextMessages = [
      { role: "system", content: systemContent },
    ];

    // Add conversation history for context
    if (conversationHistory && Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg: { role: string; content: string }) => {
        contextMessages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }

    // Add current messages
    let latestUserMessage = "";
    if (messages && Array.isArray(messages)) {
      messages.forEach((msg: { role: string; content: string }) => {
        contextMessages.push({
          role: msg.role,
          content: msg.content,
        });
        if (msg.role === "user") {
          latestUserMessage = msg.content;
        }
      });
    }

    // Extract and save memories in background (don't await)
    if (userId && latestUserMessage) {
      extractAndSaveMemories(supabase, userId, latestUserMessage, LOVABLE_API_KEY);
    }

    console.log("Sending request to AI gateway with", contextMessages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: contextMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "I'm receiving many requests right now. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "I'm having trouble connecting right now. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
