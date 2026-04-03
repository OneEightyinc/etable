/**
 * Server-only entry point for @queue-platform/api
 * Contains modules that use Node.js APIs (fs, crypto, etc.)
 * Only import this in API routes (pages/api/), NEVER in components or pages.
 */

// Database layer
export {
  hashPassword,
  findAdminByEmail,
  findAccountByEmail,
  getAllAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getQueueByStore,
  getNextTicketNumber,
  addToQueue,
  updateQueueStatus,
  removeFromQueue,
  getQueueEntryById,
  getQueuePosition,
  getQueueStats,
  getQueueHistory,
  restoreQueueEntry,
  getStoreSettings,
  updateStoreSettings,
  getStorePortalProfile,
  getCustomerProfileById,
  createCustomerProfile,
  updateCustomerProfile,
  deleteCustomerProfile,
} from './db';

export type {
  AdminUser,
  Account,
  QueueEntry,
  StoreSettings,
  StorePortalProfile,
  CustomerProfileRecord,
} from './db';

// Auth middleware
export {
  getSessionFromRequest,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
} from './auth';

export type { Session } from './auth';

export {
  getCustomerIdFromRequest,
  setCustomerCookie,
  clearCustomerCookie,
} from './customerAuth';

// SSE event bus
export {
  addClient,
  removeClient,
  broadcastToStore,
  broadcastAll,
} from './sse';
