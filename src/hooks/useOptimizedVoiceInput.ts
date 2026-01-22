import { useState, useRef, useCallback } from 'react';

/**
 * Optimized voice input hook with proper cleanup
 * - Only starts mic on explicit user action
 * - Immediately stops mic after recording
 * - No background mic access
 */
export const useOptimizedVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => {
    return typeof window !== 'undefined' && 
           !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const callbackRef = useRef<((text: string) => void) | null>(null);

  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore cleanup errors
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback((onTranscript: (text: string) => void) => {
    if (!isSupported) return;
    
    // Clean up any existing recognition
    cleanup();
    
    callbackRef.current = onTranscript;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript = event.results[i][0].transcript;
      }
      
      if (transcript && callbackRef.current) {
        callbackRef.current(transcript);
      }
    };

    recognition.onerror = () => {
      cleanup();
    };

    recognition.onend = () => {
      cleanup();
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch {
      cleanup();
    }
  }, [isSupported, cleanup]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
    }
    cleanup();
  }, [cleanup]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
  };
};
