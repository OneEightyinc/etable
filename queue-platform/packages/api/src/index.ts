/**
 * Main entry point for @queue-platform/api
 * Client-safe exports only (no Node.js modules like fs, crypto).
 * For server-only imports (db, auth, sse), use '@queue-platform/api/src/server'
 */

// Frontend API client
export {
  login,
  logout,
  getMe,
  getAccounts,
  createAccountApi,
  updateAccountApi,
  deleteAccountApi,
  getQueue,
  addToQueueApi,
  updateQueueStatusApi,
  deleteQueueEntryApi,
  getQueuePosition as getQueuePositionApi,
  getQueueStats as getQueueStatsApi,
  subscribeToQueue,
  getStoreSettingsApi,
  updateStoreSettingsApi,
  getQueueHistoryApi,
  restoreQueueEntryApi,
  getCustomerPointsApi,
  addPointsApi,
  redeemReferralApi,
  TIER_THRESHOLDS,
  TIER_BENEFITS,
} from './api-client';

export type {
  LoginResponse,
  AccountData,
  AccountPublicUrlTokens,
  QueueEntryData,
  StoreSettingsData,
  MemberTier,
  PointAction,
  PointHistoryEntry,
  CustomerPointsData,
} from './api-client';

export {
  waitingLineEntries,
  waitingIndexForEntry,
  waitingLineGroupCount,
  isInWaitingLineStatus,
} from './queue-waiting-line';
