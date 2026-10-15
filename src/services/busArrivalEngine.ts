import {
  BusStop,
  BusArrivalService,
  BusArrivalDetail,
  ActiveBusVehicle,
  CrowdLoad,
  BusType,
  BusOperator,
} from '../types/bus';
import { SINGAPORE_BUS_STOPS, BUS_SERVICES_CATALOG } from '../data/singaporeBusData';

// Haversine distance in meters
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Get sorted nearby stops for any coordinates
export function getNearbyBusStops(lat: number, lng: number, maxDistanceMeters = 5000): BusStop[] {
  return SINGAPORE_BUS_STOPS.map((stop) => ({
    ...stop,
    distanceMeters: calculateDistanceMeters(lat, lng, stop.latitude, stop.longitude),
  }))
    .filter((stop) => stop.distanceMeters <= maxDistanceMeters)
    .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
}

// Seedable deterministic pseudo-random generator
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate realistic vehicle plate based on operator
function generateVehiclePlate(serviceNo: string, operator: BusOperator, seed: number): string {
  const prefixes: Record<BusOperator, string[]> = {
    SBST: ['SBS', 'SG'],
    SMRT: ['SMB', 'SG'],
    TTS: ['SG'],
    GAS: ['SG'],
  };
  const list = prefixes[operator];
  const prefix = list[Math.floor(pseudoRandom(seed * 3) * list.length)];
  const num = 1000 + Math.floor(pseudoRandom(seed * 7) * 8999);
  const letters = 'ABCDEFGHJKLMNPRSTUVWXYZ';
  const suffix = letters[Math.floor(pseudoRandom(seed * 11) * letters.length)];
  return `${prefix}${num}${suffix}`;
}

// Calculate realistic arrival details for a service at a stop
export function getBusArrivalsForStop(stopCode: string, timestampSeconds: number): BusArrivalService[] {
  const stop = SINGAPORE_BUS_STOPS.find((s) => s.code === stopCode);
  const stopLat = stop?.latitude ?? 1.3039;
  const stopLng = stop?.longitude ?? 1.3344;

  // Find all services that include this stop
  const matchingServices = BUS_SERVICES_CATALOG.filter((svc) =>
    svc.direction1Stops.some((s) => s.stopCode === stopCode)
  );

  // If no predefined service is mapped, provide standard corridor services
  const servicesToUse =
    matchingServices.length > 0
      ? matchingServices
      : BUS_SERVICES_CATALOG.slice(0, 4);

  return servicesToUse.map((svc, index) => {
    // Generate cyclical arrival countdown based on current time
    // Cycle length typically 8 - 14 minutes
    const cycleLengthSec = 480 + (index * 137) % 360; // 8 - 14 minutes
    const offsetSec = (parseInt(stopCode.slice(-3) || '123', 10) * 43 + index * 197) % cycleLengthSec;
    const progressSec = (timestampSeconds + offsetSec) % cycleLengthSec;

    const remainingSec1 = Math.max(0, cycleLengthSec - progressSec);
    const remainingMin1 = Math.floor(remainingSec1 / 60);

    const remainingSec2 = remainingSec1 + 420 + ((index * 73) % 240);
    const remainingMin2 = Math.floor(remainingSec2 / 60);

    const remainingSec3 = remainingSec2 + 480 + ((index * 91) % 300);
    const remainingMin3 = Math.floor(remainingSec3 / 60);

    // Calculate loads
    const loads: CrowdLoad[] = ['SEA', 'SEA', 'SDA', 'SEA', 'LSD', 'SDA'];
    const load1 = loads[(Math.floor(timestampSeconds / 300) + index) % loads.length];
    const load2 = loads[(Math.floor(timestampSeconds / 300) + index + 2) % loads.length];
    const load3 = loads[(Math.floor(timestampSeconds / 300) + index + 4) % loads.length];

    // Bus types: Single Deck, Double Deck, Bendy
    const types: BusType[] = ['DD', 'SD', 'DD', 'SD', 'DD', 'BD'];
    const type1 = types[(index + 1) % types.length];
    const type2 = types[(index + 2) % types.length];
    const type3 = types[(index + 3) % types.length];

    // Incoming vehicle coordinates simulation (approaching the stop)
    const angleRad = ((index * 60 + 45) * Math.PI) / 180;
    // Approaching distance in degrees: ~0.005 deg is ~550m
    const distFactor = Math.min(1.0, remainingSec1 / 480);
    const incomingLat = stopLat + Math.sin(angleRad) * (0.002 + distFactor * 0.015);
    const incomingLng = stopLng + Math.cos(angleRad) * (0.002 + distFactor * 0.015);

    const arrival1: BusArrivalDetail = {
      estimatedArrival: new Date((timestampSeconds + remainingSec1) * 1000).toISOString(),
      estimatedMinutes: remainingMin1,
      estimatedSeconds: remainingSec1,
      load: load1,
      feature: 'WAB',
      type: type1,
      latitude: incomingLat,
      longitude: incomingLng,
      speedKmH: remainingMin1 === 0 ? 12 : 28 + (index % 12),
      distanceMeters: Math.round(remainingSec1 * 6.5),
      vehiclePlate: generateVehiclePlate(svc.serviceNo, svc.operator, timestampSeconds + index * 100),
    };

    const arrival2: BusArrivalDetail = {
      estimatedArrival: new Date((timestampSeconds + remainingSec2) * 1000).toISOString(),
      estimatedMinutes: remainingMin2,
      estimatedSeconds: remainingSec2,
      load: load2,
      feature: 'WAB',
      type: type2,
      latitude: stopLat + Math.sin(angleRad + 0.3) * (0.02 + distFactor * 0.03),
      longitude: stopLng + Math.cos(angleRad + 0.3) * (0.02 + distFactor * 0.03),
      speedKmH: 34,
      distanceMeters: Math.round(remainingSec2 * 7.2),
      vehiclePlate: generateVehiclePlate(svc.serviceNo, svc.operator, timestampSeconds + index * 200 + 42),
    };

    const arrival3: BusArrivalDetail = {
      estimatedArrival: new Date((timestampSeconds + remainingSec3) * 1000).toISOString(),
      estimatedMinutes: remainingMin3,
      estimatedSeconds: remainingSec3,
      load: load3,
      feature: 'WAB',
      type: type3,
      distanceMeters: Math.round(remainingSec3 * 7.5),
      vehiclePlate: generateVehiclePlate(svc.serviceNo, svc.operator, timestampSeconds + index * 300 + 99),
    };

    return {
      serviceNo: svc.serviceNo,
      operator: svc.operator,
      destinationCode: svc.destinationCode,
      destinationName: svc.destinationName,
      category: svc.category,
      nextBus: arrival1,
      nextBus2: arrival2,
      nextBus3: arrival3,
      inService: true,
      frequencyPeak: svc.frequencyPeak,
      frequencyOffPeak: svc.frequencyOffPeak,
    };
  }).sort((a, b) => {
    // Sort primarily by arrival urgency
    if (a.nextBus.estimatedMinutes !== b.nextBus.estimatedMinutes) {
      return a.nextBus.estimatedMinutes - b.nextBus.estimatedMinutes;
    }
    // Then natural service number order
    return parseInt(a.serviceNo, 10) - parseInt(b.serviceNo, 10);
  });
}

