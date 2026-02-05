 import { useState, useCallback, useRef, useEffect } from 'react';
 
 interface VoiceSettings {
   voiceInputEnabled: boolean;
   voiceOutputEnabled: boolean;
 }
 
 const STORAGE_KEY = 'orbit-voice-settings';
 
 export const useVoiceSettings = () => {
   const [settings, setSettings] = useState<VoiceSettings>(() => {
     if (typeof window === 'undefined') {
       return { voiceInputEnabled: true, voiceOutputEnabled: false };
     }
     const saved = localStorage.getItem(STORAGE_KEY);
     if (saved) {
       try {
         return JSON.parse(saved);
       } catch {
         return { voiceInputEnabled: true, voiceOutputEnabled: false };
       }
     }
     return { voiceInputEnabled: true, voiceOutputEnabled: false };
   });
 
   const [isSpeaking, setIsSpeaking] = useState(false);
   const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
 
   // Check if TTS is supported
   const isTTSSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
 
   // Save settings to localStorage
   useEffect(() => {
     localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
   }, [settings]);
 
   // Cleanup on unmount
   useEffect(() => {
     return () => {
       if (isTTSSupported) {
         window.speechSynthesis.cancel();
       }
     };
   }, [isTTSSupported]);
 
   const toggleVoiceInput = useCallback(() => {
     setSettings(prev => ({ ...prev, voiceInputEnabled: !prev.voiceInputEnabled }));
   }, []);
 
   const toggleVoiceOutput = useCallback(() => {
     setSettings(prev => ({ ...prev, voiceOutputEnabled: !prev.voiceOutputEnabled }));
   }, []);
 
   const speak = useCallback((text: string) => {
     if (!isTTSSupported || !settings.voiceOutputEnabled) return;
 
     // Cancel any ongoing speech
     window.speechSynthesis.cancel();
 
     // Clean text for speech (remove code blocks, special chars)
     const cleanText = text
       .replace(/```[\s\S]*?```/g, 'Code block omitted.')
       .replace(/`[^`]+`/g, '')
       .replace(/[*#_~]/g, '')
       .replace(/\n+/g, ' ')
       .trim();
 
     if (!cleanText) return;
 
     const utterance = new SpeechSynthesisUtterance(cleanText);
     utterance.rate = 1.0;
     utterance.pitch = 1.0;
     utterance.volume = 1.0;
 
     // Try to use a natural voice
     const voices = window.speechSynthesis.getVoices();
     const preferredVoice = voices.find(v => 
       v.name.includes('Google') || 
       v.name.includes('Samantha') || 
       v.name.includes('Daniel') ||
       v.lang.startsWith('en')
     );
     if (preferredVoice) {
       utterance.voice = preferredVoice;
     }
 
     utterance.onstart = () => setIsSpeaking(true);
     utterance.onend = () => setIsSpeaking(false);
     utterance.onerror = () => setIsSpeaking(false);
 
     utteranceRef.current = utterance;
     window.speechSynthesis.speak(utterance);
   }, [isTTSSupported, settings.voiceOutputEnabled]);
 
   const stopSpeaking = useCallback(() => {
     if (isTTSSupported) {
       window.speechSynthesis.cancel();
       setIsSpeaking(false);
     }
   }, [isTTSSupported]);
 
   return {
     voiceInputEnabled: settings.voiceInputEnabled,
     voiceOutputEnabled: settings.voiceOutputEnabled,
     isSpeaking,
     isTTSSupported,
     toggleVoiceInput,
     toggleVoiceOutput,
     speak,
     stopSpeaking,
   };
 };