import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Optimized voice input hook with mobile support
 * - Works on iOS Safari, Android Chrome, and desktop browsers
 * - Handles permission requests properly
 * - Immediate cleanup after recording
 */
export const useOptimizedVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const callbackRef = useRef<((text: string) => void) | null>(null);
  const finalTranscriptRef = useRef('');

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
    finalTranscriptRef.current = '';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const startListening = useCallback((onTranscript: (text: string) => void) => {
    if (!isSupported) return;
    
    // Clean up any existing recognition
    cleanup();
    
    callbackRef.current = onTranscript;
    finalTranscriptRef.current = '';
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Mobile-optimized settings
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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
      
      // Store final transcript
      if (finalTranscript) {
        finalTranscriptRef.current = finalTranscript;
      }
      
      // Send either final or interim to callback
      const currentText = finalTranscript || interimTranscript;
      if (currentText && callbackRef.current) {
        callbackRef.current(currentText);
      }
    };

    recognition.onerror = (event) => {
      // Don't log "aborted" errors - these are expected when stopping
      if (event.error !== 'aborted') {
        console.error('Speech recognition error:', event.error);
      }
      cleanup();
    };

    recognition.onend = () => {
      // Ensure final transcript is sent
      if (finalTranscriptRef.current && callbackRef.current) {
        callbackRef.current(finalTranscriptRef.current);
      }
      cleanup();
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      cleanup();
    }
  }, [isSupported, cleanup]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        // Use stop() instead of abort() to get final results
        recognitionRef.current.stop();
      } catch {
        // Fallback to cleanup if stop fails
        cleanup();
      }
    }
  }, [cleanup]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
  };
};
