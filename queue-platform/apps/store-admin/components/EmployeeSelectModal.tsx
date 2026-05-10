import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  listEmployeesApi,
  type EmployeeData,
} from "@queue-platform/api";
import { storeScopedPath } from "../lib/storePaths";
import { useStoreAdminPublicToken } from "../lib/StoreAdminPublicTokenContext";
import { useEmployee, type Actor } from "../lib/EmployeeContext";

interface Props {
  storeId: string;
  onSelected?: () => void;
  /** 切替モード: キャンセル可、外側クリックで閉じる */
  switchMode?: boolean;
  onClose?: () => void;
}

export default function EmployeeSelectModal({ storeId, onSelected, switchMode, onClose }: Props) {
  const { setActor } = useEmployee();
  const publicToken = useStoreAdminPublicToken();
  const [employees, setEmployees] = useState<EmployeeData[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    setError("");
    setEmployees(null);
    listEmployeesApi(storeId)
      .then((list) => {
        if (cancelled) return;
        setEmployees(list);
      })
      .catch((e: any) => {
        if (cancelled) return;
        setError(e?.message ?? "担当者の取得に失敗しました");
        setEmployees([]);
      });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  const choose = (emp: EmployeeData) => {
    const actor: Actor = { employeeId: emp.id, employeeName: emp.name };
    setActor(actor);
    onSelected?.();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#082752]">担当者を選択</h2>
          {switchMode && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-gray-400"
              aria-label="閉じる"
            >
              閉じる
            </button>
          )}
        </div>
        <p className="mb-4 text-xs text-gray-500">
          操作ログに記録されます。後から「担当者切替」で変更できます。
        </p>

        {employees === null && (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#FD780F] border-t-transparent" />
          </div>
        )}

        {employees && employees.length > 0 && (
          <div className="mb-2 max-h-72 space-y-2 overflow-y-auto">
            {employees.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => choose(e)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-[#082752] transition-colors hover:bg-[#FFF7ED] hover:border-[#FD780F]"
              >
                {e.name}
              </button>
            ))}
          </div>
        )}

        {employees && employees.length === 0 && (
          <div className="rounded-xl bg-gray-50 p-4 text-center text-xs text-gray-500">
            <p className="mb-3">担当者が登録されていません。</p>
            <Link
              href={storeScopedPath(publicToken, "/settings", storeId)}
              className="inline-block rounded-full bg-[#082752] px-4 py-2 text-xs font-bold text-white"
            >
              詳細設定で登録
            </Link>
          </div>
        )}

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
