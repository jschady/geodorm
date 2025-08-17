// TypeScript definitions for the Tiger Dorm Dashboard application

// Member interface representing a dorm roommate
export interface Member {
  id_member: string;
  name: string;
  status: StatusKey;
  last_updated: string;
}

// Available status options for roommates
export type StatusKey = 'IN_ROOM' | 'STUDYING' | 'AT_GYM' | 'SLEEPING' | 'AWAY';

// Status option configuration interface
export interface StatusOption {
  text: string;
  icon: React.ComponentType;
  color: string;
}

// Database schema types for Supabase
export interface Database {
  public: {
    Tables: {
      members: {
        Row: Member;
        Insert: Omit<Member, 'id_member'> & { id_member?: string };
        Update: Partial<Omit<Member, 'id_member'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Enhanced error handling types
export interface SupabaseError {
  message: string;
  details: string;
  hint?: string;
  code?: string;
}

export interface DatabaseResult<T> {
  data: T | null;
  error: SupabaseError | null;
}

// Connection status for real-time updates
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

// Supabase real-time payload types
export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
}

// Component prop interfaces
export interface StatusCardProps {
  member: Member;
}

export interface StatusUpdateModalProps {
  currentUser: Member;
  onClose: () => void;
  onStatusUpdate: (statusKey: StatusKey) => Promise<void>;
  isUpdating: boolean;
}

export interface UserSelectionModalProps {
  members: Member[];
  onSelectUser: (member: Member) => void;
  onClose: () => void;
  isSwitchingUser?: boolean;
}

export interface IOSInstallModalProps {
  onClose: () => void;
} 