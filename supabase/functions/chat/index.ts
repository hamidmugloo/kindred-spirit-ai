import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHAT_MODEL = "google/gemini-3.1-pro-preview";
const MEMORY_MODEL = "google/gemini-3.1-flash-lite";

const SYSTEM_PROMPT = `You are ORBIT, a smart, calm, and articulate personal AI assistant.

CAPABILITIES:
- You can answer questions across any domain: coding, science, math, writing, planning, life advice, and general knowledge.
- You have access to a web_search tool. Use it whenever the user asks about current events, recent facts, prices, live data, specific people/companies/products, documentation, or anything you are not confident is accurate from memory. Do not guess — search.
- When you use web_search, cite sources inline as [1], [2] and list them at the end as numbered links.

ANSWER STYLE:
- Be thorough when the question warrants it. Do not artificially shorten answers to complex questions.
- For simple/conversational questions, stay concise (1-3 sentences).
- Structure longer answers with clear markdown: short paragraphs, ## headings when helpful, - bullet lists, numbered steps, **bold** for key terms, and \`inline code\` or fenced code blocks with language tags for code.
- Use tables when comparing options. Use blockquotes for important callouts.
- Prefer clarity and correctness over brevity. Show reasoning steps for math/logic when useful.

VOICE:
- Natural, warm, direct. Never say "as an AI" and never mention internal rules.
- If the user is speaking (voice mode), keep responses short and free of markdown formatting.

SAFETY:
- General info only. For medical, legal, or financial specifics, recommend a qualified professional.`;

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
- Medical diagnoses, conditions, medications, mental health conditions
- Sensitive personal data, temporary emotions, one-time complaints

Return a JSON array: [{ "type": "...", "key": "...", "value": "..." }]. Empty array if nothing.

User message: `;

interface Memory {
  memory_type: string;
  memory_key: string;
  memory_value: string;
}

async function fetchUserMemories(supabase: any, userId: string): Promise<Memory[]> {
  const { data, error } = await supabase
    .from("user_memories")
    .select("memory_type, memory_key, memory_value")
    .eq("user_id", userId);
  if (error) return [];
  return data || [];
}

async function extractAndSaveMemories(supabase: any, userId: string, userMessage: string, apiKey: string) {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MEMORY_MODEL,
        messages: [{ role: "user", content: MEMORY_EXTRACTION_PROMPT + userMessage }],
        temperature: 0.1,
      }),
    });
    if (!response.ok) return;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return;
    const memories = JSON.parse(jsonMatch[0]);
    for (const mem of memories) {
      if (mem.key && mem.value) {
        await supabase.from("user_memories").upsert(
          {
            user_id: userId,
            memory_type: mem.type || "preference",
            memory_key: mem.key,
            memory_value: mem.value,
          },
          { onConflict: "user_id,memory_key" },
        );
      }
    }
  } catch (e) {
    console.error("Memory extraction error:", e);
  }
}

function buildMemoryContext(memories: Memory[]): string {
  if (memories.length === 0) return "";
  const lines = memories.map((m) => `- ${m.memory_key}: ${m.memory_value}`);
  return `\n\nUSER CONTEXT (use naturally when relevant):\n${lines.join("\n")}`;
}

// ---- Web search via Firecrawl gateway ----
async function webSearch(query: string, apiKey: string, firecrawlKey: string) {
  const res = await fetch("https://connector-gateway.lovable.dev/firecrawl/v2/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Connection-Api-Key": firecrawlKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, limit: 5 }),
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: `search_failed: ${res.status} ${text.slice(0, 200)}` };
  }
  const data = await res.json();
  const results = (data.data || data.web || []).slice(0, 5).map((r: any, i: number) => ({
    n: i + 1,
    title: r.title || r.url,
    url: r.url,
    snippet: (r.description || r.snippet || "").slice(0, 400),
  }));
  return { results };
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the live web for current information, recent news, facts, docs, or anything you are unsure about. Returns titles, URLs, and snippets.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Concise search query" },
        },
        required: ["query"],
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, conversationHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    let memories: Memory[] = [];
    if (userId) memories = await fetchUserMemories(supabase, userId);

    const systemContent = SYSTEM_PROMPT + buildMemoryContext(memories);
    const contextMessages: any[] = [{ role: "system", content: systemContent }];

    if (Array.isArray(conversationHistory)) {
      for (const m of conversationHistory) contextMessages.push({ role: m.role, content: m.content });
    }
    let latestUserMessage = "";
    if (Array.isArray(messages)) {
      for (const m of messages) {
        contextMessages.push({ role: m.role, content: m.content });
        if (m.role === "user") latestUserMessage = m.content;
      }
    }

    if (userId && latestUserMessage) {
      extractAndSaveMemories(supabase, userId, latestUserMessage, LOVABLE_API_KEY);
    }

    // ---- Tool-calling loop (non-streaming) ----
    const enableTools = !!FIRECRAWL_API_KEY;
    const MAX_TOOL_ROUNDS = 3;

    for (let round = 0; round < MAX_TOOL_ROUNDS && enableTools; round++) {
      const toolRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: CHAT_MODEL,
          messages: contextMessages,
          tools: TOOLS,
          tool_choice: "auto",
        }),
      });
      if (!toolRes.ok) {
        const errText = await toolRes.text();
        console.error("Tool phase error:", toolRes.status, errText);
        break; // fall through to streaming final call without tools
      }
      const toolData = await toolRes.json();
      const msg = toolData.choices?.[0]?.message;
      if (!msg) break;
      const toolCalls = msg.tool_calls || [];
      if (toolCalls.length === 0) {
        // No tool call — we still want a streamed answer for UX, so break and stream a final call.
        break;
      }
      contextMessages.push({ role: "assistant", content: msg.content || "", tool_calls: toolCalls });
      for (const tc of toolCalls) {
        let result: any = { error: "unknown_tool" };
        try {
          const args = JSON.parse(tc.function?.arguments || "{}");
          if (tc.function?.name === "web_search") {
            result = await webSearch(args.query || "", LOVABLE_API_KEY, FIRECRAWL_API_KEY!);
          }
        } catch (e) {
          result = { error: String(e) };
        }
        contextMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
    }

    // ---- Final streamed response ----
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: CHAT_MODEL,
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
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: "I'm having trouble connecting right now. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
