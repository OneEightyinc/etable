import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { storeScopedPath } from '../lib/storePaths';
import { useStoreAdminPublicToken } from '../lib/StoreAdminPublicTokenContext';

interface TableEntry {
  id: string;
  label: string;
}

function getCustomerPortalUrl(): string {
  return process.env.NEXT_PUBLIC_CUSTOMER_PORTAL_URL || 'http://localhost:3021';
}

function buildOrderUrl(storeId: string, label: string): string {
  return `${getCustomerPortalUrl()}/order/${encodeURIComponent(storeId)}?table=${encodeURIComponent(label)}`;
}

function QrPlaceholder({ url }: { url: string }) {
  // Render a QR-like visual placeholder since we cannot import a QR library
  const cells = Array.from({ length: 7 }, (_, r) =>
    Array.from({ length: 7 }, (_, c) => {
      // Fixed pattern corners (finder patterns) + pseudo-random fill
      const isFinderCorner =
        (r < 3 && c < 3) || (r < 3 && c > 3) || (r > 3 && c < 3);
      const hash = ((r * 7 + c) * 31 + url.length) % 5;
      return isFinderCorner || hash < 2;
    })
  );

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div
        style={{
          border: '2px solid #082752',
          borderRadius: 8,
          padding: 6,
          background: '#fff',
          display: 'inline-block',
        }}
      >
        <svg width={84} height={84} viewBox="0 0 84 84" xmlns="http://www.w3.org/2000/svg">
          {cells.map((row, r) =>
            row.map((filled, c) =>
              filled ? (
                <rect
                  key={`${r}-${c}`}
                  x={c * 12}
                  y={r * 12}
                  width={12}
                  height={12}
                  fill="#082752"
                />
              ) : null
            )
          )}
        </svg>
      </div>
    </div>
  );
}

