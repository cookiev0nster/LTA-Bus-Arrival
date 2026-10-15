import React, { useState } from 'react';
import { BusStop } from '../types/bus';
import { POPULAR_HUBS } from '../data/singaporeBusData';
import { searchBusStops } from '../services/busArrivalEngine';
import {
  Search,
  MapPin,
  Bookmark,
  BookmarkCheck,
  Building2,
  Train,
  X,
  Compass,
} from 'lucide-react';

interface BusStopSelectorProps {
  currentStop: BusStop;
  onSelectStop: (stop: BusStop) => void;
  isSaved: boolean;
  onToggleSave: () => void;
  allStops: BusStop[];
}

export const BusStopSelector: React.FC<BusStopSelectorProps> = ({
  currentStop,
  onSelectStop,
  isSaved,
  onToggleSave,
  allStops,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const searchResults = searchQuery ? searchBusStops(searchQuery) : [];

  const getMrtBadgeColor = (line: string): string => {
    switch (line) {
      case 'NS':
        return 'bg-red-600 text-white'; // North South Line (Red)
      case 'EW':
        return 'bg-emerald-600 text-white'; // East West Line (Green)
      case 'NE':
        return 'bg-purple-600 text-white'; // North East Line (Purple)
      case 'CC':
      case 'CE':
        return 'bg-amber-500 text-slate-950 font-bold'; // Circle Line (Orange)
      case 'DT':
        return 'bg-blue-600 text-white'; // Downtown Line (Blue)
      case 'TE':
        return 'bg-amber-800 text-white'; // Thomson-East Coast Line (Brown)
      case 'CG':
        return 'bg-emerald-600 text-white'; // Changi Airport branch
      default:
        return 'bg-slate-700 text-slate-200';
    }
  };

  const handleSelect = (stop: BusStop) => {
    onSelectStop(stop);
    setSearchQuery('');
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
      {/* Current Active Bus Stop Banner */}
      <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <Building2 className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono-numbers font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Stop {currentStop.code}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{currentStop.roadName}</span>
              {currentStop.distanceMeters !== undefined && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-numbers text-slate-300">{currentStop.distanceMeters}m away</span>
                </>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1">
              {currentStop.description}
            </h1>

            {/* MRT Interchange Lines if any */}
            {currentStop.mrtLines && currentStop.mrtLines.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Train className="w-3 h-3 text-slate-400" />
                  <span>MRT:</span>
                </span>
                {currentStop.mrtLines.map((line) => (
                  <span
                    key={line}
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${getMrtBadgeColor(line)}`}
                  >
                    {line}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bookmark Toggle */}
        <button
          onClick={onToggleSave}
          title={isSaved ? 'Remove from saved bus stops' : 'Save bus stop to favorites'}
          className={`min-w-[40px] min-h-[40px] rounded-xl border flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
            isSaved
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          {isSaved ? (
            <BookmarkCheck className="w-5 h-5" />
          ) : (
            <Bookmark className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Search Input for LTA Bus Stops */}
      <div className="relative mb-3.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Search 5-digit code (e.g. 09048), road or landmark..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-100 placeholder:text-slate-400 transition-all outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsDropdownOpen(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isDropdownOpen && searchQuery && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-800">
            {searchResults.length > 0 ? (
              searchResults.map((stop) => (
                <button
                  key={stop.code}
                  onClick={() => handleSelect(stop)}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-800/80 transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-200 group-hover:text-emerald-400 transition-colors">
                      {stop.description}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="font-mono-numbers text-emerald-400">{stop.code}</span>
                      <span aria-hidden="true">·</span>
                      <span>{stop.roadName}</span>
                    </div>
                  </div>
                  {stop.mrtLines && stop.mrtLines.length > 0 && (
                    <div className="flex gap-1 shrink-0">
                      {stop.mrtLines.map((l) => (
                        <span
                          key={l}
                          className={`text-[9px] font-bold px-1 rounded ${getMrtBadgeColor(l)}`}
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-slate-400 text-center">
                No stops found matching "{searchQuery}". Try an LTA code like 09048 or "Orchard".
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Transit Hub Selectors (Single line scroller) */}
      <div>
        <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-emerald-400" />
          <span>Major Transit Hubs:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {POPULAR_HUBS.map((hub) => {
            const isSelected = currentStop.code === hub.code;
            return (
              <button
                key={hub.code}
                onClick={() => {
                  const target = allStops.find((s) => s.code === hub.code);
                  if (target) onSelectStop(target);
                }}
                className={`px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {hub.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
