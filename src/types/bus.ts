export type BusOperator = 'SBST' | 'SMRT' | 'TTS' | 'GAS';
export type CrowdLoad = 'SEA' | 'SDA' | 'LSD'; // Seats Available, Standing Available, Limited Standing
export type BusType = 'SD' | 'DD' | 'BD'; // Single Deck, Double Deck, Bendy

export interface BusArrivalDetail {
  estimatedArrival: string; // ISO string or human string
  estimatedMinutes: number; // in whole minutes (0 = arriving)
  estimatedSeconds: number; // countdown
  load: CrowdLoad;
  feature: 'WAB' | ''; // Wheelchair Accessible Bus
  type: BusType;
  latitude?: number;
  longitude?: number;
  speedKmH?: number;
  distanceMeters?: number;
  vehiclePlate?: string;
}

export interface BusArrivalService {
  serviceNo: string;
  operator: BusOperator;
  destinationCode: string;
  destinationName: string;
  category: 'Trunk' | 'Feeder' | 'Express' | 'City Direct' | 'Night';
  nextBus: BusArrivalDetail;
  nextBus2?: BusArrivalDetail;
  nextBus3?: BusArrivalDetail;
  inService: boolean;
  frequencyPeak?: string;
  frequencyOffPeak?: string;
}

export interface BusStop {
  code: string;
  description: string;
  roadName: string;
  latitude: number;
  longitude: number;
  mrtLines?: string[]; // e.g. ['NS', 'DT', 'EW']
  hubType?: 'Interchange' | 'MRT Hub' | 'Express Hub' | 'Standard';
  distanceMeters?: number;
}

export interface ActiveBusVehicle {
  vehicleId: string;
  serviceNo: string;
  operator: BusOperator;
  direction: 1 | 2;
  currentLat: number;
  currentLng: number;
  speedKmH: number;
  bearing: number;
  load: CrowdLoad;
  type: BusType;
  feature: 'WAB' | '';
  nextStopCode: string;
  nextStopName: string;
  destinationName: string;
}

export interface RouteStopInfo {
  stopCode: string;
  stopName: string;
  roadName: string;
  sequence: number;
  distanceKm: number;
  mrtLines?: string[];
  lat: number;
  lng: number;
}

export interface BusServiceDetail {
  serviceNo: string;
  operator: BusOperator;
  category: 'Trunk' | 'Feeder' | 'Express' | 'City Direct' | 'Night';
  originName: string;
  originCode: string;
  destinationName: string;
  destinationCode: string;
  firstBus: string;
  lastBus: string;
  frequencyPeak: string;
  frequencyOffPeak: string;
  direction1Stops: RouteStopInfo[];
  direction2Stops?: RouteStopInfo[];
}

export interface SavedStop {
  stopCode: string;
  customLabel?: string;
  pinnedServices?: string[];
  addedAt: number;
}