export default function TablesPage() {
  const router = useRouter();
  const publicToken = useStoreAdminPublicToken();
  const storeId = (router.query.storeId as string) || 'shibuya-001';
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  const storageKey = `etable_tables_${storeId}`;

  const [tables, setTables] = useState<TableEntry[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TableEntry | null>(null);
  const [printAll, setPrintAll] = useState(false);

  // Load tables from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setTables(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  // Persist tables to localStorage
  function persist(next: TableEntry[]) {
    setTables(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function handleAdd() {
    const label = newLabel.trim();
    if (!label) return;
    if (tables.some((t) => t.label === label)) {
      alert('同じラベルのテーブルが既に存在します');
      return;
    }
    const entry: TableEntry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, label };
    persist([...tables, entry]);
    setNewLabel('');
  }

  function handleDelete(entry: TableEntry) {
    persist(tables.filter((t) => t.id !== entry.id));
    setDeleteTarget(null);
  }

  async function handleCopy(entry: TableEntry) {
    const url = buildOrderUrl(storeId, entry.label);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  function handlePrintSingle(entry: TableEntry) {
    const url = buildOrderUrl(storeId, entry.label);
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>テーブル ${entry.label}</title>
      <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .label { font-size: 48px; font-weight: bold; margin-bottom: 24px; color: #082752; }
        .url { font-size: 14px; color: #666; word-break: break-all; max-width: 400px; text-align: center; margin-top: 16px; }
        .box { border: 3px solid #082752; border-radius: 12px; padding: 16px; }
      </style></head><body>
      <div class="label">テーブル: ${entry.label}</div>
      <div class="box"><p style="text-align:center;font-weight:bold;color:#082752;">QRコード</p><p style="font-size:12px;max-width:280px;word-break:break-all;">${url}</p></div>
      <div class="url">${url}</div>
      <script>window.onload=function(){window.print();}<\/script>
      </body></html>
    `);
    w.document.close();
  }

  // Print-all view
  if (printAll) {
    return (
      <div style={{ fontFamily: 'sans-serif', padding: 24 }}>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .print-card { page-break-inside: avoid; break-inside: avoid; }
          }
        `}</style>
        <div className="no-print" style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
          <button
            onClick={() => setPrintAll(false)}
            style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
          >
            ← 戻る
          </button>
          <button
            onClick={() => window.print()}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#FD780F', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
          >
            印刷する
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
          {tables.map((entry) => {
            const url = buildOrderUrl(storeId, entry.label);
            return (
              <div
                key={entry.id}
                className="print-card"
                style={{
                  border: '2px solid #082752',
                  borderRadius: 16,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 'bold', color: '#082752' }}>
                  {entry.label}
                </div>
                <QrPlaceholder url={url} />
                <div style={{ fontSize: 10, color: '#666', wordBreak: 'break-all', textAlign: 'center', maxWidth: 220 }}>
                  {url}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div className="max-w-md mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <Link href={storeScopedPath(publicToken, '/', storeId)}>
            <span
              className="flex items-center justify-center rounded-full bg-white shadow"
              style={{ width: 36, height: 36, cursor: 'pointer' }}
            >
              ←
            </span>
          </Link>
          <h1 className="text-lg font-bold" style={{ color: '#082752' }}>
            テーブル・QR管理
          </h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pb-8">
        {/* Add table section */}
        <div
          className="rounded-[32px] bg-white shadow p-5 mb-5"
          style={{ border: '1px solid #eee' }}
        >
          <p className="text-sm font-semibold mb-3" style={{ color: '#082752' }}>
            テーブルを追加
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="例: A1, B2, カウンター1"
              className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none"
              style={{ borderColor: '#ddd' }}
            />
            <button
              onClick={handleAdd}
              className="rounded-xl px-4 py-2 text-sm font-bold text-white"
              style={{ background: '#FD780F', whiteSpace: 'nowrap' }}
            >
              追加
            </button>
          </div>
        </div>

        {/* Bulk print button */}
        {tables.length > 0 && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setPrintAll(true)}
              className="rounded-xl px-4 py-2 text-sm font-bold text-white"
              style={{ background: '#082752' }}
            >
              全テーブル一括印刷
            </button>
          </div>
        )}

        {/* Table list */}
        {tables.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            テーブルがまだ登録されていません
          </div>
        ) : (
          <div className="grid gap-4">
            {tables.map((entry) => {
              const url = buildOrderUrl(storeId, entry.label);
              return (
                <div
                  key={entry.id}
                  className="rounded-[32px] bg-white shadow p-5"
                  style={{ border: '1px solid #eee' }}
                >
                  {/* Label */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold" style={{ color: '#082752' }}>
                      {entry.label}
                    </span>
                    <button
                      onClick={() => setDeleteTarget(entry)}
                      className="text-xs text-red-400 hover:text-red-600"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      削除
                    </button>
                  </div>

                  {/* QR placeholder */}
                  <div className="flex justify-center mb-3">
                    <QrPlaceholder url={url} />
                  </div>

                  {/* URL */}
                  <div
                    className="text-xs mb-3 p-2 rounded-lg bg-gray-50 break-all"
                    style={{ color: '#666' }}
                  >
                    {url}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(entry)}
                      className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold"
                      style={{
                        background: copiedId === entry.id ? '#d4edda' : '#f0f0f0',
                        color: copiedId === entry.id ? '#155724' : '#082752',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {copiedId === entry.id ? 'コピーしました!' : 'URLをコピー'}
                    </button>
                    <button
                      onClick={() => handlePrintSingle(entry)}
                      className="flex-1 rounded-xl px-3 py-2 text-sm font-semibold"
                      style={{
                        background: '#FD780F',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      印刷
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="rounded-[24px] bg-white shadow-lg p-6"
            style={{ maxWidth: 320, width: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold mb-2" style={{ color: '#082752' }}>
              テーブルを削除しますか？
            </p>
            <p className="text-sm text-gray-500 mb-4">
              「{deleteTarget.label}」を削除します。この操作は取り消せません。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl px-3 py-2 text-sm"
                style={{ background: '#f0f0f0', border: 'none', cursor: 'pointer' }}
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                className="flex-1 rounded-xl px-3 py-2 text-sm font-bold text-white"
                style={{ background: '#e74c3c', border: 'none', cursor: 'pointer' }}
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
