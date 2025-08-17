/**
 * Geofencing Logic Implementation for GPS Location Processing
 * Implements Haversine formula distance calculations and hysteresis-based boundary detection
 */

import type { GeofenceConfig } from './location-types';

// Earth's radius in meters (mean radius)
const EARTH_RADIUS_METERS = 6371000;

/**
 * Coordinate pair for distance calculations
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Result of geofence boundary calculation
 */
export interface GeofenceResult {
  inside_boundary: boolean;
  distance_meters: number;
  status_should_change: boolean;
  new_status?: 'IN_ROOM' | 'AWAY';
  calculation_time_ms: number;
  hysteresis_applied: boolean;
}

/**
 * Validation result for coordinates
 */
export interface CoordinateValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Validation result for geofence configuration
 */
export interface GeofenceConfigValidation {
  isValid: boolean;
  error?: string;
  details?: string;
}

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Validate GPS coordinates are within valid ranges
 * @param coords Coordinates to validate
 * @returns Validation result with error details if invalid
 */
export function validateCoordinates(coords: Coordinates): CoordinateValidation {
  const { latitude, longitude } = coords;

  // Check if coordinates are numbers
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return {
      isValid: false,
      error: 'Coordinates must be numbers'
    };
  }

  // Check for invalid values (NaN, Infinity)
  if (!isFinite(latitude) || !isFinite(longitude)) {
    return {
      isValid: false,
      error: 'Coordinates must be finite numbers'
    };
  }

  // Check latitude range (-90 to 90)
  if (latitude < -90 || latitude > 90) {
    return {
      isValid: false,
      error: `Latitude must be between -90 and 90, got ${latitude}`
    };
  }

  // Check longitude range (-180 to 180)
  if (longitude < -180 || longitude > 180) {
    return {
      isValid: false,
      error: `Longitude must be between -180 and 180, got ${longitude}`
    };
  }

  return { isValid: true };
}

/**
 * Validate geofence configuration parameters
 * @param config Geofence configuration to validate
 * @returns Validation result with error details if invalid
 */
export function validateGeofenceConfig(config: Partial<GeofenceConfig>): GeofenceConfigValidation {
  if (!config.center_latitude || !config.center_longitude) {
    return {
      isValid: false,
      error: 'Missing center coordinates',
      details: 'center_latitude and center_longitude are required'
    };
  }

  // Validate center coordinates
  const centerValidation = validateCoordinates({
    latitude: config.center_latitude,
    longitude: config.center_longitude
  });

  if (!centerValidation.isValid) {
    return {
      isValid: false,
      error: 'Invalid center coordinates',
      details: centerValidation.error
    };
  }

  // Validate radius
  if (!config.radius_meters || typeof config.radius_meters !== 'number') {
    return {
      isValid: false,
      error: 'Invalid radius',
      details: 'radius_meters must be a positive number'
    };
  }

  if (config.radius_meters <= 0) {
    return {
      isValid: false,
      error: 'Invalid radius value',
      details: 'radius_meters must be greater than 0'
    };
  }

  // Validate hysteresis (optional, defaults to 10% of radius)
  if (config.hysteresis_meters !== undefined) {
    if (typeof config.hysteresis_meters !== 'number' || config.hysteresis_meters < 0) {
      return {
        isValid: false,
        error: 'Invalid hysteresis',
        details: 'hysteresis_meters must be a non-negative number'
      };
    }

    // Hysteresis should not be larger than radius
    if (config.hysteresis_meters >= config.radius_meters) {
      return {
        isValid: false,
        error: 'Hysteresis too large',
        details: 'hysteresis_meters must be less than radius_meters'
      };
    }
  }

  return { isValid: true };
}

/**
 * Calculate the great circle distance between two GPS coordinates using the Haversine formula
 * 
 * Formula: a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
 *          c = 2 ⋅ atan2( √a, √(1−a) )
 *          d = R ⋅ c
 * 
 * @param point1 First GPS coordinate
 * @param point2 Second GPS coordinate
 * @returns Distance in meters
 * @throws Error if coordinates are invalid
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  // Validate input coordinates
  const validation1 = validateCoordinates(point1);
  const validation2 = validateCoordinates(point2);

  if (!validation1.isValid) {
    throw new Error(`Invalid point1 coordinates: ${validation1.error}`);
  }
  if (!validation2.isValid) {
    throw new Error(`Invalid point2 coordinates: ${validation2.error}`);
  }

  const { latitude: lat1, longitude: lon1 } = point1;
  const { latitude: lat2, longitude: lon2 } = point2;

  // Convert degrees to radians
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  // Apply Haversine formula
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
           Math.cos(φ1) * Math.cos(φ2) *
           Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Calculate distance
  const distance = EARTH_RADIUS_METERS * c;

  return distance;
}

/**
 * Determine if a coordinate is inside a circular geofence boundary
 * @param location GPS coordinate to check
 * @param geofenceCenter Center of the geofence circle
 * @param radiusMeters Radius of the geofence in meters
 * @returns True if location is inside the boundary
 * @throws Error if inputs are invalid
 */
