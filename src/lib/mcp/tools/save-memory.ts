declare const process: { env: Record<string, string | undefined> };
import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function client(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "save_memory",
  title: "Save memory",
  description: "Save or update a long-term memory for the signed-in user. Do not store medical diagnoses, medications, or mental health conditions.",
  inputSchema: {
    memory_type: z.string().min(1).describe("Category (e.g. preference, fact, context)."),
    memory_key: z.string().min(1).describe("Stable key for this memory."),
    memory_value: z.string().min(1).describe("Memory value / content."),
  },
  annotations: { readOnlyHint: false, openWorldHint: false },
  handler: async ({ memory_type, memory_key, memory_value }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = client(ctx);
    const user_id = ctx.getUserId();
    const { data: existing } = await supabase
      .from("user_memories")
      .select("id")
      .eq("user_id", user_id)
      .eq("memory_key", memory_key)
      .maybeSingle();
    if (existing?.id) {
      const { data, error } = await supabase
        .from("user_memories")
        .update({ memory_type, memory_value, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      return { content: [{ type: "text", text: "Memory updated." }], structuredContent: { memory: data } };
    }
    const { data, error } = await supabase
      .from("user_memories")
      .insert({ user_id, memory_type, memory_key, memory_value })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: "Memory saved." }], structuredContent: { memory: data } };
  },
});
