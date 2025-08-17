/**
 * Database Integration for GPS Geofencing System
 * Handles all Supabase operations for device mappings, geofence config, and status updates
 */

import { createClient } from '@supabase/supabase-js';
import type { DeviceMapping, GeofenceConfig } from './location-types';

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Database operation result interface
 */
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Member status information
 */
export interface MemberStatus {
  id_member: string;
  status: string;
  last_updated: string;
  last_gps_update?: string;
}

/**
 * Location processing result for a single device
 */
export interface LocationProcessingResult {
  device_id: string;
  user_found: boolean;
  user_id?: string;
  geofence_applied: boolean;
  status_changed: boolean;
  old_status?: string;
  new_status?: string;
  distance_meters?: number;
  calculation_time_ms?: number;
  error?: string;
}

/**
 * Look up device mapping to find associated user
 * @param deviceId Device ID from Overland GPS app
 * @returns Device mapping or null if not found
 */
export async function lookupDeviceMapping(deviceId: string): Promise<DatabaseResult<DeviceMapping | null>> {
  try {
    const { data, error } = await supabase
      .from('device_mappings')
      .select('*')
      .eq('device_id', deviceId)
      .eq('enabled', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - not an error, just no mapping
        return { success: true, data: null };
      }
      return { success: false, error: `Database error: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to lookup device mapping: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Get geofence configuration for a specific dorm or default config
 * @param dormName Optional dorm name, defaults to first available config
 * @returns Geofence configuration or null if not found
 */
export async function getGeofenceConfig(dormName?: string): Promise<DatabaseResult<GeofenceConfig | null>> {
  try {
    let query = supabase.from('geofence_config').select('*');
    
    if (dormName) {
      query = query.eq('dorm_name', dormName);
    }
    
    const { data, error } = await query.limit(1).single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return { success: true, data: null };
      }
      return { success: false, error: `Database error: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to get geofence config: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Get current member status for hysteresis logic
 * @param memberId Member ID to lookup
 * @returns Current member status or null if not found
 */
export async function getCurrentMemberStatus(memberId: string): Promise<DatabaseResult<MemberStatus | null>> {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('id_member, status, last_updated, last_gps_update')
      .eq('id_member', memberId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: true, data: null };
      }
      return { success: false, error: `Database error: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to get member status: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Update member status in the database
 * @param memberId Member ID to update
 * @param newStatus New status value
 * @param gpsTimestamp Timestamp of GPS update
 * @returns Success result
 */
export async function updateMemberStatus(
  memberId: string, 
  newStatus: string, 
  gpsTimestamp?: string
): Promise<DatabaseResult<void>> {
  try {
    const updates: any = {
      status: newStatus,
      last_updated: new Date().toISOString()
    };

    // Add GPS timestamp if provided
    if (gpsTimestamp) {
      updates.last_gps_update = gpsTimestamp;
    }

    const { error } = await supabase
      .from('members')
      .update(updates)
      .eq('id_member', memberId);

    if (error) {
      return { success: false, error: `Database error: ${error.message}` };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to update member status: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Update last location update timestamp for a device mapping
 * @param deviceId Device ID to update
 * @returns Success result
 */
export async function updateDeviceLastSeen(deviceId: string): Promise<DatabaseResult<void>> {
  try {
    const { error } = await supabase
      .from('device_mappings')
      .update({ last_location_update: new Date().toISOString() })
      .eq('device_id', deviceId);

    if (error) {
      return { success: false, error: `Database error: ${error.message}` };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to update device last seen: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Get all device mappings for debugging/admin purposes
 * @returns Array of all device mappings
 */
export async function getAllDeviceMappings(): Promise<DatabaseResult<DeviceMapping[]>> {
  try {
    const { data, error } = await supabase
      .from('device_mappings')
      .select('*')
      .eq('enabled', true)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: `Database error: ${error.message}` };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to get device mappings: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Get all geofence configurations for debugging/admin purposes
 * @returns Array of all geofence configurations
 */
export async function getAllGeofenceConfigs(): Promise<DatabaseResult<GeofenceConfig[]>> {
  try {
    const { data, error } = await supabase
      .from('geofence_config')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: `Database error: ${error.message}` };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to get geofence configs: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Create a new device mapping (for setup/admin purposes)
 * @param deviceId Device ID from Overland GPS app
 * @param memberId Member ID to associate with
 * @param dormName Optional dorm name
 * @returns Success result with created mapping
 */
export async function createDeviceMapping(
  deviceId: string, 
  memberId: string, 
  dormName?: string
): Promise<DatabaseResult<DeviceMapping>> {
  try {
    const mappingData = {
      device_id: deviceId,
      id_member: memberId,
      enabled: true,
      dorm_name: dormName,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('device_mappings')
      .insert(mappingData)
      .select()
      .single();

    if (error) {
      return { success: false, error: `Database error: ${error.message}` };
    }

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to create device mapping: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Test database connectivity and permissions
 * @returns Success result with connection info
 */
export async function testDatabaseConnection(): Promise<DatabaseResult<{ tables: string[], timestamp: string }>> {
  try {
    // Try to query a simple table to test connection
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('count', { count: 'exact', head: true });

    const { data: devices, error: devicesError } = await supabase
      .from('device_mappings')
      .select('count', { count: 'exact', head: true });

    const { data: configs, error: configsError } = await supabase
      .from('geofence_config')
      .select('count', { count: 'exact', head: true });

    const tables: string[] = [];
    if (!membersError) tables.push('members');
    if (!devicesError) tables.push('device_mappings');
    if (!configsError) tables.push('geofence_config');

    return { 
      success: true, 
      data: { 
        tables, 
        timestamp: new Date().toISOString() 
      } 
    };
  } catch (error) {
    return { 
      success: false, 
      error: `Database connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
} 