'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import supabase from '../supabase-client';
import { GeofenceMemberWithUser } from '../types';

interface UseMembersResult {
  members: GeofenceMemberWithUser[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMembers(geofenceId: string | null): UseMembersResult {
  const { user } = useUser();
  const [members, setMembers] = useState<GeofenceMemberWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!geofenceId || !user) {
      setMembers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch members via API endpoint
      const response = await fetch(`/api/geofences/${geofenceId}/members`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const { members } = await response.json();
      setMembers(members || []);
    } catch (err) {
      console.error('Failed to fetch members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch members');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMembers();
  }, [geofenceId, user]);

  // Real-time subscription for member updates
  useEffect(() => {
    if (!geofenceId || !user) return;

    const channel = supabase
      .channel(`geofence-members-${geofenceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'geofence_members',
          filter: `id_geofence=eq.${geofenceId}`
        },
        () => {
          // Refetch members when there are changes
          fetchMembers();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [geofenceId, user]);

  return {
    members,
    isLoading,
    error,
    refetch: fetchMembers
  };
} 