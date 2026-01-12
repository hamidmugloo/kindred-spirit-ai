import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTextToSpeechProps {
  language?: string;
}

interface UseTextToSpeechReturn {
  isSpeaking: boolean;
  isSupported: boolean;
  speak: (text: string) => void;
  stop: () => void;
  setLanguage: (lang: string) => void;
  currentLanguage: string;
}

// Map voice input language codes to TTS language codes
const languageMap: Record<string, string> = {
  'en-US': 'en-US',
  'hi-IN': 'hi-IN',
  'ur-PK': 'ur-PK',
  'ks-IN': 'hi-IN', // Kashmiri fallback to Hindi as it's not widely supported
};

export const useTextToSpeech = ({ language = 'en-US' }: UseTextToSpeechProps = {}): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  useEffect(() => {
    // Cancel any ongoing speech when language changes
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [currentLanguage]);

  const findBestVoice = useCallback((lang: string): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    const mappedLang = languageMap[lang] || lang;
    
    // Try to find an exact match first
    let voice = voices.find(v => v.lang === mappedLang);
    
    // If no exact match, try to find a voice that starts with the language code
    if (!voice) {
      const langPrefix = mappedLang.split('-')[0];
      voice = voices.find(v => v.lang.startsWith(langPrefix));
    }
    
    // Fallback to default voice
    return voice || voices[0] || null;
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim()) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Set the voice based on language
    const voice = findBestVoice(currentLanguage);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isSupported, currentLanguage, findBestVoice]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const setLanguage = useCallback((lang: string) => {
    setCurrentLanguage(lang);
  }, []);

  return {
    isSpeaking,
    isSupported,
    speak,
    stop,
    setLanguage,
    currentLanguage,
  };
};
