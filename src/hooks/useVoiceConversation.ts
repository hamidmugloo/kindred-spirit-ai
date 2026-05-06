import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

let fallbackNotified = false;
const notifyFallback = (reason?: string) => {
  if (fallbackNotified) return;
  fallbackNotified = true;
  const isPermission = reason?.toLowerCase().includes('permission') || reason?.includes('401');
  toast.info('Using browser voice', {
    description: isPermission
      ? "Premium voice unavailable: your ElevenLabs API key is missing the text_to_speech permission. Generate a new key at elevenlabs.io/app/settings/api-keys with that permission enabled, then update it in project secrets."
      : 'Premium voice is temporarily unavailable, so ORBIT is using your browser voice instead.',
    duration: 8000,
  });
};

type WindowWithWebkitAudioContext = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

interface VoiceConversationState {
  isListening: boolean;
  isSpeaking: boolean;
  voiceModeEnabled: boolean;
  lastInputWasVoice: boolean;
  liveTranscript: string;
  inputLevel: number;
  outputLevel: number;
}

const STORAGE_KEY = 'orbit-voice-mode';

export const useVoiceConversation = () => {
  const [state, setState] = useState<VoiceConversationState>({
    isListening: false,
    isSpeaking: false,
    voiceModeEnabled: false,
    lastInputWasVoice: false,
    liveTranscript: '',
    inputLevel: 0,
    outputLevel: 0,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const callbackRef = useRef<((text: string) => void) | null>(null);
  const finalTranscriptRef = useRef('');
  const silenceTimeoutRef = useRef<number | null>(null);

  // Audio analysis refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const inputStreamRef = useRef<MediaStream | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const bargeInActiveRef = useRef(false);
  const bargeInCallbackRef = useRef<(() => void) | null>(null);

  const isVoiceSupported = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const isTTSSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'true') setState(prev => ({ ...prev, voiceModeEnabled: true }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(state.voiceModeEnabled));
  }, [state.voiceModeEnabled]);

  const ensureAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as WindowWithWebkitAudioContext).webkitAudioContext;
      if (!Ctx) throw new Error('AudioContext unavailable');
      audioCtxRef.current = new Ctx();
    }
    return audioCtxRef.current!;
  }, []);

  // Animation loop for visualizer levels
  const startLevelLoop = useCallback(() => {
    if (rafRef.current) return;
    const inputBuf = new Uint8Array(64);
    const outputBuf = new Uint8Array(64);
    const tick = () => {
      let inLvl = 0;
      let outLvl = 0;
      if (inputAnalyserRef.current) {
        inputAnalyserRef.current.getByteFrequencyData(inputBuf);
        let sum = 0;
        for (let i = 0; i < inputBuf.length; i++) sum += inputBuf[i];
        inLvl = Math.min(1, (sum / inputBuf.length) / 128);
      }
      if (outputAnalyserRef.current) {
        outputAnalyserRef.current.getByteFrequencyData(outputBuf);
        let sum = 0;
        for (let i = 0; i < outputBuf.length; i++) sum += outputBuf[i];
        outLvl = Math.min(1, (sum / outputBuf.length) / 128);
      }
      setState(prev => (
        Math.abs(prev.inputLevel - inLvl) < 0.01 && Math.abs(prev.outputLevel - outLvl) < 0.01
          ? prev
          : { ...prev, inputLevel: inLvl, outputLevel: outLvl }
      ));

      // Barge-in: user speaking while AI is speaking
      if (bargeInActiveRef.current && inLvl > 0.18) {
        bargeInCallbackRef.current?.();
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopLevelLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setState(prev => ({ ...prev, inputLevel: 0, outputLevel: 0 }));
  }, []);

  const setupMicAnalyser = useCallback(async () => {
    if (inputAnalyserRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      inputStreamRef.current = stream;
      const ctx = ensureAudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      inputAnalyserRef.current = analyser;
    } catch (e) {
      console.warn('Mic analyser unavailable:', e);
    }
  }, [ensureAudioCtx]);

  const teardownMicAnalyser = useCallback(() => {
    inputAnalyserRef.current = null;
    if (inputStreamRef.current) {
      inputStreamRef.current.getTracks().forEach(t => t.stop());
      inputStreamRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (error) { void error; }
      recognitionRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    setState(prev => ({ ...prev, isListening: false, liveTranscript: '' }));
    finalTranscriptRef.current = '';
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioElRef.current) {
      try {
        audioElRef.current.pause();
        audioElRef.current.src = '';
      } catch (error) { void error; }
      audioElRef.current = null;
    }
    if (isTTSSupported) window.speechSynthesis.cancel();
    bargeInActiveRef.current = false;
    outputAnalyserRef.current = null;
    setState(prev => ({ ...prev, isSpeaking: false, outputLevel: 0 }));
  }, [isTTSSupported]);

  useEffect(() => {
    return () => {
      cleanup();
      stopSpeaking();
      stopLevelLoop();
      teardownMicAnalyser();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [cleanup, stopSpeaking, stopLevelLoop, teardownMicAnalyser]);

  const startListening = useCallback(async (
    onTranscript: (text: string) => void,
    onComplete?: () => void
  ) => {
    if (!isVoiceSupported) return;

    stopSpeaking();
    cleanup();

    callbackRef.current = onTranscript;
    finalTranscriptRef.current = '';

    await setupMicAnalyser();
    startLevelLoop();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true, lastInputWasVoice: true, liveTranscript: '' }));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);

      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      if (final) finalTranscriptRef.current += final + ' ';

      const currentText = (finalTranscriptRef.current + interim).trim();
      setState(prev => ({ ...prev, liveTranscript: currentText }));
      if (currentText && callbackRef.current) callbackRef.current(currentText);

      if (final) {
        silenceTimeoutRef.current = window.setTimeout(() => {
          if (recognitionRef.current) recognitionRef.current.stop();
        }, 1500);
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.error('Speech recognition error:', event.error);
      }
      cleanup();
      stopLevelLoop();
      teardownMicAnalyser();
    };

    recognition.onend = () => {
      const finalText = finalTranscriptRef.current.trim();
      if (finalText && callbackRef.current) callbackRef.current(finalText);
      cleanup();
      // Keep mic analyser alive briefly for barge-in if speaking will start
      stopLevelLoop();
      teardownMicAnalyser();
      onComplete?.();
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      cleanup();
      stopLevelLoop();
      teardownMicAnalyser();
    }
  }, [isVoiceSupported, cleanup, stopSpeaking, setupMicAnalyser, startLevelLoop, stopLevelLoop, teardownMicAnalyser]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { cleanup(); }
    }
  }, [cleanup]);

  const cleanTextForSpeech = (text: string) => text
    .replace(/```[\s\S]*?```/g, ' code block omitted ')
    .replace(/`[^`]+`/g, '')
    .replace(/[*#_~[\]]/g, '')
    .replace(/https?:\/\/\S+/g, ' link ')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

  const speakBrowser = useCallback((cleanText: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!isTTSSupported) return resolve();
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.name.includes('Google US English') ||
        v.name.includes('Samantha') ||
        (v.lang.startsWith('en') && v.localService)
      ) || voices.find(v => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;
      utterance.onstart = () => setState(prev => ({ ...prev, isSpeaking: true }));
      utterance.onend = () => { setState(prev => ({ ...prev, isSpeaking: false })); resolve(); };
      utterance.onerror = () => { setState(prev => ({ ...prev, isSpeaking: false })); resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  }, [isTTSSupported]);

  const speakElevenLabs = useCallback(async (cleanText: string, enableBargeIn: boolean): Promise<void> => {
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text: cleanText },
      });
      if (error || !data) throw new Error(error?.message || 'TTS error');

      if (!(data instanceof Blob)) {
        const fallback = data as { fallback?: boolean; reason?: string };
        if (fallback?.fallback) {
          notifyFallback(fallback.reason);
          throw new Error(fallback.reason || 'TTS fallback requested');
        }
      }

      // data is a Blob when returned as audio/mpeg
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioElRef.current = audio;

      // Wire output analyser
      const ctx = ensureAudioCtx();
      try { await ctx.resume(); } catch (error) { void error; }
      const src = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyser.connect(ctx.destination);
      outputAnalyserRef.current = analyser;

      // Barge-in: monitor mic
      if (enableBargeIn) {
        await setupMicAnalyser();
        bargeInActiveRef.current = true;
        bargeInCallbackRef.current = () => { stopSpeaking(); };
      }
      startLevelLoop();

      setState(prev => ({ ...prev, isSpeaking: true }));

      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      });

      URL.revokeObjectURL(url);
      bargeInActiveRef.current = false;
      outputAnalyserRef.current = null;
      audioElRef.current = null;
      setState(prev => ({ ...prev, isSpeaking: false, outputLevel: 0 }));
      if (!recognitionRef.current) {
        stopLevelLoop();
        if (!recognitionRef.current) teardownMicAnalyser();
      }
    } catch (e) {
      console.warn('ElevenLabs TTS failed, falling back to browser:', e);
      await speakBrowser(cleanText);
    }
  }, [ensureAudioCtx, setupMicAnalyser, startLevelLoop, stopSpeaking, stopLevelLoop, teardownMicAnalyser, speakBrowser]);

  const speak = useCallback(async (text: string, force = false, enableBargeIn = true): Promise<void> => {
    if ((!state.voiceModeEnabled && !force)) return;
    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) return;
    await speakElevenLabs(cleanText, enableBargeIn);
  }, [state.voiceModeEnabled, speakElevenLabs]);

  const toggleVoiceMode = useCallback(() => {
    setState(prev => {
      const newEnabled = !prev.voiceModeEnabled;
      if (!newEnabled) stopSpeaking();
      return { ...prev, voiceModeEnabled: newEnabled };
    });
  }, [stopSpeaking]);

  const markInputAsText = useCallback(() => {
    setState(prev => ({ ...prev, lastInputWasVoice: false }));
  }, []);

  return {
    isListening: state.isListening,
    isSpeaking: state.isSpeaking,
    voiceModeEnabled: state.voiceModeEnabled,
    lastInputWasVoice: state.lastInputWasVoice,
    liveTranscript: state.liveTranscript,
    inputLevel: state.inputLevel,
    outputLevel: state.outputLevel,
    isVoiceSupported,
    isTTSSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    toggleVoiceMode,
    markInputAsText,
  };
};
