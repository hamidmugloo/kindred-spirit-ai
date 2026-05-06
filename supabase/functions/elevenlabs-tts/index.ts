const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const fallbackResponse = (reason: string, providerStatus?: number) =>
  new Response(JSON.stringify({ fallback: true, reason, providerStatus }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      return fallbackResponse('ELEVENLABS_API_KEY not configured');
    }

    const { text, voiceId } = await req.json();
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'text required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const voice = voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Sarah - calm, warm
    const trimmed = text.slice(0, 4500);

    const resp = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: trimmed,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
        }),
      }
    );

    if (!resp.ok || !resp.body) {
      const err = await resp.text();
      console.warn(`ElevenLabs TTS unavailable: ${resp.status} ${err}`);
      return fallbackResponse(`TTS unavailable: ${err || resp.statusText}`, resp.status);
    }

    return new Response(resp.body, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
