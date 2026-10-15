import React, { useState } from 'react';
import { BusServiceDetail, BusStop } from '../types/bus';
import {
  X,
  Route,
  Clock,
  ArrowRightLeft,
  MapPin,
  Train,
  CheckCircle,
  Bus,
} from 'lucide-react';

interface ServiceRouteModalProps {
  service: BusServiceDetail;
  currentStopCode: string;
  onClose: () => void;
  onSelectStopByCode: (code: string) => void;
  onTrackServiceOnMap: (serviceNo: string) => void;
}

export const ServiceRouteModal: React.FC<ServiceRouteModalProps> = ({
  service,
  currentStopCode,
  onClose,
  onSelectStopByCode,
  onTrackServiceOnMap,
}) => {
  const [direction, setDirection] = useState<1 | 2>(1);

  const stops = direction === 1 ? service.direction1Stops : service.direction2Stops || service.direction1Stops;

  const getMrtBadgeColor = (line: string): string => {
    switch (line) {
      case 'NS':
        return 'bg-red-600 text-white';
      case 'EW':
        return 'bg-emerald-600 text-white';
      case 'NE':
        return 'bg-purple-600 text-white';
      case 'CC':
      case 'CE':
        return 'bg-amber-500 text-slate-950 font-bold';
      case 'DT':
        return 'bg-blue-600 text-white';
      case 'TE':
        return 'bg-amber-800 text-white';
      case 'CG':
        return 'bg-emerald-600 text-white';
      default:
        return 'bg-slate-700 text-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-2xl font-black text-emerald-400 font-mono-numbers">
                {service.serviceNo}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-white">{service.operator}</span>
                <span aria-hidden="true">·</span>
                <span>{service.category} Service</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {service.originName} → {service.destinationName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onTrackServiceOnMap(service.serviceNo);
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Route className="w-3.5 h-3.5" />
              <span>Map Route</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Operating Hours & Frequency Banner */}
        <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>First Bus: <strong className="text-white font-mono-numbers">{service.firstBus}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Last Bus: <strong className="text-white font-mono-numbers">{service.lastBus}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <span>Peak: <strong className="text-emerald-400 font-mono-numbers">{service.frequencyPeak}</strong></span>
            <span>Off-Peak: <strong className="text-slate-300 font-mono-numbers">{service.frequencyOffPeak}</strong></span>
          </div>
        </div>

        {/* Direction Switcher (if Direction 2 exists) */}
        {service.direction2Stops && (
          <div className="px-5 py-2 border-b border-slate-800 flex items-center gap-2">
            <button
              onClick={() => setDirection(1)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                direction === 1
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dir 1: To {service.destinationName}
            </button>
            <button
              onClick={() => setDirection(2)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                direction === 2
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dir 2: To {service.originName}
            </button>
          </div>
        )}

        {/* Route Stops Sequence */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2 divide-y divide-slate-800/60">
          {stops.map((stop, idx) => {
            const isCurrent = stop.stopCode === currentStopCode;

            return (
              <div
                key={`${stop.stopCode}-${idx}`}
                className={`pt-2.5 flex items-center justify-between gap-3 group transition-colors rounded-lg p-2 ${
                  isCurrent ? 'bg-emerald-500/10 border border-emerald-500/30' : 'hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Sequence Node */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono-numbers shrink-0 ${
                      isCurrent
                        ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                    }`}
                  >
                    {stop.sequence}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">
                        {stop.stopName}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded">
                          You are here
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="font-mono-numbers text-emerald-400/80">{stop.stopCode}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{stop.roadName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-numbers">{stop.distanceKm.toFixed(1)} km</span>
                    </div>
                  </div>
                </div>

                {/* MRT Lines & Switch Action */}
                <div className="flex items-center gap-2 shrink-0">
                  {stop.mrtLines && stop.mrtLines.length > 0 && (
                    <div className="hidden sm:flex items-center gap-1">
                      {stop.mrtLines.map((line) => (
                        <span
                          key={line}
                          className={`text-[9px] font-bold px-1 py-0.2 rounded ${getMrtBadgeColor(line)}`}
                        >
                          {line}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      onSelectStopByCode(stop.stopCode);
                      onClose();
                    }}
                    className="px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 transition-colors cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
