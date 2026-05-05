import React, { useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceModeOverlayProps {
  open: boolean;
  onClose: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  liveTranscript: string;
  inputLevel: number;
  outputLevel: number;
  lastAssistantMessage?: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
}

export const VoiceModeOverlay: React.FC<VoiceModeOverlayProps> = ({
  open,
  onClose,
  isListening,
  isSpeaking,
  liveTranscript,
  inputLevel,
  outputLevel,
  lastAssistantMessage,
  onStartListening,
  onStopListening,
  onStopSpeaking,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio orb visualizer
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let phase = 0;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const size = Math.min(canvas.clientWidth, canvas.clientHeight);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const baseR = Math.min(w, h) * 0.22;

      // Choose level based on state
      const level = isSpeaking ? outputLevel : isListening ? inputLevel : 0;
      const dynamicR = baseR + level * baseR * 0.9;

      // Outer animated rings
      for (let i = 3; i >= 1; i--) {
        const r = dynamicR + i * 18 * dpr + Math.sin(phase + i) * 4 * dpr;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
        const alpha = (0.12 / i) + level * 0.15;
        if (isSpeaking) {
          grad.addColorStop(0, `hsla(265, 85%, 65%, ${alpha})`);
          grad.addColorStop(1, `hsla(220, 90%, 60%, 0)`);
        } else if (isListening) {
          grad.addColorStop(0, `hsla(200, 90%, 60%, ${alpha})`);
          grad.addColorStop(1, `hsla(160, 80%, 55%, 0)`);
        } else {
          grad.addColorStop(0, `hsla(220, 30%, 70%, ${alpha * 0.6})`);
          grad.addColorStop(1, `hsla(220, 30%, 70%, 0)`);
        }
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Core orb
      const coreGrad = ctx.createRadialGradient(cx, cy - dynamicR * 0.3, dynamicR * 0.1, cx, cy, dynamicR);
      if (isSpeaking) {
        coreGrad.addColorStop(0, 'hsl(280, 100%, 85%)');
        coreGrad.addColorStop(0.5, 'hsl(265, 85%, 60%)');
        coreGrad.addColorStop(1, 'hsl(230, 80%, 45%)');
      } else if (isListening) {
        coreGrad.addColorStop(0, 'hsl(180, 100%, 85%)');
        coreGrad.addColorStop(0.5, 'hsl(200, 90%, 55%)');
        coreGrad.addColorStop(1, 'hsl(220, 80%, 40%)');
      } else {
        coreGrad.addColorStop(0, 'hsl(220, 40%, 80%)');
        coreGrad.addColorStop(1, 'hsl(230, 40%, 45%)');
      }
      ctx.beginPath();
      ctx.arc(cx, cy, dynamicR, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Bouncy waveform bars around the orb when active
      if (isListening || isSpeaking) {
        const bars = 48;
        ctx.lineCap = 'round';
        for (let i = 0; i < bars; i++) {
          const angle = (i / bars) * Math.PI * 2 + phase * 0.3;
          const wave = Math.abs(Math.sin(phase * 2 + i * 0.4));
          const len = (level * 40 + wave * 8) * dpr;
          const r1 = dynamicR + 8 * dpr;
          const r2 = r1 + len;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
          ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
          ctx.strokeStyle = isSpeaking ? 'hsla(280, 100%, 80%, 0.7)' : 'hsla(180, 100%, 75%, 0.7)';
          ctx.lineWidth = 2 * dpr;
          ctx.stroke();
        }
      }

      phase += 0.04;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [open, isListening, isSpeaking, inputLevel, outputLevel]);

  if (!open) return null;

  const status = isSpeaking ? 'Speaking…' : isListening ? 'Listening…' : 'Tap the mic to talk';

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-background via-background to-primary/5 backdrop-blur-xl flex flex-col">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Volume2 className="w-4 h-4" />
          Voice Mode
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close voice mode">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 min-h-0">
        <div className="w-[min(70vw,360px)] aspect-square">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        <div className="text-center min-h-[2rem]">
          <p className={cn(
            "text-sm font-medium transition-colors",
            isSpeaking ? "text-primary" : isListening ? "text-sage" : "text-muted-foreground"
          )}>
            {status}
          </p>
        </div>

        {/* Live transcript */}
        <div className="w-full max-w-xl min-h-[4rem] px-4 text-center">
          {liveTranscript && isListening ? (
            <p className="text-lg text-foreground/90 leading-relaxed animate-fade-in">
              {liveTranscript}
            </p>
          ) : !isListening && !isSpeaking && lastAssistantMessage ? (
            <p className="text-base text-muted-foreground line-clamp-4 leading-relaxed">
              {lastAssistantMessage}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 p-6 pb-8">
        {isSpeaking && (
          <Button
            variant="outline"
            size="lg"
            onClick={onStopSpeaking}
            className="rounded-full"
          >
            Stop
          </Button>
        )}
        <Button
          size="lg"
          onClick={isListening ? onStopListening : onStartListening}
          className={cn(
            "h-20 w-20 rounded-full transition-all shadow-lg",
            isListening
              ? "bg-destructive hover:bg-destructive/90 scale-110"
              : "bg-primary hover:bg-primary/90"
          )}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        </Button>
      </div>

      {isSpeaking && (
        <p className="text-xs text-center text-muted-foreground pb-2 px-6">
          Speak anytime to interrupt
        </p>
      )}
    </div>
  );
};
