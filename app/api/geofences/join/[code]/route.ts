/**
 * GET /api/geofences/join/[code] - Validate invite code and return geofence preview
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { InviteValidationResponse } from '../../../../(dashboard)/(lib)/types';

// Supabase configuration  
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Service role client for privileged operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export async function GET(
  request: NextRequest,
  { params }: any
) {
  try {
    const inviteCode = params.invite;

    if (!inviteCode) {
      return NextResponse.json({
        valid: false,
        error: 'Invite code is required'
      } as InviteValidationResponse, { status: 400 });
    }

    // Query geofence by invite code with owner information
    const { data: geofence, error: geofenceError } = await supabase
      .from('geofences')
      .select(`
        id_geofence,
        name,
        created_at,
        id_user,
        users!inner(
          full_name
        )
      `)
      .eq('invite_code', inviteCode)
      .single();

    if (geofenceError || !geofence) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid or expired invitation code'
      } as InviteValidationResponse, { status: 404 });
    }

    // Get member count
    const { data: members, error: membersError } = await supabase
      .from('geofence_members')
      .select('id_user')
      .eq('id_geofence', geofence.id_geofence);

    if (membersError) {
      console.error('Failed to get member count:', membersError);
      return NextResponse.json({
        valid: false,
        error: 'Failed to load geofence details'
      } as InviteValidationResponse, { status: 500 });
    }

    // Return validation response
    const response: InviteValidationResponse = {
      valid: true,
      geofence: {
        id_geofence: geofence.id_geofence,
        name: geofence.name,
        owner_name: (geofence as any).users?.full_name || 'Unknown',
        member_count: members?.length || 0,
        created_at: geofence.created_at
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Invite validation error:', error);
    return NextResponse.json({
      valid: false,
      error: 'Internal server error'
    } as InviteValidationResponse, { status: 500 });
  }
} 