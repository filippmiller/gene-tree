/**
 * Presence Module
 *
 * Real-time online presence tracking for Gene-Tree family members.
 */

export {
  initializePresence,
  cleanupPresence,
  getPresenceState,
  isUserOnline,
  getOnlineUserIds,
  onPresenceSync,
  onUserJoin,
  onUserLeave,
  isPresenceActive,
  getCurrentTrackedUserId,
  type PresencePayload,
  type PresenceState,
} from './presence-channel';
