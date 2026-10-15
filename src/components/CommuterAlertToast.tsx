import React, { useEffect, useRef } from 'react';
import { BellRing, X, Bus, CheckCircle2 } from 'lucide-react';

interface CommuterAlertToastProps {
  serviceNo: string;
  stopName: string;
  minutes: number;
  onDismiss: () => void;
}

export const CommuterAlertToast: React.FC<CommuterAlertToastProps> = ({
  serviceNo,
  stopName,
  minutes,
  onDismiss,
}) => {
  const audioPlayedRef = useRef(false);

  // Play pleasant MRT chime via Web Audio API
  useEffect(() => {
    if (!audioPlayedRef.current) {
      audioPlayedRef.current = true;
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const now = ctx.currentTime;

          // Note 1 (D5 ~ 587.33 Hz)
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(587.33, now);
          gain1.gain.setValueAtTime(0.12, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.35);

          // Note 2 (A5 ~ 880.00 Hz)
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(880.0, now + 0.15);
          gain2.gain.setValueAtTime(0.14, now + 0.15);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.15);
          osc2.stop(now + 0.55);
        }
      } catch (err) {
        // AudioContext may be blocked before interaction, handled gracefully
      }
    }
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-4 shadow-2xl animate-bounce-short">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
          <BellRing className="w-5 h-5 animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold uppercase tracking-wider">
            <span>Bus Arrival Alert</span>
          </div>

          <h4 className="text-sm font-bold text-white mt-0.5">
            Bus {serviceNo} is {minutes <= 0 ? 'arriving now' : `${minutes} min away`}!
          </h4>

          <p className="text-xs text-slate-300 mt-0.5 truncate">
            Approaching: <span className="font-semibold text-white">{stopName}</span>
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
