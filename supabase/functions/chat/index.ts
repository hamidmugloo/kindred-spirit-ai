import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a helpful AI assistant that supports users with any kind of query: daily questions, learning and studies, relationships, life problems, general health information, productivity, and emotional support.

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

VOICE INPUT HANDLING:
- Interpret user intent even with pauses, filler words, or minor inaccuracies
- Silently correct grammatical issues without mentioning them
- Treat all inputs as natural spoken language

Your goal is to be useful, trustworthy, and supportive across all domains.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware messages
    const contextMessages = [
      { role: "system", content: SYSTEM_PROMPT },
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
    if (messages && Array.isArray(messages)) {
      messages.forEach((msg: { role: string; content: string }) => {
        contextMessages.push({
          role: msg.role,
          content: msg.content,
        });
      });
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
