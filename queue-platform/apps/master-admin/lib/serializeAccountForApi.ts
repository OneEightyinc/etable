import type { AccountData } from "@queue-platform/api";
import type { Account } from "@queue-platform/api/src/server";

export function serializeAccountForMasterAdminApi(a: Account): AccountData {
  const t = a.publicUrlTokens;
  return {
    id: a.id,
    name: a.name,
    email: a.email,
    storeName: a.storeName,
    status: a.status,
    createdAt: a.createdAt,
    publicUrlTokens: t
      ? {
          storeAdmin: t.storeAdmin,
          kiosk: t.kiosk,
          portal: t.portal,
          survey: t.survey,
        }
      : undefined,
  };
}
