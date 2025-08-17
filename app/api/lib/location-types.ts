/**
 * TypeScript interfaces for GPS Geofencing Location Processing
 * Based on Overland GPS app data format and system requirements
 */

// Overland GPS Request Interfaces
export interface OverlandRequest {
  locations: OverlandLocation[];
  device_id?: string;
}

export interface OverlandLocation {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    timestamp: string; // ISO 8601
    altitude?: number;
    speed?: number;
    horizontal_accuracy: number;
    vertical_accuracy?: number;
    motion: string[];
    battery_state: string;
    battery_level: number;
    device_id: string;
    wifi?: string;
  };
}

// API Response Interfaces
export interface LocationProcessingResponse {
  result: "ok" | "error";
  message?: string;
  processed_count?: number;
  status_changed?: boolean;
  new_status?: string;
}

export interface ErrorResponse {
  result: "error";
  error: string;
  details?: string;
  timestamp: string;
}

// Database Interfaces (for future stories)
export interface GeofenceConfig {
  id_geofence_config: string;
  dorm_name: string;
  center_latitude: number;
  center_longitude: number;
  radius_meters: number;
  hysteresis_meters: number;
  created_at: string;
  updated_at: string;
}

export interface DeviceMapping {
  id_device_mappings: string;
  device_id: string;
  id_member: string;
  enabled: boolean;
  created_at: string;
  last_location_update?: string;
  dorm_name?: string;
}

export interface StatusUpdate {
  id_member: string;
  new_status: 'IN_ROOM' | 'AWAY';
  timestamp: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Validation helper types
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  details?: string;
}

// Logging interfaces
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  request_id?: string;
} 