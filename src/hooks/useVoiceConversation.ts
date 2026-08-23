import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Unified voice conversation engine for ORBIT.
 *
 * State machine: idle -> listening -> processing -> speaking -> idle
 * Any failure routes to `error` and then back to `idle`.
 *
 * Responsibilities:
 *  - Speech recognition (Web Speech API) with a single active session guard
 *  - Mic level metering for visualisers
 *  - Text to speech (ElevenLabs via edge function, browser speechSynthesis fallback)
 *  - Deterministic cleanup (no stray mic, no overlapping audio)
 */

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

type WindowWithWebkitAudioContext = Window &
  typeof globalThis & { webkitAudioContext?: typeof AudioContext };

const STORAGE_KEY = 'orbit-voice-mode';
const SILENCE_MS = 1800;
const MAX_LISTEN_MS = 30000;

const isMobileUA = () =>
  typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const friendlyRecognitionError = (code: string): string => {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was blocked. Allow the microphone in your browser settings and try again.';
    case 'audio-capture':
      return 'No microphone was found. Check your device and try again.';
    case 'no-speech':
      return "I didn't catch anything. Tap the mic and speak again.";
    case 'network':
      return 'Speech recognition needs a connection. Check your network and try again.';
    case 'aborted':
      return '';
    default:
      return 'Voice input stopped unexpectedly. Tap the mic to try again.';
  }
};

