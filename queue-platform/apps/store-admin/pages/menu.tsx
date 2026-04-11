import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { storeScopedPath } from '../lib/storePaths';
import { useStoreAdminPublicToken } from '../lib/StoreAdminPublicTokenContext';

interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  description?: string;
  soldOut: boolean;
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function MenuPage() {
  const router = useRouter();
  const publicToken = useStoreAdminPublicToken();
  const storeId = (router.query.storeId as string) || 'shibuya-001';

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Category inline add/edit
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // Item modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'item'; id: string; name: string } | null>(null);

  const fetchMenu = async () => {
    try {
      const res = await fetch(
        `${BASE}/api/menu?storeId=${encodeURIComponent(storeId)}`,
        { credentials: 'include' }
      );
      const data = await res.json();
      setCategories(data.categories || []);
      setItems(data.items || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  /* ── Category CRUD ── */

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    setIsSaving(true);
    try {
      await fetch(`${BASE}/api/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'category', storeId, name }),
      });
      setNewCategoryName('');
      setShowCategoryInput(false);
      await fetchMenu();
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    const name = editingCategoryName.trim();
    if (!name) return;
    setIsSaving(true);
    try {
      await fetch(`${BASE}/api/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'category', storeId, id, name }),
      });
      setEditingCategoryId(null);
      setEditingCategoryName('');
      await fetchMenu();
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await fetch(`${BASE}/api/menu`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'category', id, storeId }),
      });
      setDeleteTarget(null);
      await fetchMenu();
    } catch {
      // ignore
    }
  };

  /* ── Item CRUD ── */

  const openAddItem = () => {
    setEditingItem(null);
    setItemName('');
    setItemPrice('');
    setItemCategoryId(categories[0]?.id || '');
    setItemDescription('');
    setShowItemModal(true);
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(String(item.price));
    setItemCategoryId(item.categoryId);
    setItemDescription(item.description || '');
    setShowItemModal(true);
  };

  const handleSaveItem = async () => {
    const name = itemName.trim();
    const price = parseInt(itemPrice, 10);
    if (!name || isNaN(price)) return;
    setIsSaving(true);
    try {
      await fetch(`${BASE}/api/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'item',
          storeId,
          ...(editingItem ? { id: editingItem.id } : {}),
          name,
          price,
          categoryId: itemCategoryId,
          description: itemDescription.trim() || undefined,
        }),
      });
      setShowItemModal(false);
      await fetchMenu();
    } catch {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await fetch(`${BASE}/api/menu`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'item', id, storeId }),
      });
      setDeleteTarget(null);
      await fetchMenu();
    } catch {
      // ignore
    }
  };

  const handleToggleSoldOut = async (item: MenuItem) => {
    const updatedSoldOut = !item.soldOut;
    // Optimistic update
    setItems(prev => prev.map(i => (i.id === item.id ? { ...i, soldOut: updatedSoldOut } : i)));
    try {
      await fetch(`${BASE}/api/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'item',
          storeId,
          id: item.id,
          soldOut: updatedSoldOut,
        }),
      });
    } catch {
      // Revert on failure
      setItems(prev => prev.map(i => (i.id === item.id ? { ...i, soldOut: !updatedSoldOut } : i)));
    }
  };

  /* ── Helpers ── */

  const categoryName = (catId: string) => categories.find(c => c.id === catId)?.name || '未分類';

  const groupedItems = categories.map(cat => ({
    category: cat,
    items: items.filter(i => i.categoryId === cat.id),
  }));

  const uncategorizedItems = items.filter(i => !categories.some(c => c.id === i.categoryId));

  /* ── Render ── */

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#082752] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between z-10">
        <Link
          href={storeScopedPath(publicToken, "/", storeId)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-base font-bold text-[#082752]">メニュー管理</h1>
        <div className="w-8" />
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 pb-32 space-y-6 max-w-md mx-auto">

        {/* ── カテゴリ管理 ── */}
        <div>
          <h2 className="text-sm font-bold text-[#082752]">カテゴリ</h2>
          <div className="space-y-3 mt-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white rounded-[32px] p-5 border border-gray-100 flex items-center justify-between">
                {editingCategoryId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingCategoryName}
                      onChange={e => setEditingCategoryName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleUpdateCategory(cat.id); }}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#082752] focus:outline-none focus:ring-2 focus:ring-[#FD780F]/40"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateCategory(cat.id)}
                      disabled={isSaving}
                      className="text-xs font-bold text-white bg-[#FD780F] rounded-xl px-3 py-2 hover:bg-[#e46a0a] transition"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => { setEditingCategoryId(null); setEditingCategoryName(''); }}
                      className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-base font-semibold text-[#082752]">{cat.name}</p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); }}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label={`${cat.name}を編集`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#082752" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ type: 'category', id: cat.id, name: cat.name })}
                        className="p-2 rounded-full hover:bg-red-50 transition-colors"
                        aria-label={`${cat.name}を削除`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Inline category add */}
            {showCategoryInput ? (
              <div className="bg-white rounded-[32px] p-5 border border-gray-100 flex items-center gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddCategory(); }}
                  placeholder="カテゴリ名"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#082752] focus:outline-none focus:ring-2 focus:ring-[#FD780F]/40"
                  autoFocus
                />
                <button
                  onClick={handleAddCategory}
                  disabled={isSaving}
                  className="text-xs font-bold text-white bg-[#FD780F] rounded-xl px-3 py-2 hover:bg-[#e46a0a] transition"
                >
                  追加
                </button>
                <button
                  onClick={() => { setShowCategoryInput(false); setNewCategoryName(''); }}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCategoryInput(true)}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-[32px] text-sm font-bold text-gray-400 hover:border-[#FD780F] hover:text-[#FD780F] transition-colors"
              >
                + カテゴリ追加
              </button>
            )}
          </div>
        </div>

        {/* ── メニュー一覧（カテゴリ別） ── */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#082752]">メニュー</h2>
            <button
              onClick={openAddItem}
              className="text-xs font-bold text-white bg-[#FD780F] rounded-xl px-4 py-2 hover:bg-[#e46a0a] transition shadow-sm shadow-[#FD780F]/20"
            >
              + メニュー追加
            </button>
          </div>

          <div className="space-y-6 mt-4">
            {groupedItems.map(({ category, items: catItems }) => (
              <div key={category.id}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{category.name}</p>
                {catItems.length === 0 ? (
                  <p className="text-xs text-gray-300 pl-1">メニューがありません</p>
                ) : (
                  <div className="space-y-3">
                    {catItems.map(item => (
                      <div
                        key={item.id}
                        className={`bg-white rounded-[32px] p-5 border border-gray-100 transition ${item.soldOut ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold text-[#082752] truncate">{item.name}</p>
                            <p className="text-sm text-gray-400 mt-0.5">¥{item.price.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            {/* Sold out toggle */}
                            <button
                              onClick={() => handleToggleSoldOut(item)}
                              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                                item.soldOut ? 'bg-red-400' : 'bg-green-400'
                              }`}
                              aria-label={item.soldOut ? '売切解除' : '売切にする'}
                            >
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                                  item.soldOut ? 'translate-x-1' : 'translate-x-6'
                                }`}
                              />
                            </button>
                            <span className="text-[10px] font-bold text-gray-400 w-8">
                              {item.soldOut ? '売切' : '販売中'}
                            </span>
                            {/* Edit */}
                            <button
                              onClick={() => openEditItem(item)}
                              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                              aria-label={`${item.name}を編集`}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#082752" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => setDeleteTarget({ type: 'item', id: item.id, name: item.name })}
                              className="p-2 rounded-full hover:bg-red-50 transition-colors"
                              aria-label={`${item.name}を削除`}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Uncategorized items */}
            {uncategorizedItems.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">未分類</p>
                <div className="space-y-3">
                  {uncategorizedItems.map(item => (
                    <div
                      key={item.id}
                      className={`bg-white rounded-[32px] p-5 border border-gray-100 transition ${item.soldOut ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-[#082752] truncate">{item.name}</p>
                          <p className="text-sm text-gray-400 mt-0.5">¥{item.price.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <button
                            onClick={() => handleToggleSoldOut(item)}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                              item.soldOut ? 'bg-red-400' : 'bg-green-400'
                            }`}
                            aria-label={item.soldOut ? '売切解除' : '売切にする'}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                                item.soldOut ? 'translate-x-1' : 'translate-x-6'
                              }`}
                            />
                          </button>
                          <span className="text-[10px] font-bold text-gray-400 w-8">
                            {item.soldOut ? '売切' : '販売中'}
                          </span>
                          <button
                            onClick={() => openEditItem(item)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label={`${item.name}を編集`}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#082752" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'item', id: item.id, name: item.name })}
                            className="p-2 rounded-full hover:bg-red-50 transition-colors"
                            aria-label={`${item.name}を削除`}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {items.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-gray-300">メニューが登録されていません</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add / Edit Item Modal ── */}
      {showItemModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={() => setShowItemModal(false)} />
          <div className="glass w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden">
            <div className="p-8">
              <h3 className="text-xl font-bold text-[#082752] mb-6">
                {editingItem ? 'メニュー編集' : 'メニュー追加'}
              </h3>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">メニュー名</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={e => setItemName(e.target.value)}
                    placeholder="例: マルゲリータ"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#082752] focus:outline-none focus:ring-2 focus:ring-[#FD780F]/40"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">価格（円）</label>
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={e => setItemPrice(e.target.value)}
                    placeholder="例: 1200"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#082752] focus:outline-none focus:ring-2 focus:ring-[#FD780F]/40"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">カテゴリ</label>
                  <select
                    value={itemCategoryId}
                    onChange={e => setItemCategoryId(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#082752] bg-white focus:outline-none focus:ring-2 focus:ring-[#FD780F]/40"
                  >
                    <option value="">選択してください</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">説明（任意）</label>
                  <textarea
                    value={itemDescription}
                    onChange={e => setItemDescription(e.target.value)}
                    placeholder="メニューの説明"
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#082752] resize-none focus:outline-none focus:ring-2 focus:ring-[#FD780F]/40"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-3 mt-8">
                <button
                  onClick={handleSaveItem}
                  disabled={isSaving || !itemName.trim() || !itemPrice}
                  className="w-full py-4 rounded-2xl font-bold text-white bg-[#FD780F] hover:bg-[#e46a0a] shadow-lg shadow-[#FD780F]/20 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={() => setShowItemModal(false)}
                  className="w-full py-4 rounded-2xl font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-md" onClick={() => setDeleteTarget(null)} />
          <div className="glass w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden">
            <div className="p-10 text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-red-100 text-red-500">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">削除確認</h3>
              <p className="text-gray-500 font-medium mb-10 leading-relaxed">
                「{deleteTarget.name}」を削除しますか？<br />
                {deleteTarget.type === 'category' && 'カテゴリ内のメニューは未分類になります。'}
              </p>
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() =>
                    deleteTarget.type === 'category'
                      ? handleDeleteCategory(deleteTarget.id)
                      : handleDeleteItem(deleteTarget.id)
                  }
                  className="w-full py-4 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition active:scale-95"
                >
                  削除する
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="w-full py-4 rounded-2xl font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 transition"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
