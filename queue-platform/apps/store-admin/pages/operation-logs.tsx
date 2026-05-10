import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { listOperationLogsApi, type OperationLogData } from "@queue-platform/api";
import { storeScopedPath } from "../lib/storePaths";
import { useStoreAdminPublicToken } from "../lib/StoreAdminPublicTokenContext";

const ACTION_LABEL: Record<OperationLogData["action"], string> = {
  CALL: "呼び出し",
  RECALL: "再呼び出し",
  DONE: "案内完了",
  HOLD: "保留",
  BACK_TO_WAITING: "待機に戻す",
  CANCEL: "キャンセル",
  POSTPONE_USER: "後回し（顧客）",
  POSTPONE_STORE: "後回し（店舗）",
  EDIT: "人数・席種変更",
  EMPLOYEE_SELECT: "担当者選択",
};

const ACTION_COLOR: Record<OperationLogData["action"], string> = {
  CALL: "bg-[#FFF7ED] text-[#FD780F]",
  RECALL: "bg-[#FFF7ED] text-[#FD780F]",
  DONE: "bg-emerald-50 text-emerald-600",
  HOLD: "bg-amber-50 text-amber-600",
  BACK_TO_WAITING: "bg-sky-50 text-sky-600",
  CANCEL: "bg-red-50 text-red-500",
  POSTPONE_USER: "bg-purple-50 text-purple-600",
  POSTPONE_STORE: "bg-purple-50 text-purple-600",
  EDIT: "bg-gray-100 text-gray-600",
  EMPLOYEE_SELECT: "bg-gray-100 text-gray-600",
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  const hh = `${d.getHours()}`.padStart(2, "0");
  const mm = `${d.getMinutes()}`.padStart(2, "0");
  return `${m}/${day} ${hh}:${mm}`;
}

export default function OperationLogsPage() {
  const router = useRouter();
  const publicToken = useStoreAdminPublicToken();
  const storeId = (router.query.storeId as string) || "shibuya-001";

  const [logs, setLogs] = useState<OperationLogData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState<OperationLogData["action"] | "ALL">("ALL");
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>("ALL");

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    setIsLoading(true);
    setError("");
    listOperationLogsApi(storeId)
      .then((list) => {
        if (!cancelled) setLogs(list);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message ?? "操作ログの取得に失敗しました");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const employees = useMemo(() => {
    const seen = new Map<string, string>();
    for (const l of logs) {
      if (l.employeeId && l.employeeName && !seen.has(l.employeeId)) {
        seen.set(l.employeeId, l.employeeName);
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (filterAction !== "ALL" && l.action !== filterAction) return false;
      if (filterEmployeeId !== "ALL" && l.employeeId !== filterEmployeeId) return false;
      return true;
    });
  }, [logs, filterAction, filterEmployeeId]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      {/* Header */}
      <header className="bg-[#FD780F] text-white px-4 pt-4 pb-5 rounded-b-[28px]">
        <div className="flex items-center justify-between">
          <Link
            href={storeScopedPath(publicToken, "/", storeId)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <h1 className="text-base font-bold">担当者操作ログ</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 mt-4">
        {/* Filters */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value as OperationLogData["action"] | "ALL")}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs text-[#082752] outline-none"
          >
            <option value="ALL">すべての操作</option>
            {(Object.keys(ACTION_LABEL) as OperationLogData["action"][]).map((k) => (
              <option key={k} value={k}>
                {ACTION_LABEL[k]}
              </option>
            ))}
          </select>
          <select
            value={filterEmployeeId}
            onChange={(e) => setFilterEmployeeId(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs text-[#082752] outline-none"
          >
            <option value="ALL">すべての担当者</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-500">{error}</div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FD780F] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-xs text-gray-400">
            該当する操作ログはありません。
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((log) => (
              <div key={log.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ACTION_COLOR[log.action]}`}
                  >
                    {ACTION_LABEL[log.action]}
                  </span>
                  <span className="text-[11px] text-gray-400">{formatDateTime(log.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#082752]">
                    {log.employeeName ?? "未設定"}
                  </span>
                  {log.ticketNumber !== undefined && (
                    <span className="text-gray-500">No. {log.ticketNumber}</span>
                  )}
                </div>
                {log.details && (
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-50 px-3 py-2 text-[10px] text-gray-500">
                    {JSON.stringify(log.details, null, 0)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
