/**
 * Presence Channel Manager
 *
 * Singleton manager for Supabase Realtime Presence tracking.
 * Handles connection lifecycle, reconnection, and state management.
 */

import { getSupabaseBrowser } from '@/lib/supabase/browser';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Types
export interface PresencePayload {
  user_id: string;
  online_at: string;
}

export interface PresenceState {
  [userId: string]: PresencePayload[];
}

type PresenceCallback = (state: PresenceState) => void;
type JoinCallback = (userId: string, payload: PresencePayload) => void;
type LeaveCallback = (userId: string, payload: PresencePayload) => void;

// Singleton state
let channel: RealtimeChannel | null = null;
let currentUserId: string | null = null;
let isSubscribed = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 2000;

// Callback registries
const syncCallbacks = new Set<PresenceCallback>();
const joinCallbacks = new Set<JoinCallback>();
const leaveCallbacks = new Set<LeaveCallback>();

// Heartbeat interval for updating last_seen_at
let heartbeatInterval: NodeJS.Timeout | null = null;
const HEARTBEAT_INTERVAL_MS = 60000; // 1 minute

/**
 * Update last_seen_at in the database
 */
async function updateLastSeen() {
  try {
    const supabase = getSupabaseBrowser();
    await supabase.rpc('update_last_seen');
  } catch (error) {
    console.error('[Presence] Failed to update last_seen:', error);
  }
}

/**
 * Start heartbeat to periodically update last_seen_at
 */
function startHeartbeat() {
  if (heartbeatInterval) return;

  // Update immediately
  updateLastSeen();

  // Then update periodically
  heartbeatInterval = setInterval(updateLastSeen, HEARTBEAT_INTERVAL_MS);
}

/**
 * Stop heartbeat
 */
function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

/**
 * Get current presence state
 */
export function getPresenceState(): PresenceState {
  if (!channel) return {};
  return channel.presenceState<PresencePayload>();
}

/**
 * Check if a specific user is online
 */
export function isUserOnline(userId: string): boolean {
  const state = getPresenceState();
  return userId in state;
}

/**
 * Get all online user IDs
 */
export function getOnlineUserIds(): string[] {
  return Object.keys(getPresenceState());
}

/**
 * Register callback for presence sync events
 */
export function onPresenceSync(callback: PresenceCallback): () => void {
  syncCallbacks.add(callback);
  return () => syncCallbacks.delete(callback);
}

/**
 * Register callback for user join events
 */
export function onUserJoin(callback: JoinCallback): () => void {
  joinCallbacks.add(callback);
  return () => joinCallbacks.delete(callback);
}

/**
 * Register callback for user leave events
 */
export function onUserLeave(callback: LeaveCallback): () => void {
  leaveCallbacks.add(callback);
  return () => leaveCallbacks.delete(callback);
}

/**
 * Initialize and subscribe to presence channel
 */
export async function initializePresence(userId: string): Promise<boolean> {
  // Already initialized for this user
  if (currentUserId === userId && isSubscribed && channel) {
    return true;
  }

  // Cleanup existing connection if different user
  if (currentUserId && currentUserId !== userId) {
    await cleanupPresence();
  }

  currentUserId = userId;
  const supabase = getSupabaseBrowser();

  try {
    // Create channel with presence configuration
    channel = supabase.channel('family-presence', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    // Handle sync events (initial state and updates)
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel!.presenceState<PresencePayload>();
      syncCallbacks.forEach(cb => {
        try {
          cb(state);
        } catch (e) {
          console.error('[Presence] Sync callback error:', e);
        }
      });
    });

    // Handle join events
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      if (newPresences && newPresences.length > 0) {
        const payload = newPresences[0] as unknown as PresencePayload;
        joinCallbacks.forEach(cb => {
          try {
            cb(key, payload);
          } catch (e) {
            console.error('[Presence] Join callback error:', e);
          }
        });
      }
    });

    // Handle leave events
    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      if (leftPresences && leftPresences.length > 0) {
        const payload = leftPresences[0] as unknown as PresencePayload;
        leaveCallbacks.forEach(cb => {
          try {
            cb(key, payload);
          } catch (e) {
            console.error('[Presence] Leave callback error:', e);
          }
        });
      }
    });

    // Subscribe to channel
    return new Promise((resolve) => {
      channel!.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          isSubscribed = true;
          reconnectAttempts = 0;

          // Track our presence
          const trackStatus = await channel!.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });

          if (trackStatus === 'ok') {
            startHeartbeat();
            resolve(true);
          } else {
            console.error('[Presence] Failed to track presence:', trackStatus);
            resolve(false);
          }
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          isSubscribed = false;
          stopHeartbeat();

          // Attempt reconnection
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`[Presence] Connection lost. Reconnecting (attempt ${reconnectAttempts})...`);
            setTimeout(() => {
              if (currentUserId) {
                initializePresence(currentUserId);
              }
            }, RECONNECT_DELAY_MS * reconnectAttempts);
          } else {
            console.error('[Presence] Max reconnection attempts reached');
          }
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error('[Presence] Initialization error:', error);
    return false;
  }
}

/**
 * Cleanup presence subscription
 */
export async function cleanupPresence(): Promise<void> {
  stopHeartbeat();

  if (channel) {
    const supabase = getSupabaseBrowser();

    // Untrack our presence
    try {
      await channel.untrack();
    } catch (e) {
      console.error('[Presence] Untrack error:', e);
    }

    // Remove channel
    await supabase.removeChannel(channel);
    channel = null;
  }

  isSubscribed = false;
  currentUserId = null;
  reconnectAttempts = 0;

  // Clear all callbacks
  syncCallbacks.clear();
  joinCallbacks.clear();
  leaveCallbacks.clear();
}

/**
 * Check if presence is currently active
 */
export function isPresenceActive(): boolean {
  return isSubscribed && channel !== null;
}

/**
 * Get the current user ID being tracked
 */
export function getCurrentTrackedUserId(): string | null {
  return currentUserId;
}
