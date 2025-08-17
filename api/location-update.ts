/**
 * Vercel API Endpoint for GPS Location Processing
 * Receives location data from Overland GPS iOS app and processes geofencing logic
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { 
  OverlandRequest, 
  LocationProcessingResponse, 
  ErrorResponse,
  ValidationResult 
} from './lib/location-types';

// Environment variables (for future database integration)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Generate a unique request ID for logging and tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Structured logging function
 */
function logMessage(
  level: 'info' | 'warn' | 'error',
  message: string,
  data?: any,
  requestId?: string
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    request_id: requestId,
    ...(data && { data })
  };
  
  console.log(JSON.stringify(logEntry));
}

/**
 * Validate incoming Overland GPS request structure
 */
function validateOverlandRequest(body: any): ValidationResult {
  try {
    // Check if body exists
    if (!body) {
      return {
        isValid: false,
        error: 'Missing request body',
        details: 'Request body is required'
      };
    }

    // Check for locations array
    if (!Array.isArray(body.locations)) {
      return {
        isValid: false,
        error: 'Invalid locations format',
        details: 'locations must be an array'
      };
    }

    // Validate each location in the array
    for (let i = 0; i < body.locations.length; i++) {
      const location = body.locations[i];
      
      // Check required structure
      if (location.type !== 'Feature') {
        return {
          isValid: false,
          error: `Invalid location type at index ${i}`,
          details: 'location.type must be "Feature"'
        };
      }

      if (!location.geometry || location.geometry.type !== 'Point') {
        return {
          isValid: false,
          error: `Invalid geometry at index ${i}`,
          details: 'geometry.type must be "Point"'
        };
      }

      if (!Array.isArray(location.geometry.coordinates) || 
          location.geometry.coordinates.length !== 2) {
        return {
          isValid: false,
          error: `Invalid coordinates at index ${i}`,
          details: 'coordinates must be [longitude, latitude] array'
        };
      }

      // Validate coordinates are numbers
      const [lon, lat] = location.geometry.coordinates;
      if (typeof lon !== 'number' || typeof lat !== 'number') {
        return {
          isValid: false,
          error: `Invalid coordinate values at index ${i}`,
          details: 'longitude and latitude must be numbers'
        };
      }

      // Validate coordinate ranges
      if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
        return {
          isValid: false,
          error: `Coordinates out of range at index ${i}`,
          details: 'longitude: -180 to 180, latitude: -90 to 90'
        };
      }

      // Check required properties
      if (!location.properties) {
        return {
          isValid: false,
          error: `Missing properties at index ${i}`,
          details: 'location.properties is required'
        };
      }

      const props = location.properties;
      
      // Check required fields
      if (!props.device_id || typeof props.device_id !== 'string') {
        return {
          isValid: false,
          error: `Invalid device_id at index ${i}`,
          details: 'device_id must be a non-empty string'
        };
      }

      if (!props.timestamp || typeof props.timestamp !== 'string') {
        return {
          isValid: false,
          error: `Invalid timestamp at index ${i}`,
          details: 'timestamp must be a valid ISO 8601 string'
        };
      }

      // Validate timestamp format (basic ISO 8601 check)
      if (isNaN(Date.parse(props.timestamp))) {
        return {
          isValid: false,
          error: `Invalid timestamp format at index ${i}`,
          details: 'timestamp must be a valid ISO 8601 date string'
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Validation error',
      details: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
}

/**
 * Extract unique device IDs from the request
 */
function extractDeviceIds(request: OverlandRequest): string[] {
  const deviceIds = new Set<string>();
  
  // Add device_id from root level if present
  if (request.device_id) {
    deviceIds.add(request.device_id);
  }
  
  // Add device_ids from each location
  request.locations.forEach(location => {
    if (location.properties.device_id) {
      deviceIds.add(location.properties.device_id);
    }
  });
  
  return Array.from(deviceIds);
}

/**
 * Main API handler for location updates
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LocationProcessingResponse | ErrorResponse>
) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  logMessage('info', 'Location update request received', {
    method: req.method,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    }
  }, requestId);

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      logMessage('warn', 'Invalid HTTP method', { method: req.method }, requestId);
      return res.status(405).json({
        result: 'error',
        error: 'Method not allowed',
        details: 'Only POST requests are accepted',
        timestamp: new Date().toISOString()
      });
    }

    // Check content-type header
    if (!req.headers['content-type']?.includes('application/json')) {
      logMessage('warn', 'Invalid content-type', { 
        contentType: req.headers['content-type'] 
      }, requestId);
      return res.status(400).json({
        result: 'error',
        error: 'Invalid content-type',
        details: 'Content-Type must be application/json',
        timestamp: new Date().toISOString()
      });
    }

    // Validate request body structure
    const validation = validateOverlandRequest(req.body);
    if (!validation.isValid) {
      logMessage('warn', 'Request validation failed', {
        error: validation.error,
        details: validation.details
      }, requestId);
      
      return res.status(400).json({
        result: 'error',
        error: validation.error || 'Validation failed',
        details: validation.details,
        timestamp: new Date().toISOString()
      });
    }

    // Cast to proper type after validation
    const overlandRequest = req.body as OverlandRequest;
    
    // Extract processing information
    const locationCount = overlandRequest.locations.length;
    const deviceIds = extractDeviceIds(overlandRequest);
    const processingTime = Date.now() - startTime;
    
    logMessage('info', 'Processing location data', {
      location_count: locationCount,
      device_ids: deviceIds,
      processing_time_ms: processingTime
    }, requestId);

    // Log location details (for development/debugging)
    overlandRequest.locations.forEach((location, index) => {
      const [lon, lat] = location.geometry.coordinates;
      logMessage('info', `Location ${index + 1}`, {
        device_id: location.properties.device_id,
        coordinates: { latitude: lat, longitude: lon },
        timestamp: location.properties.timestamp,
        accuracy: location.properties.horizontal_accuracy,
        motion: location.properties.motion,
        battery_level: location.properties.battery_level
      }, requestId);
    });

    // For this story, we just log and acknowledge - no actual geofencing yet
    // Future stories will add database lookups and geofencing calculations here

    const finalProcessingTime = Date.now() - startTime;
    
    logMessage('info', 'Location processing completed successfully', {
      processed_count: locationCount,
      total_processing_time_ms: finalProcessingTime
    }, requestId);

    // Return successful response (required format for Overland GPS app)
    return res.status(200).json({
      result: 'ok',
      message: 'Location data received and logged',
      processed_count: locationCount
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logMessage('error', 'Unexpected error processing location data', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processing_time_ms: processingTime
    }, requestId);

    return res.status(500).json({
      result: 'error',
      error: 'Internal server error',
      details: 'An unexpected error occurred while processing the request',
      timestamp: new Date().toISOString()
    });
  }
} 