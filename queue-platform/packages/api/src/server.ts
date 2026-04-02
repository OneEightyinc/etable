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
  createSession,
  findSession,
  deleteSession,
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
} from './db';

export type {
  AdminUser,
  Account,
  QueueEntry,
  Session,
  StoreSettings,
} from './db';

// Auth middleware
export {
  getSessionFromRequest,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
} from './auth';

// SSE event bus
export {
  addClient,
  removeClient,
  broadcastToStore,
  broadcastAll,
} from './sse';
