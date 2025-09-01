'use server';

import { auth } from '@clerk/nextjs/server';
import { createServerClient } from './client';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import type { GeofenceListItem, CreateGeofenceRequest, CreateGeofenceResponse, InviteValidationResponse } from '../types';


export type ServerActionResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  details?: any;
};

export async function getGeofences(): Promise<ServerActionResult<GeofenceListItem[]>> {
  try {
    const { getToken, userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized - Please sign in to view geofences'
      };
    }

    const token = await getToken({ template: 'supabase' });
    const supabase = createServerClient(token);

    const { data: geofences, error: queryError } = await supabase
      .from('geofences')
      .select(`
        id_geofence,
        name,
        invite_code,
        created_at,
        geofence_members!inner (
          role,
          id_user
        )
      `)
      .eq('geofence_members.id_user', userId)
      .order('created_at', { ascending: false });

    if (queryError) {
      console.error('Failed to query geofences:', queryError);
      return {
        success: false,
        error: 'Failed to retrieve geofences',
        details: queryError
      };
    }

    const geofenceIds = geofences.map(g => g.id_geofence);
    
    const { data: memberCounts, error: countError } = await supabase
      .from('geofence_members')
      .select('id_geofence')
      .in('id_geofence', geofenceIds);

    if (countError) {
      console.error('Failed to get member counts:', countError);
      return {
        success: false,
        error: 'Failed to retrieve member counts',
        details: countError
      };
    }

    const memberCountMap = memberCounts.reduce((acc, member) => {
      acc[member.id_geofence] = (acc[member.id_geofence] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const result: GeofenceListItem[] = geofences.map(geofence => ({
      id_geofence: geofence.id_geofence,
      name: geofence.name,
      member_count: memberCountMap[geofence.id_geofence] || 0,
      created_at: geofence.created_at,
      invite_code: geofence.invite_code,
      role: geofence.geofence_members[0]?.role || 'member'
    }));

    return { success: true, data: result };

  } catch (error) {
    console.error('Geofence retrieval error:', error);
    return {
      success: false,
      error: 'Internal server error',
      details: error
    };
  }
}

export async function getGeofenceDetails(geofenceId: string): Promise<ServerActionResult<any>> {
  try {
    const { getToken, userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized - Please sign in to view geofence details'
      };
    }

    const token = await getToken({ template: 'supabase' });
    const supabase = createServerClient(token);

    const { data: geofence, error: geofenceError } = await supabase
      .from('geofences')
      .select(`
        *,
        geofence_members!inner (
          role,
          id_user
        )
      `)
      .eq('id_geofence', geofenceId)
      .eq('geofence_members.id_user', userId)
      .single();

    if (geofenceError || !geofence) {
      return {
        success: false,
        error: 'Geofence not found or you do not have access',
        details: geofenceError
      };
    }

    const geofenceWithRole = {
      ...geofence,
      role: geofence.geofence_members[0]?.role || 'member'
    };

    return { success: true, data: geofenceWithRole };

  } catch (error) {
    console.error('Geofence details error:', error);
    return {
      success: false,
      error: 'Internal server error',
      details: error
    };
  }
}

export async function createGeofence(formData: FormData): Promise<ServerActionResult<CreateGeofenceResponse>> {
  try {
    const { getToken, userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized - Please sign in to create geofences'
      };
    }

    const name = formData.get('name') as string;
    const centerLatStr = formData.get('center_latitude') as string;
    const centerLngStr = formData.get('center_longitude') as string;
    const radiusStr = formData.get('radius_meters') as string;
    const hysteresisStr = formData.get('hysteresis_meters') as string;

    const center_latitude = parseFloat(centerLatStr);
    const center_longitude = parseFloat(centerLngStr);
    const radius_meters = parseInt(radiusStr);
    const hysteresis_meters = hysteresisStr ? parseInt(hysteresisStr) : Math.max(5, Math.round(Math.min(radius_meters * 0.1, 50)));

    if (!name?.trim()) {
      return {
        success: false,
        error: 'Geofence name is required'
      };
    }

    if (isNaN(center_latitude) || isNaN(center_longitude)) {
      return {
        success: false,
        error: 'Valid latitude and longitude coordinates are required'
      };
    }

    if (Math.abs(center_latitude) > 90 || Math.abs(center_longitude) > 180) {
      return {
        success: false,
        error: 'Coordinates are out of valid range'
      };
    }

    if (radius_meters < 10 || radius_meters > 1000) {
      return {
        success: false,
        error: 'Radius must be between 10 and 1000 meters'
      };
    }

    if (hysteresis_meters < 5 || hysteresis_meters >= radius_meters) {
      return {
        success: false,
        error: 'Hysteresis must be between 5 meters and less than radius'
      };
    }

    const token = await getToken({ template: 'supabase' });
    const supabase = createServerClient(token);

    const invite_code = nanoid(10);

    const { error: userUpsertError } = await supabase
      .from('users')
      .upsert(
        { 
          id_user: userId,
          email: '',
          updated_at: new Date().toISOString()
        },
        { 
          onConflict: 'id_user',
          ignoreDuplicates: true 
        }
      );

    if (userUpsertError) {
      console.error('Failed to upsert user:', userUpsertError);
      return {
        success: false,
        error: 'Failed to initialize user account',
        details: userUpsertError
      };
    }

    const { data: geofence, error: createError } = await supabase
      .from('geofences')
      .insert({
        id_user: userId,
        name: name.trim(),
        invite_code,
        center_latitude,
        center_longitude,
        radius_meters,
        hysteresis_meters
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create geofence:', createError);
      
      if (createError.code === '23505') {
        return {
          success: false,
          error: 'A geofence with this invite code already exists. Please try again.'
        };
      }

      return {
        success: false,
        error: 'Failed to create geofence',
        details: createError
      };
    }

    const response: CreateGeofenceResponse = {
      id_geofence: geofence.id_geofence,
      name: geofence.name,
      invite_code: geofence.invite_code,
      center_latitude: geofence.center_latitude,
      center_longitude: geofence.center_longitude,
      radius_meters: geofence.radius_meters,
      hysteresis_meters: geofence.hysteresis_meters,
      created_at: geofence.created_at
    };

    revalidatePath('/dashboard');

    return { success: true, data: response };

  } catch (error) {
    console.error('Geofence creation error:', error);
    return {
      success: false,
      error: 'Internal server error',
      details: error
    };
  }
}

export async function updateGeofence(geofenceId: string, formData: FormData): Promise<ServerActionResult<any>> {
  try {
    const { getToken, userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized - Please sign in to update geofences'
      };
    }

    const token = await getToken({ template: 'supabase' });
    const supabase = createServerClient(token);

    const { data: geofence, error: geofenceError } = await supabase
      .from('geofences')
      .select('id_user')
      .eq('id_geofence', geofenceId)
      .single();

    if (geofenceError || !geofence) {
      return {
        success: false,
        error: 'Geofence not found'
      };
    }

    if (geofence.id_user !== userId) {
      return {
        success: false,
        error: 'You can only update geofences you own'
      };
    }

    const name = formData.get('name') as string;
    const centerLatStr = formData.get('center_latitude') as string;
    const centerLngStr = formData.get('center_longitude') as string;
    const radiusStr = formData.get('radius_meters') as string;

    const updates: any = {};
    
    if (name?.trim()) {
      updates.name = name.trim();
    }
    
    if (centerLatStr) {
      const center_latitude = parseFloat(centerLatStr);
      if (!isNaN(center_latitude) && Math.abs(center_latitude) <= 90) {
        updates.center_latitude = center_latitude;
      }
    }
    
    if (centerLngStr) {
      const center_longitude = parseFloat(centerLngStr);
      if (!isNaN(center_longitude) && Math.abs(center_longitude) <= 180) {
        updates.center_longitude = center_longitude;
      }
    }
    
    if (radiusStr) {
      const radius_meters = parseInt(radiusStr);
      if (!isNaN(radius_meters) && radius_meters >= 10 && radius_meters <= 1000) {
        updates.radius_meters = radius_meters;
        updates.hysteresis_meters = Math.max(5, Math.round(Math.min(radius_meters * 0.1, 50)));
      }
    }

    const { data: updatedGeofence, error: updateError } = await supabase
      .from('geofences')
      .update(updates)
      .eq('id_geofence', geofenceId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update geofence:', updateError);
      return {
        success: false,
        error: 'Failed to update geofence',
        details: updateError
      };
    }

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/${geofenceId}`);

    return { success: true, data: updatedGeofence };

  } catch (error) {
    console.error('Geofence update error:', error);
    return {
      success: false,
      error: 'Internal server error',
      details: error
    };
  }
}

export async function deleteGeofence(geofenceId: string): Promise<ServerActionResult<void>> {
  try {
    const { getToken, userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized - Please sign in to delete geofences'
      };
    }

    const token = await getToken({ template: 'supabase' });
    const supabase = createServerClient(token);

    const { data: geofence, error: geofenceError } = await supabase
      .from('geofences')
      .select('id_user')
      .eq('id_geofence', geofenceId)
      .single();

    if (geofenceError) {
      console.error('Failed to check geofence ownership:', geofenceError);
      return {
        success: false,
        error: 'Geofence not found'
      };
    }

    if (geofence.id_user !== userId) {
      return {
        success: false,
        error: 'You can only delete geofences you own'
      };
    }

    const { error: deleteError } = await supabase
      .from('geofences')
      .delete()
      .eq('id_geofence', geofenceId);

    if (deleteError) {
      console.error('Failed to delete geofence:', deleteError);
      return {
        success: false,
        error: 'Failed to delete geofence',
        details: deleteError
      };
    }

    revalidatePath('/dashboard');

    return { success: true, data: undefined };

  } catch (error) {
    console.error('Geofence deletion error:', error);
    return {
      success: false,
      error: 'Internal server error',
      details: error
    };
  }
}

export async function validateInvite(inviteCode: string): Promise<ServerActionResult<any>> {
  try {
    if (!inviteCode?.trim()) {
      return {
        success: false,
        error: 'Invite code is required'
      };
    }

    const supabase = createServerClient(null);

    const { data: geofence, error: geofenceError } = await supabase
        .from('geofences')
        .select(`
          id_geofence,
          name,
          created_at,
          owner:users!geofences_id_user_fkey(full_name)
        `)
        .eq('invite_code', inviteCode)
        .single();

    if (geofenceError || !geofence) {
      return {
        success: true,
        data: {
          valid: false,
          error: geofenceError?.message || 'Invalid or expired invitation code'
        }
      };
    }

    const { data: members, error: membersError } = await supabase
      .from('geofence_members')
      .select('id_user')
      .eq('id_geofence', geofence.id_geofence);

    if (membersError) {
      console.error('Failed to get member count:', membersError);
      return {
        success: false,
        error: 'Failed to retrieve member information'
      };
    }

    const response: InviteValidationResponse = {
        valid: true,
        geofence: {
          id_geofence: geofence.id_geofence,
          name: geofence.name,
          owner_name: (geofence as any).owner?.full_name || 'Unknown',
          member_count: members?.length || 0,
          created_at: geofence.created_at
        }
      };

    return { success: true, data: response };

  } catch (error) {
    console.error('Invite validation error:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function joinGeofence(inviteCode: string): Promise<ServerActionResult<{ geofence: any }>> {
  try {
    const { getToken, userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        error: 'Unauthorized - Please sign in to join geofences'
      };
    }

    if (!inviteCode?.trim()) {
      return {
        success: false,
        error: 'Invite code is required'
      };
    }

    const token = await getToken({ template: 'supabase' });
    const supabase = createServerClient(token);

    const { error: userUpsertError } = await supabase
      .from('users')
      .upsert(
        { 
          id_user: userId,
          email: '',
          updated_at: new Date().toISOString()
        },
        { 
          onConflict: 'id_user',
          ignoreDuplicates: true 
        }
      );

    if (userUpsertError) {
      console.error('Failed to upsert user:', userUpsertError);
      return {
        success: false,
        error: 'Failed to initialize user account',
        details: userUpsertError
      };
    }

    const { data: geofence, error: geofenceError } = await supabase
      .from('geofences')
      .select('id_geofence, name, id_user')
      .eq('invite_code', inviteCode.trim())
      .single();

    if (geofenceError || !geofence) {
      return {
        success: false,
        error: 'Invalid or expired invitation code'
      };
    }

    const { data: existingMember, error: memberCheckError } = await supabase
      .from('geofence_members')
      .select('id_user')
      .eq('id_geofence', geofence.id_geofence)
      .eq('id_user', userId)
      .single();

    if (memberCheckError && memberCheckError.code !== 'PGRST116') {
      console.error('Failed to check existing membership:', memberCheckError);
      return {
        success: false,
        error: 'Failed to verify membership status',
        details: memberCheckError
      };
    }

    if (existingMember) {
      return {
        success: false,
        error: 'You are already a member of this geofence'
      };
    }

    const { error: insertError } = await supabase
      .from('geofence_members')
      .insert({
        id_geofence: geofence.id_geofence,
        id_user: userId,
        role: geofence.id_user === userId ? 'owner' : 'member'
      });

    if (insertError) {
      console.error('Failed to add member:', insertError);
      return {
        success: false,
        error: 'Failed to join geofence',
        details: insertError
      };
    }

    revalidatePath('/dashboard');

    return { 
      success: true, 
      data: { 
        geofence: {
          id_geofence: geofence.id_geofence,
          name: geofence.name
        }
      } 
    };

  } catch (error) {
    console.error('Geofence join error:', error);
    return {
      success: false,
      error: 'Internal server error',
      details: error
    };
  }
} 