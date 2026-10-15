import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BusStop,
  BusArrivalService,
  ActiveBusVehicle,
  BusServiceDetail,
} from './types/bus';
import {
  SINGAPORE_BUS_STOPS,
  BUS_SERVICES_CATALOG,
  POPULAR_HUBS,
} from './data/singaporeBusData';
import {
  getBusArrivalsForStop,
  getActiveFleetVehicles,
  getNearbyBusStops,
  fetchLiveLtaBusArrival,
  checkLtaHealth,
  LtaConnectionStatus,
} from './services/busArrivalEngine';
import { Header } from './components/Header';
import { BusStopSelector } from './components/BusStopSelector';
import { BusArrivalCard } from './components/BusArrivalCard';
import { LiveTransitMap } from './components/LiveTransitMap';
import { ServiceRouteModal } from './components/ServiceRouteModal';
import { CrowdLegendModal } from './components/CrowdLegendModal';
import { CommuterAlertToast } from './components/CommuterAlertToast';
import {
  Compass,
  Bus,
  MapPin,
  Clock,
  Layers,
  HelpCircle,
  Bookmark,
  Route,
  Filter,
  ArrowUpDown,
  Search,
  Sparkles,
  Info,
} from 'lucide-react';

export default function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'arrivals' | 'map' | 'routes' | 'saved'>('arrivals');

  // Active selected stop (defaults to Orchard - Lucky Plaza 09048)
  const [currentStop, setCurrentStop] = useState<BusStop>(SINGAPORE_BUS_STOPS[0]);

  // Real-time clock advancing every second
  const [timestampSeconds, setTimestampSeconds] = useState<number>(() => Math.floor(Date.now() / 1000));
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState<number>(15);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Filters & Sorting for Arrival list
  const [serviceFilterQuery, setServiceFilterQuery] = useState<string>('');
  const [filterCrowdOnlySeats, setFilterCrowdOnlySeats] = useState<boolean>(false);
  const [filterDoubleDeckOnly, setFilterDoubleDeckOnly] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'arrival' | 'serviceNo'>('arrival');

  // Tracked / Selected Service on map
  const [highlightedServiceNo, setHighlightedServiceNo] = useState<string | undefined>(undefined);

  // Modals & Popups
  const [viewingServiceDetail, setViewingServiceDetail] = useState<BusServiceDetail | null>(null);
  const [showLegendModal, setShowLegendModal] = useState<boolean>(false);

  // Saved / Bookmarked stops
  const [savedStopCodes, setSavedStopCodes] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('sg_bus_saved_stops');
      return stored ? JSON.parse(stored) : ['09048', '04121', '80019'];
    } catch {
      return ['09048', '04121', '80019'];
    }
  });

  // Commuter arrival reminders (service numbers)
  const [reminders, setReminders] = useState<string[]>([]);
  const [activeAlert, setActiveAlert] = useState<{
    serviceNo: string;
    stopName: string;
    minutes: number;
  } | null>(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sg_bus_saved_stops', JSON.stringify(savedStopCodes));
    } catch (e) {
      // Ignored
    }
  }, [savedStopCodes]);

  // Master Clock interval: ticks every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimestampSeconds((prev) => prev + 1);
      setAutoRefreshCountdown((prev) => {
        if (prev <= 1) {
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // LTA Connection Status & Live API Data
  const [ltaStatus, setLtaStatus] = useState<LtaConnectionStatus | null>(null);
  const [liveLtaArrivals, setLiveLtaArrivals] = useState<BusArrivalService[] | null>(null);
  const [isLiveFromLta, setIsLiveFromLta] = useState<boolean>(false);

  // Check LTA Gateway health on mount
  useEffect(() => {
    checkLtaHealth().then((status) => {
      setLtaStatus(status);
    });
  }, []);

  // Fetch live LTA Datamall data when currentStop changes or on manual refresh
  useEffect(() => {
    let isCancelled = false;

    async function loadLiveArrivals() {
      const liveData = await fetchLiveLtaBusArrival(currentStop.code);
      if (!isCancelled) {
        if (liveData && liveData.length > 0) {
          setLiveLtaArrivals(liveData);
          setIsLiveFromLta(true);
        } else {
          setLiveLtaArrivals(null);
          setIsLiveFromLta(false);
        }
      }
    }

    loadLiveArrivals();
    return () => {
      isCancelled = true;
    };
  }, [currentStop.code, isRefreshing]);

  // Bus arrivals for current stop (prefers live LTA data, falls back to engine)
  const arrivals: BusArrivalService[] = useMemo(() => {
    if (liveLtaArrivals && liveLtaArrivals.length > 0) {
      return liveLtaArrivals;
    }
    return getBusArrivalsForStop(currentStop.code, timestampSeconds);
  }, [liveLtaArrivals, currentStop.code, timestampSeconds]);

  // Active moving fleet across Singapore
  const activeVehicles: ActiveBusVehicle[] = useMemo(() => {
    return getActiveFleetVehicles(timestampSeconds);
  }, [timestampSeconds]);

  // Check arrival reminders
  useEffect(() => {
    if (reminders.length === 0) return;

    for (const service of arrivals) {
      if (reminders.includes(service.serviceNo)) {
        if (service.nextBus.estimatedMinutes <= 1 && service.nextBus.estimatedSeconds <= 60) {
          setActiveAlert({
            serviceNo: service.serviceNo,
            stopName: currentStop.description,
            minutes: service.nextBus.estimatedMinutes,
          });
          break;
        }
      }
    }
  }, [arrivals, reminders, currentStop.description]);

  // Manual Refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimestampSeconds(Math.floor(Date.now() / 1000));
    setAutoRefreshCountdown(15);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  }, []);

  // Geolocation / Near Me
  const handleLocateMe = useCallback(() => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const nearby = getNearbyBusStops(userLat, userLng, 50000);
          if (nearby.length > 0) {
            setCurrentStop(nearby[0]);
          }
          setIsLocating(false);
        },
        () => {
          // If denied, fallback to Orchard Rd hub
          setCurrentStop(SINGAPORE_BUS_STOPS[0]);
          setIsLocating(false);
        },
        { timeout: 5000 }
      );
    } else {
      setIsLocating(false);
    }
  }, []);

  // Bookmark toggle
  const toggleSaveCurrentStop = useCallback(() => {
    setSavedStopCodes((prev) => {
      if (prev.includes(currentStop.code)) {
        return prev.filter((c) => c !== currentStop.code);
      } else {
        return [...prev, currentStop.code];
      }
    });
  }, [currentStop.code]);

  // Toggle Reminder
  const handleToggleReminder = useCallback((serviceNo: string) => {
    setReminders((prev) => {
      if (prev.includes(serviceNo)) {
        return prev.filter((s) => s !== serviceNo);
      } else {
        return [...prev, serviceNo];
      }
    });
  }, []);

  // Track service on map
  const handleTrackOnMap = useCallback((serviceNo: string) => {
    setHighlightedServiceNo(serviceNo);
    setActiveTab('map');
  }, []);

  // View full route
  const handleViewRoute = useCallback((serviceNo: string) => {
    const detail = BUS_SERVICES_CATALOG.find((s) => s.serviceNo === serviceNo);
    if (detail) {
      setViewingServiceDetail(detail);
    }
  }, []);

  // Select stop by code
  const handleSelectStopByCode = useCallback((code: string) => {
    const found = SINGAPORE_BUS_STOPS.find((s) => s.code === code);
    if (found) {
      setCurrentStop(found);
      setActiveTab('arrivals');
    }
  }, []);

  // Filtered & Sorted arrivals
  const filteredArrivals = useMemo(() => {
    let result = [...arrivals];

    if (serviceFilterQuery.trim()) {
      const q = serviceFilterQuery.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.serviceNo.toLowerCase().includes(q) ||
          s.destinationName.toLowerCase().includes(q) ||
          s.operator.toLowerCase().includes(q)
      );
    }

    if (filterCrowdOnlySeats) {
      result = result.filter((s) => s.nextBus.load === 'SEA');
    }

    if (filterDoubleDeckOnly) {
      result = result.filter((s) => s.nextBus.type === 'DD');
    }

    if (sortOrder === 'serviceNo') {
      result.sort((a, b) => parseInt(a.serviceNo, 10) - parseInt(b.serviceNo, 10));
    } else {
      result.sort((a, b) => a.nextBus.estimatedMinutes - b.nextBus.estimatedMinutes);
    }

    return result;
  }, [arrivals, serviceFilterQuery, filterCrowdOnlySeats, filterDoubleDeckOnly, sortOrder]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar Contract (Wordmark, Nav Links, Primary Action) */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
        autoRefreshCountdown={autoRefreshCountdown}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* ===================== TAB 1: ARRIVALS ===================== */}
        {activeTab === 'arrivals' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (Arrival Timings & Stop Selector) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Bus Stop Selector */}
              <BusStopSelector
                currentStop={currentStop}
                onSelectStop={setCurrentStop}
                isSaved={savedStopCodes.includes(currentStop.code)}
                onToggleSave={toggleSaveCurrentStop}
                allStops={SINGAPORE_BUS_STOPS}
              />

              {/* LTA DataMall Gateway Status */}
              <div className="px-3.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isLiveFromLta
                        ? 'bg-emerald-400 animate-pulse'
                        : ltaStatus?.isConfigured
                        ? 'bg-emerald-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span className="font-medium text-slate-300">
                    {isLiveFromLta
                      ? 'Live LTA DataMall v3 Stream Active'
                      : ltaStatus?.isConfigured
                      ? 'LTA Key Configured · Live Feed Active'
                      : 'LTA Gateway: /api/busarrival (Awaiting LTA_ACCOUNT_KEY)'}
                  </span>
                </div>
                <div className="font-mono-numbers text-[11px] text-slate-400 hidden sm:block">
                  GET /api/busarrival?BusStopCode={currentStop.code}
                </div>
              </div>

              {/* Filtering & Sorting Controls Bar */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Search Service number input */}
                <div className="relative flex-1 min-w-[140px] max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={serviceFilterQuery}
                    onChange={(e) => setServiceFilterQuery(e.target.value)}
                    placeholder="Filter bus # (e.g. 65)..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-400 outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Filter Toggles */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setFilterCrowdOnlySeats(!filterCrowdOnlySeats)}
                    className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      filterCrowdOnlySeats
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Seats Available
                  </button>

                  <button
                    onClick={() => setFilterDoubleDeckOnly(!filterDoubleDeckOnly)}
                    className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      filterDoubleDeckOnly
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Double Deck
                  </button>

                  <button
                    onClick={() => setSortOrder(sortOrder === 'arrival' ? 'serviceNo' : 'arrival')}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 border border-slate-800 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                    title="Change sort order"
                  >
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    <span>{sortOrder === 'arrival' ? 'Wait Time' : 'Bus No.'}</span>
                  </button>

                  <button
                    onClick={() => setShowLegendModal(true)}
                    className="p-1 rounded-lg bg-slate-950 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                    title="View Crowding Legend &amp; Guide"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Arrival Cards List */}
              <div className="space-y-3">
                {filteredArrivals.length > 0 ? (
                  filteredArrivals.map((service) => (
                    <BusArrivalCard
                      key={service.serviceNo}
                      service={service}
                      onTrackOnMap={handleTrackOnMap}
                      onViewRoute={handleViewRoute}
                      onToggleReminder={handleToggleReminder}
                      isReminderSet={reminders.includes(service.serviceNo)}
                    />
                  ))
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                    <Bus className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-300">No matching bus services</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the filter search query</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (Live Transit Map - Sticky Desktop) */}
            <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400 tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real-Time Singapore Map</span>
                </div>
                <button
                  onClick={() => setActiveTab('map')}
                  className="text-xs text-emerald-400 hover:underline cursor-pointer"
                >
                  Fullscreen Map →
                </button>
              </div>

              <div className="h-[520px]">
                <LiveTransitMap
                  currentStop={currentStop}
                  allStops={SINGAPORE_BUS_STOPS}
                  activeVehicles={activeVehicles}
                  highlightedServiceNo={highlightedServiceNo}
                  onSelectStop={setCurrentStop}
                  onSelectService={handleViewRoute}
                />
              </div>

              {/* Quick Hub Tip */}
              <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs text-slate-400 flex items-center gap-2.5">
                <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Click any bus icon on the map to inspect speed, load level, and approaching stop.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 2: FULLSCREEN LIVE MAP ===================== */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Singapore Real-Time Bus &amp; Fleet Map
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live tracking GPS locations of active LTA bus fleets and stops across the island
                </p>
              </div>

              {highlightedServiceNo && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Filtering Route:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono-numbers">
                    Bus {highlightedServiceNo}
                  </span>
                  <button
                    onClick={() => setHighlightedServiceNo(undefined)}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>

            <div className="h-[75vh] w-full">
              <LiveTransitMap
                currentStop={currentStop}
                allStops={SINGAPORE_BUS_STOPS}
                activeVehicles={activeVehicles}
                highlightedServiceNo={highlightedServiceNo}
                onSelectStop={(stop) => {
                  setCurrentStop(stop);
                  setActiveTab('arrivals');
                }}
                onSelectService={handleViewRoute}
              />
            </div>
          </div>
        )}

        {/* ===================== TAB 3: BUS SERVICES DIRECTORY ===================== */}
        {activeTab === 'routes' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Singapore Bus Services Catalog
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Browse official LTA trunk, feeder, and express bus services with first/last bus timings
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {BUS_SERVICES_CATALOG.map((svc) => (
                <div
                  key={svc.serviceNo}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 transition-all hover:border-slate-700 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="w-12 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center">
                        <span className="text-xl font-black text-white font-mono-numbers">
                          {svc.serviceNo}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {svc.operator} · {svc.category}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-white">
                      {svc.originName} ➔ {svc.destinationName}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                      <div className="flex items-center justify-between">
                        <span>Operating Hours:</span>
                        <span className="font-mono-numbers text-slate-200">
                          {svc.firstBus} - {svc.lastBus}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Peak Frequency:</span>
                        <span className="font-mono-numbers text-emerald-400 font-medium">
                          {svc.frequencyPeak}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Route Stops:</span>
                        <span className="font-mono-numbers text-slate-200">
                          {svc.direction1Stops.length} stops
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => setViewingServiceDetail(svc)}
                      className="flex-1 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Route className="w-3.5 h-3.5 text-emerald-400" />
                      <span>View Route</span>
                    </button>

                    <button
                      onClick={() => handleTrackOnMap(svc.serviceNo)}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Map</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB 4: SAVED STOPS ===================== */}
        {activeTab === 'saved' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Saved Bus Stops &amp; Commutes
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Quick access to your regular bus stops and daily transit interchanges
              </p>
            </div>

            {savedStopCodes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedStopCodes.map((code) => {
                  const stop = SINGAPORE_BUS_STOPS.find((s) => s.code === code);
                  if (!stop) return null;

                  const stopArrivals = getBusArrivalsForStop(code, timestampSeconds);

                  return (
                    <div
                      key={code}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <span className="text-xs font-mono-numbers text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              {stop.code}
                            </span>
                            <h3 className="text-base font-bold text-white mt-1">
                              {stop.description}
                            </h3>
                            <p className="text-xs text-slate-400">{stop.roadName}</p>
                          </div>

                          <button
                            onClick={() => {
                              setSavedStopCodes((prev) => prev.filter((c) => c !== code));
                            }}
                            className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                            title="Remove bookmark"
                          >
                            <Bookmark className="w-4 h-4 fill-amber-400 text-amber-400" />
                          </button>
                        </div>

                        {/* Top 3 Bus Arrivals Preview */}
                        <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                          {stopArrivals.slice(0, 3).map((svc) => (
                            <div
                              key={svc.serviceNo}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-950/60"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono-numbers font-black text-white text-sm">
                                  {svc.serviceNo}
                                </span>
                                <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                                  To {svc.destinationName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs font-bold font-mono-numbers ${
                                    svc.nextBus.estimatedSeconds <= 60
                                      ? 'text-emerald-400'
                                      : 'text-slate-200'
                                  }`}
                                >
                                  {svc.nextBus.estimatedMinutes <= 0
                                    ? 'Arr'
                                    : `${svc.nextBus.estimatedMinutes}m`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setCurrentStop(stop);
                            setActiveTab('arrivals');
                          }}
                          className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl transition-colors cursor-pointer text-center"
                        >
                          View Full Timings
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
                <Bookmark className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                <h3 className="text-base font-bold text-slate-200">No saved bus stops yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Click the bookmark icon on any bus stop in the Arrival Timings view to save it here for fast commute monitoring.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Service Route Modal */}
      {viewingServiceDetail && (
        <ServiceRouteModal
          service={viewingServiceDetail}
          currentStopCode={currentStop.code}
          onClose={() => setViewingServiceDetail(null)}
          onSelectStopByCode={handleSelectStopByCode}
          onTrackServiceOnMap={handleTrackOnMap}
        />
      )}

      {/* Crowding & Fleet Legend Modal */}
      {showLegendModal && (
        <CrowdLegendModal onClose={() => setShowLegendModal(false)} />
      )}

      {/* Commuter Alert Toast */}
      {activeAlert && (
        <CommuterAlertToast
          serviceNo={activeAlert.serviceNo}
          stopName={activeAlert.stopName}
          minutes={activeAlert.minutes}
          onDismiss={() => setActiveAlert(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-4 sm:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>Singapore LTA Transit Data Compliant</span>
            <span aria-hidden="true">·</span>
            <span>Real-time GPS bus tracking</span>
          </div>
          <div>
            <span>Next automatic sync in {autoRefreshCountdown}s</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
