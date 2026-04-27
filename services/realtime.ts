
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

type EventCallback = (payload: any) => void;

class RealtimeService {
  private channel: RealtimeChannel;
  private listeners: Map<string, Set<EventCallback>>;

  constructor() {
    this.listeners = new Map();
    
    // Subscribe to database changes
    this.channel = supabase.channel('public:db_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          this.handleDatabaseChange(payload);
        }
      )
      .subscribe();
  }

  private handleDatabaseChange(payload: any) {
    const { table, eventType, new: newRecord, old: oldRecord } = payload;
    
    // Map database events to frontend event types
    // This allows existing frontend code to work with minimal changes
    
    if (table === 'jobs') {
      if (eventType === 'INSERT') this.emitLocal('JOB_CREATED', newRecord);
      if (eventType === 'UPDATE') this.emitLocal('JOB_UPDATED', newRecord);
      if (eventType === 'DELETE') this.emitLocal('JOB_DELETED', oldRecord.id);
    }
    
    if (table === 'announcements') {
      if (eventType === 'INSERT') this.emitLocal('ANNOUNCEMENT_CREATED', newRecord);
      if (eventType === 'UPDATE') this.emitLocal('ANNOUNCEMENT_UPDATED', newRecord);
      if (eventType === 'DELETE') this.emitLocal('ANNOUNCEMENT_DELETED', oldRecord.id);
    }
    
    if (table === 'applications') {
      if (eventType === 'INSERT') this.emitLocal('APPLICATION_SUBMITTED', newRecord);
      // For updates, we might need to be more specific based on status changes
      if (eventType === 'UPDATE') this.emitLocal('APPLICATION_UPDATED', newRecord);
    }
    
    if (table === 'student_profiles') {
      if (eventType === 'UPDATE') this.emitLocal('PROFILE_UPDATED', { userId: newRecord.user_id, profile: newRecord });
    }
  }

  // Used for local event distribution within the app
  private emitLocal(type: string, data: any) {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.forEach(callback => callback(data));
    }
  }

  public subscribe(type: string, callback: EventCallback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
    return () => this.unsubscribe(type, callback);
  }

  public unsubscribe(type: string, callback: EventCallback) {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.delete(callback);
    }
  }

  // Kept for compatibility, but now mainly used for client-side optimistics or specific non-db events
  public emit(type: string, data: any) {
    this.emitLocal(type, data);
  }
}

export const realtime = new RealtimeService();
