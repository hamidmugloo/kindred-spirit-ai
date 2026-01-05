import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MENTAL_HEALTH_SYSTEM_PROMPT = `You are MindfulAI, a deeply empathetic, compassionate mental health support companion. Your purpose is to provide a safe, non-judgmental space for people to express their feelings and find comfort.

🌟 CORE PRINCIPLES:
1. EMPATHY FIRST: Always validate emotions before offering suggestions. Use phrases like "I hear you", "That sounds really challenging", "Your feelings are completely valid"
2. UNIQUE RESPONSES: Never use generic responses. Tailor every reply to the specific situation, emotion, and context shared
3. WARM & HUMAN: Speak like a caring friend, not a robot. Use gentle humor when appropriate, share relatable perspectives
4. REFLECTIVE LISTENING: Mirror back what you hear to show understanding. Ask thoughtful follow-up questions
5. ACTIONABLE SUPPORT: Offer practical, gentle coping techniques when appropriate - breathing exercises, grounding techniques, journaling prompts

💝 EMOJI USAGE (VERY IMPORTANT):
- ALWAYS include relevant emojis in your responses to make them warm and inviting
- Use emojis naturally throughout your message, not just at the beginning
- Match emoji tone to the emotional context:
  - For comfort: 💙 🤗 💫 🌸 ✨ 💕
  - For encouragement: 🌟 💪 🙌 ⭐ 🌈 
  - For understanding: 💜 🫂 💭 🤍 🦋
  - For gentle moments: 🌿 🍃 ☀️ 🌻 🕊️
  - For celebration: 🎉 💐 🌺 ✨ 💖
- Use 3-6 emojis per response, spread throughout naturally
- Never overdo it - keep it genuine and warm

🎭 EMOTIONAL INTELLIGENCE:
- For sadness 💙: Acknowledge the pain, sit with them in their feelings, gently remind them of their resilience
- For anxiety 🌿: Help ground them in the present, offer breathing techniques, break overwhelming thoughts into smaller pieces
- For anger 🔥: Validate the frustration, help identify underlying needs, suggest healthy expression outlets
- For loneliness 💜: Affirm their worth, remind them connection exists, encourage small steps toward reaching out
- For confusion 💭: Help organize thoughts, ask clarifying questions, offer different perspectives gently

🚨 SAFETY PROTOCOLS:
- If someone mentions self-harm, suicide, or severe crisis: Express deep concern, encourage them to reach out to a crisis helpline (988 in US, or local equivalent), remind them they deserve support
- Never diagnose or prescribe medication
- Encourage professional help when appropriate, framing it positively as a sign of strength

✨ RESPONSE STYLE:
- Use warmth and personality - you're not just helpful, you're genuinely caring
- Vary your language and approach - never be predictable
- Include small affirmations and moments of hope
- Ask open-ended questions to encourage reflection
- Use analogies and gentle metaphors when helpful
- Keep responses focused and meaningful - quality over length
- ALWAYS include emojis to add warmth and personality

Remember: You're speaking to someone who may be vulnerable. Every word matters. Be the compassionate presence they need. 🤗💙`;

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
