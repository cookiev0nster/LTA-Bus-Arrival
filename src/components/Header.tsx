import React from 'react';
import { Navigation, RefreshCw, Bus, Compass, Bookmark, MapPin } from 'lucide-react';

interface HeaderProps {
  activeTab: 'arrivals' | 'map' | 'routes' | 'saved';
  setActiveTab: (tab: 'arrivals' | 'map' | 'routes' | 'saved') => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onLocateMe: () => void;
  isLocating: boolean;
  autoRefreshCountdown: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  isRefreshing,
  onLocateMe,
  isLocating,
  autoRefreshCountdown,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Bus className="w-5 h-5" />
          </div>
          <button
            onClick={() => setActiveTab('arrivals')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-lg font-bold tracking-tight text-white block group-hover:text-emerald-400 transition-colors">
              SG Bus Arrival
            </span>
          </button>
        </div>

        {/* Zone 2: Concise Nav Links (Single-Line) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => setActiveTab('arrivals')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 ${
              activeTab === 'arrivals'
                ? 'text-emerald-400 border-emerald-400 font-semibold'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Arrival Timings
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 ${
              activeTab === 'map'
                ? 'text-emerald-400 border-emerald-400 font-semibold'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Live Bus Map
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 ${
              activeTab === 'routes'
                ? 'text-emerald-400 border-emerald-400 font-semibold'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Bus Services
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 ${
              activeTab === 'saved'
                ? 'text-emerald-400 border-emerald-400 font-semibold'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Saved Stops
          </button>
        </nav>

        {/* Zone 3: Primary Action & Live Auto-Refresh */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onLocateMe}
            disabled={isLocating}
            title="Locate nearest Singapore bus stop"
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Near Me</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh bus arrival predictions"
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95 disabled:opacity-60 shadow-sm shadow-emerald-950"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync ({autoRefreshCountdown}s)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
