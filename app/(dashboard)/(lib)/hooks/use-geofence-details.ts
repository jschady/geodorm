'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import supabase from '../supabase-client';
import { Geofence } from '../types';

interface UseGeofenceDetailsResult {
  geofence: (Geofence & { role: 'owner' | 'member' }) | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGeofenceDetails(geofenceId: string | null): UseGeofenceDetailsResult {
  const { user } = useUser();
  const [geofence, setGeofence] = useState<(Geofence & { role: 'owner' | 'member' }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGeofence = async () => {
    if (!geofenceId || !user) {
      setGeofence(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch geofence with member information to determine role
      const { data, error: fetchError } = await supabase
        .from('geofences')
        .select(`
          *,
          geofence_members!inner(
            role,
            id_user
          )
        `)
        .eq('id_geofence', geofenceId)
        .eq('geofence_members.id_user', user.id)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      if (data) {
        const geofenceWithRole = {
          ...data,
          role: data.geofence_members?.[0]?.role || 'member'
        };
        setGeofence(geofenceWithRole as any);
      }
    } catch (err) {
      console.error('Failed to fetch geofence:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch geofence');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchGeofence();
  }, [geofenceId, user]);

  return {
    geofence,
    isLoading,
    error,
    refetch: fetchGeofence
  };
} 