// Generate active bus fleet vehicles across Singapore
export function getActiveFleetVehicles(timestampSeconds: number): ActiveBusVehicle[] {
  const vehicles: ActiveBusVehicle[] = [];

  BUS_SERVICES_CATALOG.forEach((svc, svcIndex) => {
    const stops = svc.direction1Stops;
    if (stops.length < 2) return;

    // Place 2 to 3 active vehicles along this route
    const numVehicles = 3;
    for (let v = 0; v < numVehicles; v++) {
      const cycleOffset = (timestampSeconds / 120 + v * (stops.length / numVehicles)) % (stops.length - 1);
      const currStopIndex = Math.floor(cycleOffset);
      const nextStopIndex = currStopIndex + 1;
      const progressBetween = cycleOffset - currStopIndex;

      const stopA = stops[currStopIndex];
      const stopB = stops[nextStopIndex] || stops[stops.length - 1];

      // Interpolate coordinates
      const lat = stopA.lat + (stopB.lat - stopA.lat) * progressBetween;
      const lng = stopA.lng + (stopB.lng - stopA.lng) * progressBetween;

      // Calculate bearing
      const y = Math.sin(stopB.lng - stopA.lng) * Math.cos(stopB.lat);
      const x =
        Math.cos(stopA.lat) * Math.sin(stopB.lat) -
        Math.sin(stopA.lat) * Math.cos(stopB.lat) * Math.cos(stopB.lng - stopA.lng);
      const bearing = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);

      const loads: CrowdLoad[] = ['SEA', 'SDA', 'SEA', 'LSD'];
      const load = loads[(svcIndex + v) % loads.length];
      const types: BusType[] = ['DD', 'SD', 'DD'];
      const type = types[(svcIndex + v) % types.length];

      vehicles.push({
        vehicleId: `BUS-${svc.serviceNo}-${v + 1}`,
        serviceNo: svc.serviceNo,
        operator: svc.operator,
        direction: 1,
        currentLat: lat,
        currentLng: lng,
        speedKmH: 24 + Math.round(pseudoRandom(timestampSeconds + v) * 18),
        bearing,
        load,
        type,
        feature: 'WAB',
        nextStopCode: stopB.stopCode,
        nextStopName: stopB.stopName,
        destinationName: svc.destinationName,
      });
    }
  });

  return vehicles;
}

