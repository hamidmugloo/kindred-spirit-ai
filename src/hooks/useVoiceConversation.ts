 import { useState, useCallback, useRef, useEffect } from 'react';
 
 interface VoiceConversationState {
   isListening: boolean;
   isSpeaking: boolean;
   voiceModeEnabled: boolean;
   lastInputWasVoice: boolean;
 }
 
 const STORAGE_KEY = 'orbit-voice-mode';
 
 /**
  * Unified voice conversation hook for ChatGPT-like experience
  * - Tap mic → speak → auto-stop → AI responds → auto-speak → repeat
  */
 export const useVoiceConversation = () => {
   const [state, setState] = useState<VoiceConversationState>({
     isListening: false,
     isSpeaking: false,
     voiceModeEnabled: false,
     lastInputWasVoice: false,
   });
 
   const recognitionRef = useRef<SpeechRecognition | null>(null);
   const callbackRef = useRef<((text: string) => void) | null>(null);
   const finalTranscriptRef = useRef('');
   const silenceTimeoutRef = useRef<number | null>(null);
 
   // Check browser support
   const isVoiceSupported = typeof window !== 'undefined' && 
     !!(window.SpeechRecognition || window.webkitSpeechRecognition);
   const isTTSSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
 
   // Load voice mode preference
   useEffect(() => {
     if (typeof window !== 'undefined') {
       const saved = localStorage.getItem(STORAGE_KEY);
       if (saved === 'true') {
         setState(prev => ({ ...prev, voiceModeEnabled: true }));
       }
     }
   }, []);
 
   // Save voice mode preference
   useEffect(() => {
     localStorage.setItem(STORAGE_KEY, String(state.voiceModeEnabled));
   }, [state.voiceModeEnabled]);
 
   // Cleanup on unmount
   useEffect(() => {
     return () => {
       if (recognitionRef.current) {
         try { recognitionRef.current.abort(); } catch {}
       }
       if (isTTSSupported) {
         window.speechSynthesis.cancel();
       }
       if (silenceTimeoutRef.current) {
         clearTimeout(silenceTimeoutRef.current);
       }
     };
   }, [isTTSSupported]);
 
   // Preload voices for better TTS
   useEffect(() => {
     if (isTTSSupported) {
       window.speechSynthesis.getVoices();
       window.speechSynthesis.onvoiceschanged = () => {
         window.speechSynthesis.getVoices();
       };
     }
   }, [isTTSSupported]);
 
   const cleanup = useCallback(() => {
     if (recognitionRef.current) {
       try { recognitionRef.current.abort(); } catch {}
       recognitionRef.current = null;
     }
     if (silenceTimeoutRef.current) {
       clearTimeout(silenceTimeoutRef.current);
       silenceTimeoutRef.current = null;
     }
     setState(prev => ({ ...prev, isListening: false }));
     finalTranscriptRef.current = '';
   }, []);
 
   const stopSpeaking = useCallback(() => {
     if (isTTSSupported) {
       window.speechSynthesis.cancel();
       setState(prev => ({ ...prev, isSpeaking: false }));
     }
   }, [isTTSSupported]);
 
   const startListening = useCallback((onTranscript: (text: string) => void, onComplete?: () => void) => {
     if (!isVoiceSupported) return;
 
     // Stop any ongoing speech when mic is tapped (interrupt)
     stopSpeaking();
     cleanup();
 
     callbackRef.current = onTranscript;
     finalTranscriptRef.current = '';
 
     const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
     const recognition = new SpeechRecognition();
 
     // Mobile-optimized settings
     recognition.continuous = true; // Keep listening for natural pauses
     recognition.interimResults = true;
     recognition.lang = navigator.language || 'en-US';
 
     recognition.onstart = () => {
       setState(prev => ({ ...prev, isListening: true, lastInputWasVoice: true }));
     };
 
     recognition.onresult = (event: SpeechRecognitionEvent) => {
       // Clear silence timeout on any result
       if (silenceTimeoutRef.current) {
         clearTimeout(silenceTimeoutRef.current);
       }
 
       let interimTranscript = '';
       let finalTranscript = '';
 
       for (let i = event.resultIndex; i < event.results.length; i++) {
         const transcript = event.results[i][0].transcript;
         if (event.results[i].isFinal) {
           finalTranscript += transcript;
         } else {
           interimTranscript += transcript;
         }
       }
 
       // Accumulate final transcript
       if (finalTranscript) {
         finalTranscriptRef.current += finalTranscript + ' ';
       }
 
       // Send current state to callback
       const currentText = finalTranscriptRef.current.trim() || interimTranscript;
       if (currentText && callbackRef.current) {
         callbackRef.current(currentText);
       }
 
       // Auto-stop after 1.5s of silence following final result
       if (finalTranscript) {
         silenceTimeoutRef.current = window.setTimeout(() => {
           if (recognitionRef.current) {
             recognitionRef.current.stop();
           }
         }, 1500);
       }
     };
 
     recognition.onerror = (event) => {
       if (event.error !== 'aborted' && event.error !== 'no-speech') {
         console.error('Speech recognition error:', event.error);
       }
       cleanup();
     };
 
     recognition.onend = () => {
       // Send final transcript
       if (finalTranscriptRef.current.trim() && callbackRef.current) {
         callbackRef.current(finalTranscriptRef.current.trim());
       }
       cleanup();
       onComplete?.();
     };
 
     recognitionRef.current = recognition;
 
     try {
       recognition.start();
     } catch (error) {
       console.error('Failed to start speech recognition:', error);
       cleanup();
     }
   }, [isVoiceSupported, cleanup, stopSpeaking]);
 
   const stopListening = useCallback(() => {
     if (recognitionRef.current) {
       try {
         recognitionRef.current.stop();
       } catch {
         cleanup();
       }
     }
   }, [cleanup]);
 
   const speak = useCallback((text: string, force = false): Promise<void> => {
     return new Promise((resolve) => {
       // Only speak if voice mode is enabled OR force is true
       if (!isTTSSupported || (!state.voiceModeEnabled && !force)) {
         resolve();
         return;
       }
 
       // Cancel any ongoing speech
       window.speechSynthesis.cancel();
 
       // Clean text for speech
       const cleanText = text
         .replace(/```[\s\S]*?```/g, ' code block omitted ')
         .replace(/`[^`]+`/g, '')
         .replace(/[*#_~\[\]]/g, '')
         .replace(/https?:\/\/\S+/g, ' link ')
         .replace(/\n+/g, '. ')
         .replace(/\s+/g, ' ')
         .trim();
 
       if (!cleanText) {
         resolve();
         return;
       }
 
       const utterance = new SpeechSynthesisUtterance(cleanText);
       utterance.rate = 1.05; // Slightly faster for natural feel
       utterance.pitch = 1.0;
       utterance.volume = 1.0;
 
       // Select best available voice
       const voices = window.speechSynthesis.getVoices();
       const preferredVoice = voices.find(v =>
         v.name.includes('Google US English') ||
         v.name.includes('Samantha') ||
         v.name.includes('Karen') ||
         v.name.includes('Daniel') ||
         (v.lang.startsWith('en') && v.localService)
       ) || voices.find(v => v.lang.startsWith('en'));
 
       if (preferredVoice) {
         utterance.voice = preferredVoice;
       }
 
       utterance.onstart = () => {
         setState(prev => ({ ...prev, isSpeaking: true }));
       };
 
       utterance.onend = () => {
         setState(prev => ({ ...prev, isSpeaking: false }));
         resolve();
       };
 
       utterance.onerror = () => {
         setState(prev => ({ ...prev, isSpeaking: false }));
         resolve();
       };
 
       window.speechSynthesis.speak(utterance);
     });
   }, [isTTSSupported, state.voiceModeEnabled]);
 
   const toggleVoiceMode = useCallback(() => {
     setState(prev => {
       const newEnabled = !prev.voiceModeEnabled;
       // Stop speaking when turning off
       if (!newEnabled && isTTSSupported) {
         window.speechSynthesis.cancel();
       }
       return { ...prev, voiceModeEnabled: newEnabled, isSpeaking: false };
     });
   }, [isTTSSupported]);
 
   const markInputAsText = useCallback(() => {
     setState(prev => ({ ...prev, lastInputWasVoice: false }));
   }, []);
 
   return {
     // State
     isListening: state.isListening,
     isSpeaking: state.isSpeaking,
     voiceModeEnabled: state.voiceModeEnabled,
     lastInputWasVoice: state.lastInputWasVoice,
     
     // Support flags
     isVoiceSupported,
     isTTSSupported,
     
     // Actions
     startListening,
     stopListening,
     speak,
     stopSpeaking,
     toggleVoiceMode,
     markInputAsText,
   };
 };