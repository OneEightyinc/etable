/**
 * Server-only entry point for @queue-platform/api
 * Contains modules that use Node.js APIs (fs, crypto, etc.)
 * Only import this in API routes (pages/api/), NEVER in components or pages.
 */

// Database layer
export {
  hashPassword,
  isRemoteDbEnabled,
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
  listActiveStoreProfiles,
  getCustomerProfileById,
  createCustomerProfile,
  updateCustomerProfile,
  deleteCustomerProfile,
  getMenuCategories,
  upsertMenuCategory,
  deleteMenuCategory,
  getMenuItems,
  upsertMenuItem,
  deleteMenuItem,
  createOrder,
  addItemsToOrder,
  updateOrderStatus,
  getOrdersByStore,
  getOrderById,
  addWaitingSurvey,
  getWaitingSurveys,
  addPostVisitReview,
  getPostVisitReviews,
  addSurveyResponse,
  getSurveyResponses,
  isStoreIdRecognized,
  resolvePublicUrlToken,
  addPoints,
  getPointHistory,
  findCustomerByReferralCode,
  calculateTier,
  POINT_RULES,
  TIER_BENEFITS,
} from './db';

export type {
  AdminUser,
  Account,
  PublicUrlTokenKind,
  PublicUrlTokens,
  QueueEntry,
  StoreSettings,
  StorePortalProfile,
  CustomerProfileRecord,
  SurveyResponse,
  MenuCategory,
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  WaitingSurveyRecord,
  PostVisitReviewRecord,
  MemberTier,
  PointAction,
  PointHistoryRecord,
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
