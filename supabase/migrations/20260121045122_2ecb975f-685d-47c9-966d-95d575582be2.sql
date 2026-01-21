-- Add unique constraint for upsert to work
ALTER TABLE public.user_memories ADD CONSTRAINT user_memories_user_id_memory_key_unique UNIQUE (user_id, memory_key);