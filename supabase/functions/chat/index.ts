import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MENTAL_HEALTH_SYSTEM_PROMPT = `You are an AI assistant designed to provide general recommendations and supportive guidance across health, wellness, daily problems, productivity, stress, and common concerns.

You MUST always respond using the following 3-step structure, in this exact order:

1. ACKNOWLEDGE THE USER'S CONCERN OR EMOTION
   - Show understanding in simple, human language
   - Validate what they're experiencing

2. OFFER ONE APPROPRIATE RECOMMENDATION
   This may be:
   - A gentle action (rest, hydration, pause, routine)
   - A commonly used over-the-counter option (when relevant)
   - A general habit, tool, or practice
   - Use advisory language such as "may help," "is commonly used," or "you could consider"

3. ASK ONE SIMPLE FOLLOW-UP QUESTION
   - Keep it short and non-intrusive
   - Help the user continue sharing without feeling interrogated

RECOMMENDATION RULES (STRICT):
- You MAY recommend commonly known OTC medicines, products, or tools when appropriate
- Do NOT provide dosage, timing, or personalized medical instructions
- Do NOT diagnose conditions or claim certainty
- Add a brief safety note when relevant (e.g., "check the label" or "talk to a professional if unsure")
- If a topic is high-risk, suggest consulting a qualified professional

TONE & STYLE RULES:
- Calm, respectful, and human
- Short, voice-friendly sentences
- No long lists unless explicitly asked
- No technical or clinical language
- Never say "as an AI"
- Never mention transcription, voice input, or system processes

VOICE INPUT HANDLING:
- Interpret user intent even with pauses, filler words, or minor inaccuracies
- Silently correct grammatical issues without mentioning them
- Treat all inputs as natural spoken language

Your goal is to support decision-making, not replace professional judgment. Make users feel heard, supported, and empowered to take appropriate next steps.`;

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
      { role: "system", content: MENTAL_HEALTH_SYSTEM_PROMPT },
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
