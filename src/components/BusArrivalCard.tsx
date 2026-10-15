import React from 'react';
import {
  BusArrivalService,
  CrowdLoad,
  BusType,
  BusOperator,
} from '../types/bus';
import {
  Accessibility,
  Layers,
  MapPin,
  Bell,
  BellRing,
  Route,
  Navigation,
  CheckCircle2,
} from 'lucide-react';

interface BusArrivalCardProps {
  service: BusArrivalService;
  onTrackOnMap?: (serviceNo: string) => void;
  onViewRoute?: (serviceNo: string) => void;
  onToggleReminder?: (serviceNo: string) => void;
  isReminderSet?: boolean;
}

export const BusArrivalCard: React.FC<BusArrivalCardProps> = ({
  service,
  onTrackOnMap,
  onViewRoute,
  onToggleReminder,
  isReminderSet = false,
}) => {
  const getOperatorBadgeStyle = (operator: BusOperator) => {
    switch (operator) {
      case 'SBST':
        return 'text-rose-400 bg-rose-950/40 border-rose-800/40';
      case 'SMRT':
        return 'text-red-400 bg-red-950/40 border-red-800/40';
      case 'TTS':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
      case 'GAS':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/40';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const getLoadText = (load: CrowdLoad): string => {
    switch (load) {
      case 'SEA':
        return 'Seats Available';
      case 'SDA':
        return 'Standing Available';
      case 'LSD':
        return 'Limited Standing';
    }
  };

  const getLoadBadgeClasses = (load: CrowdLoad): string => {
    switch (load) {
      case 'SEA':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'SDA':
        return 'bg-amber-500/10 text-amber-300 border border-amber-500/30';
      case 'LSD':
        return 'bg-rose-500/10 text-rose-300 border border-rose-500/30';
    }
  };

  const formatArrivalCountdown = (seconds: number, minutes: number): string => {
    if (seconds <= 20) return 'Arr';
    if (minutes <= 0) return '1m';
    return `${minutes}m`;
  };

  const formatBusTypeLabel = (type: BusType): string => {
    switch (type) {
      case 'DD':
        return 'Double Deck';
      case 'SD':
        return 'Single Deck';
      case 'BD':
        return 'Bendy';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-black/20">
      <div className="flex items-start justify-between gap-4 mb-3">
        {/* Service Number & Info */}
        <div className="flex items-center gap-3">
          <div className="min-w-[56px] h-12 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center px-2">
            <span className="text-2xl font-black tracking-tight text-white font-mono-numbers">
              {service.serviceNo}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getOperatorBadgeStyle(service.operator)}`}>
                {service.operator}
              </span>
              <span aria-hidden="true">·</span>
              <span>{service.category}</span>
            </div>
            <div className="text-sm font-medium text-slate-200 mt-0.5 truncate max-w-[200px] sm:max-w-xs">
              To {service.destinationName}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {onToggleReminder && (
            <button
              onClick={() => onToggleReminder(service.serviceNo)}
              title={isReminderSet ? 'Arrival alert enabled' : 'Set arrival alert for this bus'}
              className={`min-w-[36px] min-h-[36px] rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                isReminderSet
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {isReminderSet ? (
                <BellRing className="w-4 h-4 animate-bounce" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </button>
          )}

          {onViewRoute && (
            <button
              onClick={() => onViewRoute(service.serviceNo)}
              title="View full service route & stops"
              className="min-w-[36px] min-h-[36px] rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Route className="w-4 h-4" />
            </button>
          )}

          {onTrackOnMap && (
            <button
              onClick={() => onTrackOnMap(service.serviceNo)}
              title="Locate approaching bus on map"
              className="px-2.5 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Track</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Next Arrivals Grid */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
        {/* Next Bus 1 (Lead Arrival) */}
        <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800/80 relative">
          <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1 flex items-center justify-between">
            <span>Next Bus</span>
            {service.nextBus.feature === 'WAB' && (
              <span title="Wheelchair Accessible" className="text-slate-400">
                <Accessibility className="w-3 h-3" />
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1.5 mb-1.5">
            <span className={`text-2xl font-bold font-mono-numbers ${
              service.nextBus.estimatedSeconds <= 60 ? 'text-emerald-400' : 'text-white'
            }`}>
              {formatArrivalCountdown(service.nextBus.estimatedSeconds, service.nextBus.estimatedMinutes)}
            </span>
            {service.nextBus.estimatedSeconds > 20 && (
              <span className="text-[10px] text-slate-400 font-mono-numbers">
                ({service.nextBus.estimatedSeconds}s)
              </span>
            )}
          </div>

          <div className="space-y-1">
            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight ${getLoadBadgeClasses(service.nextBus.load)}`}>
              {getLoadText(service.nextBus.load)}
            </span>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Layers className="w-2.5 h-2.5 text-slate-400" />
              <span>{formatBusTypeLabel(service.nextBus.type)}</span>
            </div>
            {service.nextBus.vehiclePlate && (
              <div className="text-[9px] text-slate-400 font-mono-numbers">
                {service.nextBus.vehiclePlate} · {service.nextBus.distanceMeters}m
              </div>
            )}
          </div>
        </div>

        {/* Next Bus 2 */}
        {service.nextBus2 ? (
          <div className="bg-slate-950/50 rounded-lg p-2.5 border border-slate-800/50">
            <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1 flex items-center justify-between">
              <span>2nd Bus</span>
              {service.nextBus2.feature === 'WAB' && (
                <span title="Wheelchair Accessible" className="text-slate-400">
                  <Accessibility className="w-3 h-3" />
                </span>
              )}
            </div>

            <div className="text-xl font-bold font-mono-numbers text-slate-300 mb-1.5">
              {formatArrivalCountdown(service.nextBus2.estimatedSeconds, service.nextBus2.estimatedMinutes)}
            </div>

            <div className="space-y-1">
              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight ${getLoadBadgeClasses(service.nextBus2.load)}`}>
                {service.nextBus2.load === 'SEA' ? 'Seats Avail' : service.nextBus2.load === 'SDA' ? 'Standing' : 'Crowded'}
              </span>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Layers className="w-2.5 h-2.5 text-slate-400" />
                <span>{formatBusTypeLabel(service.nextBus2.type)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/20 rounded-lg p-2.5 border border-dashed border-slate-800 flex items-center justify-center text-xs text-slate-400">
            No info
          </div>
        )}

        {/* Next Bus 3 */}
        {service.nextBus3 ? (
          <div className="bg-slate-950/50 rounded-lg p-2.5 border border-slate-800/50">
            <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1 flex items-center justify-between">
              <span>3rd Bus</span>
              {service.nextBus3.feature === 'WAB' && (
                <span title="Wheelchair Accessible" className="text-slate-400">
                  <Accessibility className="w-3 h-3" />
                </span>
              )}
            </div>

            <div className="text-xl font-bold font-mono-numbers text-slate-300 mb-1.5">
              {formatArrivalCountdown(service.nextBus3.estimatedSeconds, service.nextBus3.estimatedMinutes)}
            </div>

            <div className="space-y-1">
              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight ${getLoadBadgeClasses(service.nextBus3.load)}`}>
                {service.nextBus3.load === 'SEA' ? 'Seats Avail' : service.nextBus3.load === 'SDA' ? 'Standing' : 'Crowded'}
              </span>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Layers className="w-2.5 h-2.5 text-slate-400" />
                <span>{formatBusTypeLabel(service.nextBus3.type)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/20 rounded-lg p-2.5 border border-dashed border-slate-800 flex items-center justify-center text-xs text-slate-400">
            No info
          </div>
        )}
      </div>
    </div>
  );
};
