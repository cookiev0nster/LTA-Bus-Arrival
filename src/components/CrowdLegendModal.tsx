import React from 'react';
import { X, Users, Layers, Accessibility, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

interface CrowdLegendModalProps {
  onClose: () => void;
}

export const CrowdLegendModal: React.FC<CrowdLegendModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">LTA Crowding &amp; Fleet Guide</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-sm">
          {/* Crowding Levels */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2.5">
              Real-Time Passenger Load
            </h4>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 mt-1 shrink-0 ring-4 ring-emerald-500/20" />
                <div>
                  <div className="font-semibold text-emerald-400">Seats Available (SEA)</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Adequate seating is available across upper and lower decks. Comfortable boarding.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-amber-500 mt-1 shrink-0 ring-4 ring-amber-500/20" />
                <div>
                  <div className="font-semibold text-amber-300">Standing Available (SDA)</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    All seats are occupied, but ample standing space remains.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-rose-500 mt-1 shrink-0 ring-4 ring-rose-500/20" />
                <div>
                  <div className="font-semibold text-rose-300">Limited Standing (LSD)</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    High passenger volume. Very limited standing space available; you may wish to wait for the next bus.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fleet Specifications */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2.5">
              Bus Fleet Types &amp; Accessibility
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Double Deck (DD)</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  High capacity double-decker bus with upper level seating.
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Single Deck (SD)</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Standard 12-meter single deck transit coach.
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bendy Bus (BD)</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  18-meter articulated bus with dual passenger cabins.
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
                  <Accessibility className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WAB Compliant</span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Step-free low floor entrance with wheelchair ramp.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