// Search stops and services by query string
export function searchBusStops(query: string): BusStop[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  return SINGAPORE_BUS_STOPS.filter((stop) => {
    return (
      stop.code.toLowerCase().includes(clean) ||
      stop.description.toLowerCase().includes(clean) ||
      stop.roadName.toLowerCase().includes(clean) ||
      (stop.mrtLines && stop.mrtLines.some((line) => line.toLowerCase() === clean))
    );
  });
}

export interface LtaConnectionStatus {
  isConfigured: boolean;
  isHealthy: boolean;
  message: string;
}

// Check health of the /api/health endpoint
export async function checkLtaHealth(): Promise<LtaConnectionStatus> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) {
      return { isConfigured: false, isHealthy: false, message: 'Serverless health check failed' };
    }
    const data = await res.json();
    const hasKey = Boolean(data.environment?.ltaAccountKeyConfigured);
    return {
      isConfigured: hasKey,
      isHealthy: true,
      message: hasKey
        ? 'Connected to LTA Datamall'
        : 'LTA_ACCOUNT_KEY not configured. Running high-precision transit simulator.',
    };
  } catch (err) {
    return { isConfigured: false, isHealthy: false, message: 'API gateway unreachable' };
  }
}

// Convert LTA Datamall NextBus object to BusArrivalDetail
function parseLtaNextBus(nb?: {
  EstimatedArrival?: string;
  Latitude?: string;
  Longitude?: string;
  Load?: string;
  Feature?: string;
  Type?: string;
}): BusArrivalDetail | undefined {
  if (!nb || !nb.EstimatedArrival) return undefined;

  const arrivalMs = new Date(nb.EstimatedArrival).getTime();
  const diffSec = Math.max(0, Math.floor((arrivalMs - Date.now()) / 1000));
  const diffMin = Math.floor(diffSec / 60);

  const lat = nb.Latitude ? parseFloat(nb.Latitude) : undefined;
  const lng = nb.Longitude ? parseFloat(nb.Longitude) : undefined;

  return {
    estimatedArrival: nb.EstimatedArrival,
    estimatedMinutes: diffMin,
    estimatedSeconds: diffSec,
    load: (nb.Load as CrowdLoad) || 'SEA',
    feature: nb.Feature === 'WAB' ? 'WAB' : '',
    type: (nb.Type as BusType) || 'SD',
    latitude: lat && lat > 0 ? lat : undefined,
    longitude: lng && lng > 0 ? lng : undefined,
  };
}

// Fetch live LTA Datamall data via serverless /api/busarrival
export async function fetchLiveLtaBusArrival(busStopCode: string): Promise<BusArrivalService[] | null> {
  try {
    const res = await fetch(`/api/busarrival?BusStopCode=${encodeURIComponent(busStopCode)}`);
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    if (!data.Services || !Array.isArray(data.Services)) {
      return null;
    }

    return data.Services.map((item: any) => {
      const nextBus1 = parseLtaNextBus(item.NextBus);
      const nextBus2 = parseLtaNextBus(item.NextBus2);
      const nextBus3 = parseLtaNextBus(item.NextBus3);

      return {
        serviceNo: item.ServiceNo,
        operator: (item.Operator as BusOperator) || 'SBST',
        destinationCode: item.NextBus?.DestinationCode || '',
        destinationName: `Stop ${item.NextBus?.DestinationCode || 'Destination'}`,
        category: 'Trunk',
        nextBus: nextBus1 || {
          estimatedArrival: new Date().toISOString(),
          estimatedMinutes: 0,
          estimatedSeconds: 0,
          load: 'SEA',
          feature: 'WAB',
          type: 'SD',
        },
        nextBus2,
        nextBus3,
        inService: Boolean(nextBus1),
      };
    }).sort((a: BusArrivalService, b: BusArrivalService) => {
      return a.nextBus.estimatedMinutes - b.nextBus.estimatedMinutes;
    });
  } catch (err) {
    return null;
  }
}

