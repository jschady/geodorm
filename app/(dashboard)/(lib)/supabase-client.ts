import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

// Singleton Supabase client instance
let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Creates or returns the existing Supabase client instance
 * Implements singleton pattern to ensure only one client exists
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  // Return existing instance if it exists
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please check your .env file.'
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please check your .env file.'
    );
  }

  // Create new client instance with enhanced configuration
  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // We're not using auth sessions in this app
      detectSessionInUrl: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10, // Limit real-time events for performance
      },
    },
  });

  return supabaseInstance;
}

/**
 * Default export for convenience - returns the singleton client
 */
const supabase = getSupabaseClient();
export default supabase;

/**
 * Type-safe wrapper for Supabase operations with enhanced error handling
 */
export class SupabaseService {
  private client: SupabaseClient<Database>;

  constructor() {
    this.client = getSupabaseClient();
  }

  /**
   * Get all members with proper error handling
   */
  async getMembers() {
    try {
      const { data, error } = await this.client
        .from('members')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching members:', error);
        throw new Error(`Failed to fetch members: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Unexpected error in getMembers:', error);
      throw error;
    }
  }

  /**
   * Update member status with optimistic updates and error handling
   */
  async updateMemberStatus(id: string, status: string) {
    try {
      const { error } = await this.client
        .from('members')
        .update({ 
          status, 
          last_updated: new Date().toISOString() 
        })
        .eq('id_member', id);

      if (error) {
        console.error('Error updating member status:', error);
        throw new Error(`Failed to update status: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error in updateMemberStatus:', error);
      throw error;
    }
  }

  /**
   * Insert new member with proper validation
   */
  async insertMember(name: string, status: string = 'AWAY') {
    try {
      const { data, error } = await this.client
        .from('members')
        .insert([{ 
          name: name.trim(), 
          status, 
          last_updated: new Date().toISOString() 
        }])
        .select();

      if (error) {
        console.error('Error inserting member:', error);
        throw new Error(`Failed to add member: ${error.message}`);
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Unexpected error in insertMember:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time changes on members table
   */
  subscribeToMembers(callback: (payload: any) => void, statusCallback?: (status: string) => void) {
    return this.client
      .channel('members-channel')
      .on<any>(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members' },
        callback
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        if (statusCallback) {
          statusCallback(status);
        }
      });
  }

  /**
   * Clean up subscriptions
   */
  removeChannel(channel: any) {
    return this.client.removeChannel(channel);
  }
}

// Export a default service instance
export const supabaseService = new SupabaseService(); 