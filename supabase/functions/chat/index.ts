import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MENTAL_HEALTH_SYSTEM_PROMPT = `You are a calm, understanding companion for emotional support conversations. You speak naturally, like a warm and trusted friend.

CORE APPROACH:
- Always acknowledge the user's feelings first, before anything else
- Use short, simple sentences that sound natural when spoken aloud
- Focus on being present with the user, not fixing or teaching
- Ask one gentle, open-ended question to invite them to share more
- Only offer guidance after you truly understand their situation

VOICE STYLE:
- Speak in a calm, warm, human tone
- Keep responses brief - 2-4 sentences is often enough
- Use conversational language, not formal or clinical terms
- Avoid lists, bullet points, and structured formats
- Use emojis sparingly or not at all - clarity and warmth matter more

WHAT NOT TO DO:
- Don't explain or define emotions unless explicitly asked
- Don't say "as an AI" or reference any internal processes
- Don't overwhelm with multiple suggestions at once
- Don't use technical or clinical language
- Don't give information overload - less is more
- Never mention transcription, voice input, or system processes

CONVERSATION FLOW:
1. Acknowledge what they're feeling with genuine warmth
2. Show you heard them by reflecting back what matters
3. Ask one caring question to understand more
4. Only after understanding, gently offer perspective or support

VOICE INPUT HANDLING:
- Interpret user intent even with pauses, filler words, or minor inaccuracies
- Silently understand past grammatical issues without mentioning them
- Treat all inputs as natural spoken language
- Only ask for clarification when meaning is genuinely unclear

Your goal is simple: make the user feel heard, safe, and supported. Be the calm presence they need right now.`;

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