export const cleanTextForSpeech = (text: string) =>
  text
    .replace(/```[\s\S]*?```/g, ' code block omitted. ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' link ')
    .replace(/[*#_~[\]>|]/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

export const useVoiceConversation = () => {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);
  const [lastInputWasVoice, setLastInputWasVoice] = useState(false);

  const isSupported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const isTTSSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // --- refs -----------------------------------------------------------------
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const startingRef = useRef(false); // guards rapid double-taps
  const finalTranscriptRef = useRef('');
  const onFinalRef = useRef<((text: string) => void) | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const maxTimerRef = useRef<number | null>(null);
  const unmountedRef = useRef(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const speakTokenRef = useRef(0);

  const safeSet = useCallback(<T,>(setter: (v: T) => void, value: T) => {
    if (!unmountedRef.current) setter(value);
  }, []);

  // --- persisted voice mode -------------------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setVoiceModeEnabled(localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, String(voiceModeEnabled));
  }, [voiceModeEnabled]);

  // --- timers ---------------------------------------------------------------
  const clearTimers = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  }, []);

  // --- mic metering ---------------------------------------------------------
  const stopMeter = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    safeSet(setInputLevel, 0);
  }, [safeSet]);

  const releaseMic = useCallback(() => {
    micAnalyserRef.current = null;
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
  }, []);

  const startMeter = useCallback(() => {
    if (rafRef.current) return;
    const buf = new Uint8Array(64);
    const tick = () => {
      if (micAnalyserRef.current) {
        micAnalyserRef.current.getByteFrequencyData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i];
        const level = Math.min(1, sum / buf.length / 110);
        setInputLevel((prev) => (Math.abs(prev - level) < 0.02 ? prev : level));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const setupMeter = useCallback(async () => {
    if (micAnalyserRef.current || typeof navigator === 'undefined') return;
    if (!navigator.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      if (unmountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      micStreamRef.current = stream;
      const Ctx =
        window.AudioContext || (window as WindowWithWebkitAudioContext).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      micAnalyserRef.current = analyser;
      startMeter();
    } catch {
      // Metering is decorative — recognition still works without it.
    }
  }, [startMeter]);

  // --- speaking -------------------------------------------------------------
  const stopSpeaking = useCallback(() => {
    speakTokenRef.current += 1; // invalidate any in-flight speak()
    const el = audioElRef.current;
    if (el) {
      try {
        el.pause();
        el.onended = null;
        el.onerror = null;
        el.src = '';
      } catch {
        /* noop */
      }
      audioElRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (isTTSSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* noop */
      }
    }
    safeSet(setOutputLevel, 0);
    setStatus((s) => (s === 'speaking' ? 'idle' : s));
  }, [isTTSSupported, safeSet]);

  // --- listening ------------------------------------------------------------
  const teardownRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      rec.onstart = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    }
    clearTimers();
    stopMeter();
    releaseMic();
  }, [clearTimers, stopMeter, releaseMic]);

  const stopListening = useCallback(() => {
    clearTimers();
    const rec = recognitionRef.current;
    if (!rec) {
      setStatus((s) => (s === 'listening' ? 'idle' : s));
      return;
    }
    try {
      rec.stop(); // graceful: onend still delivers the final transcript
    } catch {
      teardownRecognition();
      setStatus('idle');
    }
  }, [clearTimers, teardownRecognition]);

  const cancelListening = useCallback(() => {
    onFinalRef.current = null;
    finalTranscriptRef.current = '';
    teardownRecognition();
    safeSet(setLiveTranscript, '');
    setStatus((s) => (s === 'listening' ? 'idle' : s));
  }, [teardownRecognition, safeSet]);

  const startListening = useCallback(
    async (onFinal?: (text: string) => void) => {
      if (!isSupported) {
        setError('Voice input is not supported in this browser. Try Chrome on desktop or Android.');
        setStatus('error');
        return;
      }
      // Single-session guard: ignore rapid repeat taps.
      if (startingRef.current || recognitionRef.current) return;
      startingRef.current = true;

      stopSpeaking();
      teardownRecognition();
      setError(null);
      setLiveTranscript('');
      finalTranscriptRef.current = '';
      onFinalRef.current = onFinal ?? null;

      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      let recognition: SpeechRecognition;
      try {
        recognition = new SR();
      } catch {
        startingRef.current = false;
        setError('Voice input could not start on this device.');
        setStatus('error');
        return;
      }

      // Mobile engines are unreliable with continuous mode.
      recognition.continuous = !isMobileUA();
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = navigator.language || 'en-US';

      const finish = (deliver: boolean) => {
        clearTimers();
        const cb = onFinalRef.current;
        const text = finalTranscriptRef.current.trim();
        onFinalRef.current = null;
        finalTranscriptRef.current = '';
        recognitionRef.current = null;
        stopMeter();
        releaseMic();
        safeSet(setLiveTranscript, '');
        if (deliver && text) {
          setLastInputWasVoice(true);
          setStatus('processing');
          cb?.(text);
        } else {
          setStatus((s) => (s === 'listening' ? 'idle' : s));
        }
      };

      recognition.onstart = () => {
        startingRef.current = false;
        if (unmountedRef.current) return;
        setStatus('listening');
        maxTimerRef.current = window.setTimeout(() => {
          try {
            recognitionRef.current?.stop();
          } catch {
            /* noop */
          }
        }, MAX_LISTEN_MS);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += t;
          else interim += t;
        }
        if (final) finalTranscriptRef.current += final + ' ';
        safeSet(setLiveTranscript, (finalTranscriptRef.current + interim).trim());

        // Auto-submit after a natural pause.
        silenceTimerRef.current = window.setTimeout(() => {
          try {
            recognitionRef.current?.stop();
          } catch {
            /* noop */
          }
        }, SILENCE_MS);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        startingRef.current = false;
        const msg = friendlyRecognitionError(event.error);
        const hasText = !!finalTranscriptRef.current.trim();
        if (msg && !hasText) {
          safeSet(setError, msg);
          finish(false);
          setStatus('error');
          return;
        }
        finish(hasText);
      };

      recognition.onend = () => {
        startingRef.current = false;
        finish(true);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        startingRef.current = false;
        teardownRecognition();
        setError('Voice input could not start. Please try again.');
        setStatus('error');
        return;
      }

      // Metering runs alongside; failure here never blocks recognition.
      void setupMeter();
    },
    [
      isSupported,
      stopSpeaking,
      teardownRecognition,
      clearTimers,
      stopMeter,
      releaseMic,
      setupMeter,
      safeSet,
    ]
  );

  // --- TTS ------------------------------------------------------------------
  const speakBrowser = useCallback(
    (text: string, token: number) =>
      new Promise<void>((resolve) => {
        if (!isTTSSupported) return resolve();
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1.03;
          const voices = window.speechSynthesis.getVoices();
          const preferred =
            voices.find((v) => /Google US English|Samantha|Microsoft Aria/i.test(v.name)) ||
            voices.find((v) => v.lang.startsWith('en'));
          if (preferred) utterance.voice = preferred;
          let done = false;
          const end = () => {
            if (done) return;
            done = true;
            resolve();
          };
          utterance.onend = end;
          utterance.onerror = end;
          if (speakTokenRef.current !== token) return resolve();
          window.speechSynthesis.speak(utterance);
          // Safety net: some engines never fire onend.
          window.setTimeout(end, Math.min(60000, 3000 + text.length * 90));
        } catch {
          resolve();
        }
      }),
    [isTTSSupported]
  );

  const speak = useCallback(
    async (rawText: string): Promise<void> => {
      const text = cleanTextForSpeech(rawText);
      if (!text) return;

      stopSpeaking();
      const token = ++speakTokenRef.current;
      setStatus('speaking');

      // Simple synthetic output animation (playback stays on a plain <audio>
      // element so mobile autoplay/routing is never broken by WebAudio graphs).
      let pulse = 0;
      const pulseTimer = window.setInterval(() => {
        pulse += 0.35;
        if (speakTokenRef.current === token) {
          setOutputLevel(0.35 + Math.abs(Math.sin(pulse)) * 0.5);
        }
      }, 90);

      const finishSpeak = () => {
        clearInterval(pulseTimer);
        if (speakTokenRef.current !== token) return; // superseded/stopped
        audioElRef.current = null;
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
        safeSet(setOutputLevel, 0);
        setStatus((s) => (s === 'speaking' ? 'idle' : s));
      };

      try {
        const { data, error: fnError } = await supabase.functions.invoke('elevenlabs-tts', {
          body: { text },
        });
        if (speakTokenRef.current !== token) {
          clearInterval(pulseTimer);
          return;
        }
        if (fnError || !data) throw new Error(fnError?.message || 'TTS unavailable');

        const isBlob = data instanceof Blob && data.type.includes('audio');
        if (!isBlob) throw new Error('TTS fallback');

        const url = URL.createObjectURL(data);
        audioUrlRef.current = url;
        const audio = new Audio(url);
        audio.preload = 'auto';
        audioElRef.current = audio;

        await new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          audio.play().catch(() => resolve());
        });
        finishSpeak();
      } catch {
        if (speakTokenRef.current !== token) {
          clearInterval(pulseTimer);
          return;
        }
        // Graceful fallback: browser voice.
        await speakBrowser(text, token);
        finishSpeak();
      }
    },
    [stopSpeaking, speakBrowser, safeSet]
  );

  // --- status helpers -------------------------------------------------------
  const setProcessing = useCallback(() => setStatus('processing'), []);
  const setIdle = useCallback(() => {
    setError(null);
    setStatus('idle');
  }, []);
  const reportError = useCallback((message: string) => {
    setError(message);
    setStatus('error');
  }, []);

  const enableVoiceMode = useCallback(() => setVoiceModeEnabled(true), []);
  const disableVoiceMode = useCallback(() => setVoiceModeEnabled(false), []);
  const markInputAsText = useCallback(() => setLastInputWasVoice(false), []);

  // --- global cleanup -------------------------------------------------------
  useEffect(() => {
    unmountedRef.current = false;
    const handleHidden = () => {
      if (document.visibilityState === 'hidden') {
        // Never leave the mic hot when the user navigates away.
        onFinalRef.current = null;
        teardownRecognition();
        stopSpeaking();
      }
    };
    document.addEventListener('visibilitychange', handleHidden);
    window.addEventListener('pagehide', handleHidden);
    return () => {
      document.removeEventListener('visibilitychange', handleHidden);
      window.removeEventListener('pagehide', handleHidden);
    };
  }, [teardownRecognition, stopSpeaking]);

  useEffect(() => {
    return () => {
      unmountedRef.current = true;
      onFinalRef.current = null;
      teardownRecognition();
      stopSpeaking();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [teardownRecognition, stopSpeaking]);

  return {
    // state
    status,
    error,
    isListening: status === 'listening',
    isProcessing: status === 'processing',
    isSpeaking: status === 'speaking',
    liveTranscript,
    inputLevel,
    outputLevel,
    voiceModeEnabled,
    lastInputWasVoice,
    isSupported,
    isTTSSupported,
    // actions
    startListening,
    stopListening,
    cancelListening,
    speak,
    stopSpeaking,
    setProcessing,
    setIdle,
    reportError,
    enableVoiceMode,
    disableVoiceMode,
    markInputAsText,
  };
};
