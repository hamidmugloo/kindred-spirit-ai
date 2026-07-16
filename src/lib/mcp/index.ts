import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listConversations from "./tools/list-conversations";
import getConversationMessages from "./tools/get-conversation-messages";
import listMemories from "./tools/list-memories";
import saveMemory from "./tools/save-memory";
import listJournalEntries from "./tools/list-journal-entries";
import createJournalEntry from "./tools/create-journal-entry";
import logMood from "./tools/log-mood";
import listMoods from "./tools/list-moods";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "orbit-mcp",
  title: "ORBIT",
  version: "0.1.0",
  instructions:
    "Tools for ORBIT — the user's personal AI assistant. Read/write access to the signed-in user's conversations, memories, journal entries, and mood log. All calls are scoped to the authenticated user via RLS. Never store medical diagnoses, medications, or mental health conditions in memories.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listConversations,
    getConversationMessages,
    listMemories,
    saveMemory,
    listJournalEntries,
    createJournalEntry,
    logMood,
    listMoods,
  ],
});