export function isInsideGeofence(
  location: Coordinates, 
  geofenceCenter: Coordinates, 
  radiusMeters: number
): boolean {
  if (radiusMeters <= 0) {
    throw new Error('Radius must be greater than 0');
  }

  const distance = calculateDistance(location, geofenceCenter);
  return distance <= radiusMeters;
}

/**
 * Determine if status should change based on location, previous status, and hysteresis logic
 * 
 * Hysteresis prevents rapid status changes when near boundary:
 * - To enter: distance must be < (radius - hysteresis)
 * - To exit: distance must be > (radius + hysteresis)
 * - In between: maintain previous status
 * 
 * @param location Current GPS coordinate
 * @param config Geofence configuration
 * @param previousStatus Previous location status
 * @returns Geofence result with status change determination
 * @throws Error if inputs are invalid
 */
export function determineStatusChange(
  location: Coordinates,
  config: GeofenceConfig,
  previousStatus: 'IN_ROOM' | 'AWAY'
): GeofenceResult {
  const startTime = performance.now();

  // Validate configuration
  const configValidation = validateGeofenceConfig(config);
  if (!configValidation.isValid) {
    throw new Error(`Invalid geofence config: ${configValidation.error} - ${configValidation.details}`);
  }

  const geofenceCenter: Coordinates = {
    latitude: config.center_latitude,
    longitude: config.center_longitude
  };

  // Calculate distance to geofence center
  const distance = calculateDistance(location, geofenceCenter);

  // Apply default hysteresis if not specified (10% of radius)
  const hysteresis = config.hysteresis_meters ?? (config.radius_meters * 0.1);
  
  // Calculate hysteresis boundaries
  const enterRadius = config.radius_meters - hysteresis;  // Smaller radius to enter
  const exitRadius = config.radius_meters + hysteresis;   // Larger radius to exit

  let statusShouldChange = false;
  let newStatus: 'IN_ROOM' | 'AWAY' | undefined;
  let hysteresisApplied = false;

  // Determine status based on hysteresis logic
  if (distance <= enterRadius) {
    // Clearly inside - should be IN_ROOM
    if (previousStatus === 'AWAY') {
      statusShouldChange = true;
      newStatus = 'IN_ROOM';
    }
  } else if (distance >= exitRadius) {
    // Clearly outside - should be AWAY
    if (previousStatus === 'IN_ROOM') {
      statusShouldChange = true;
      newStatus = 'AWAY';
    }
  } else {
    // In hysteresis zone - maintain previous status
    hysteresisApplied = true;
  }

  const calculationTime = performance.now() - startTime;

  return {
    inside_boundary: distance <= config.radius_meters,
    distance_meters: distance,
    status_should_change: statusShouldChange,
    new_status: newStatus,
    calculation_time_ms: calculationTime,
    hysteresis_applied: hysteresisApplied
  };
}

/**
 * Simple boundary check without hysteresis (for testing/debugging)
 * @param location GPS coordinate to check
 * @param config Geofence configuration
 * @returns Basic geofence result
 */
export function checkGeofenceBoundary(
  location: Coordinates,
  config: GeofenceConfig
): { inside: boolean; distance: number } {
  const geofenceCenter: Coordinates = {
    latitude: config.center_latitude,
    longitude: config.center_longitude
  };

  const distance = calculateDistance(location, geofenceCenter);
  const inside = distance <= config.radius_meters;

  return { inside, distance };
}

/**
 * Utility function to create test geofence configuration
 * @param center Center coordinates
 * @param radius Radius in meters
 * @param hysteresis Hysteresis in meters (optional)
 * @returns Test geofence configuration
 */
export function createTestGeofenceConfig(
  center: Coordinates,
  radius: number,
  hysteresis?: number
): GeofenceConfig {
  return {
    id_geofence_config: 'test-config',
    dorm_name: 'Test Dorm',
    center_latitude: center.latitude,
    center_longitude: center.longitude,
    radius_meters: radius,
    hysteresis_meters: hysteresis ?? Math.round(radius * 0.1),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
} 