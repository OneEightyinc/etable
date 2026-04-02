
import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import GlassModal from './GlassModal';
import {
  getAccounts,
  createAccountApi,
  updateAccountApi,
  deleteAccountApi,
  type AccountData,
} from '@queue-platform/api';

interface AdminViewProps {
  onLogout: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ onLogout }) => {
  const [accounts, setAccounts] = useState<AccountData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountData | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AccountData | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    storeName: '',
    status: 'ACTIVE' as 'ACTIVE' | 'DISABLED',
  });

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await getAccounts();
      setAccounts(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleDelete = (account: AccountData) => {
    setDeleteTarget(account);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAccountApi(deleteTarget.id);
      setAccounts((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    } catch (err: any) {
      setError(err.message);
    }
    setDeleteTarget(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.email || !formData.storeName) return;

    setIsSaving(true);
    setError('');

    try {
      if (editingAccount) {
        const updated = await updateAccountApi(editingAccount.id, {
          name: formData.name,
          email: formData.email,
          ...(formData.password ? { password: formData.password } : {}),
          storeName: formData.storeName,
          status: formData.status,
        });
        setAccounts((prev) => prev.map((a) => (a.id === editingAccount.id ? updated : a)));
      } else {
        if (!formData.password) {
          setError('パスワードは必須です');
          setIsSaving(false);
          return;
        }
        const created = await createAccountApi({
          id: formData.id,
          name: formData.name || formData.storeName,
          email: formData.email,
          password: formData.password,
          storeName: formData.storeName,
          status: formData.status,
        });
        setAccounts((prev) => [...prev, created]);
      }

      setShowForm(false);
      setEditingAccount(null);
      setFormData({ id: '', name: '', email: '', password: '', storeName: '', status: 'ACTIVE' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (account: AccountData) => {
    setEditingAccount(account);
    setFormData({
      id: account.id,
      name: account.name,
      email: account.email,
      password: '',
      storeName: account.storeName,
      status: account.status,
    });
    setShowForm(true);
    setIsSidebarOpen(false);
  };

  const handleNew = () => {
    setEditingAccount(null);
    setFormData({ id: '', name: '', email: '', password: '', storeName: '', status: 'ACTIVE' });
    setShowForm(true);
    setIsSidebarOpen(false);
  };

  const SidebarContent = () => (
    <>
      <div className="flex flex-col mb-8">
        <div className="select-none">
          <Image src="/circlx_white.svg" alt="CIRCLX" width={150} height={50} />
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        <button
          onClick={() => { setShowForm(false); setIsSidebarOpen(false); }}
          className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl font-bold transition-all ${!showForm ? 'bg-white/10 shadow-inner' : 'hover:bg-white/5 opacity-60'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>
          <span className="whitespace-nowrap">アカウント一覧</span>
        </button>
      </nav>

      <div className="bg-white/5 rounded-3xl p-5 border border-white/5 mt-auto">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/10 flex-shrink-0 flex items-center justify-center">
            <span className="font-inter font-bold text-xs uppercase text-white/80">AD</span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">Administrator</p>
            <p className="text-xs font-inter text-white/40 truncate">Super User</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-300 text-xs font-bold transition-all flex items-center justify-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          <span>ログアウト</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden font-noto relative">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-all" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <aside className="hidden lg:flex w-72 bg-[#082752] text-white flex-col p-8 shadow-2xl z-20">
        <SidebarContent />
      </aside>

      <aside className={`fixed inset-y-0 left-0 w-72 bg-[#082752] text-white flex flex-col p-8 z-40 transform transition-transform duration-300 lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-20 lg:h-24 bg-white border-b border-gray-100 flex items-center justify-between px-6 lg:px-12 z-10 shadow-sm">
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex flex-col space-y-1">
              <h2 className="text-lg lg:text-2xl font-semibold text-gray-900 tracking-tight leading-none">
                {showForm ? (editingAccount ? 'アカウント編集' : '新規アカウント発行') : 'アカウント一覧'}
              </h2>
              <p className="hidden sm:block text-[10px] lg:text-[11px] text-gray-400 font-bold font-noto uppercase tracking-wider">CIRCLX MANAGEMENT CONSOLE</p>
            </div>
          </div>
          {!showForm && (
            <button onClick={handleNew} className="bg-[#fd780f] hover:bg-[#e46a0a] text-white px-5 lg:px-8 py-2.5 lg:py-3 rounded-xl lg:rounded-2xl font-bold shadow-lg shadow-[#fd780f]/20 transition-all active:scale-95 flex items-center space-x-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              <span className="text-sm lg:text-base">新規発行</span>
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-12 pb-[100px]">
          {error && (
            <div className="mb-6 bg-red-50 text-red-600 text-sm font-bold px-5 py-3 rounded-2xl border border-red-100">
              {error}
              <button onClick={() => setError('')} className="ml-3 text-red-400 hover:text-red-600">×</button>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin h-8 w-8 border-4 border-[#082752] border-t-transparent rounded-full"></div>
            </div>
          ) : showForm ? (
            <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[1.5rem] lg:rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden">
                <div className="bg-[#082752] p-6 lg:p-8 text-white flex items-center justify-between">
                  <div>
                    <h3 className="text-lg lg:text-xl font-semibold">
                      {editingAccount ? 'アカウント情報の更新' : 'アカウント情報入力'}
                    </h3>
                    <p className="text-white/60 text-xs lg:text-sm">店舗用のログイン情報を設定します。</p>
                  </div>
                  <div className="hidden sm:flex w-12 h-12 bg-white/10 rounded-2xl items-center justify-center">
                    <svg className="w-6 h-6 text-[#fd780f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </div>
                </div>
                <form onSubmit={handleSubmit} className="p-6 lg:p-12 space-y-8 lg:space-y-12">
                  <section className="space-y-4 lg:space-y-6">
                    <div className="flex items-center space-x-2 pb-2 border-b border-gray-50">
                      <div className="w-1 h-3 lg:w-1.5 lg:h-4 bg-[#fd780f] rounded-full"></div>
                      <h4 className="font-bold text-sm lg:text-base text-gray-900">1. ログイン情報</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-12">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">アカウントID（店舗ID）</label>
                        <div className="flex items-center">
                          <input
                            type="text"
                            required
                            value={formData.id}
                            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                            placeholder="shibuya-cafe"
                            disabled={!!editingAccount}
                            className="flex-1 min-w-0 px-4 lg:px-6 py-3 lg:py-4 rounded-l-xl lg:rounded-l-2xl border-2 border-r-0 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-[#fd780f] outline-none transition-all text-sm lg:text-base text-gray-900 font-inter disabled:opacity-50"
                          />
                          <div className="px-3 lg:px-6 py-3 lg:py-4 bg-gray-100 border-2 border-l-0 border-gray-50 rounded-r-xl lg:rounded-r-2xl text-[10px] lg:text-sm text-gray-400 font-inter font-bold">.wait-system.com</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">メールアドレス</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="shibuya@circlex.jp"
                          className="w-full px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-[#fd780f] outline-none transition-all text-sm lg:text-base text-gray-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">{editingAccount ? 'パスワード変更（空欄で変更なし）' : '初期パスワード'}</label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="••••••••"
                          required={!editingAccount}
                          className="w-full px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-[#fd780f] outline-none transition-all text-sm lg:text-base text-gray-900 font-inter"
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4 lg:space-y-6">
                    <div className="flex items-center space-x-2 pb-2 border-b border-gray-50">
                      <div className="w-1 h-3 lg:w-1.5 lg:h-4 bg-[#fd780f] rounded-full"></div>
                      <h4 className="font-bold text-sm lg:text-base text-gray-900">2. 会社・店舗基本情報</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-12">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">会社名 / 店舗名</label>
                        <input
                          type="text"
                          required
                          value={formData.storeName}
                          onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                          placeholder="例: CIRCLX 渋谷支店"
                          className="w-full px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-[#fd780f] outline-none transition-all text-sm lg:text-base text-gray-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">利用ステータス</label>
                        <div className="flex space-x-3 lg:space-x-4">
                          <label className="flex-1 cursor-pointer group">
                            <input type="radio" name="status" className="hidden peer" checked={formData.status === 'ACTIVE'} onChange={() => setFormData({ ...formData, status: 'ACTIVE' })} />
                            <div className="py-3 lg:py-4 px-4 lg:px-6 rounded-xl lg:rounded-2xl border-2 border-gray-50 bg-gray-50/50 peer-checked:bg-white peer-checked:border-[#fd780f] flex items-center justify-between transition-all">
                              <span className="font-bold text-xs lg:text-sm text-gray-700">利用中</span>
                              <div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-[#fd780f] scale-0 peer-checked:scale-100 transition-transform"></div>
                            </div>
                          </label>
                          <label className="flex-1 cursor-pointer group">
                            <input type="radio" name="status" className="hidden peer" checked={formData.status === 'DISABLED'} onChange={() => setFormData({ ...formData, status: 'DISABLED' })} />
                            <div className="py-3 lg:py-4 px-4 lg:px-6 rounded-xl lg:rounded-2xl border-2 border-gray-50 bg-gray-50/50 peer-checked:bg-white peer-checked:border-red-500 flex items-center justify-between transition-all">
                              <span className="font-bold text-xs lg:text-sm text-gray-400 peer-checked:text-red-500">停止</span>
                              <div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full bg-red-500 scale-0 peer-checked:scale-100 transition-transform"></div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="pt-6 lg:pt-10 flex flex-col sm:flex-row justify-end items-center space-y-3 sm:space-y-0 sm:space-x-6">
                    <button type="button" onClick={() => setShowForm(false)} className="w-full sm:w-auto px-10 py-4 rounded-xl lg:rounded-2xl font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                      キャンセル
                    </button>
                    <button type="submit" disabled={isSaving} className="w-full sm:w-auto px-12 lg:px-16 py-4 rounded-xl lg:rounded-2xl font-black bg-[#fd780f] text-white shadow-xl shadow-[#fd780f]/20 hover:bg-[#e46a0a] hover:-translate-y-1 transition-all active:scale-95 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center space-x-2">
                      {isSaving && (
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      <span>{editingAccount ? '更新する' : '発行する'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              <div className="hidden md:block bg-white rounded-[1.5rem] lg:rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 lg:px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">店舗ID / 会社・店舗名</th>
                      <th className="px-6 lg:px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">メールアドレス</th>
                      <th className="px-6 lg:px-10 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">ステータス</th>
                      <th className="px-6 lg:px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">店舗URL</th>
                      <th className="px-6 lg:px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">発行日</th>
                      <th className="px-6 lg:px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {accounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-orange-50/10 transition-colors group">
                        <td className="px-6 lg:px-10 py-6">
                          <div>
                            <p className="font-avenir font-semibold text-sm lg:text-base text-gray-900 group-hover:text-[#fd780f] transition-colors">{acc.id}</p>
                            <p className="text-xs lg:text-sm text-gray-400 font-bold">{acc.storeName}</p>
                          </div>
                        </td>
                        <td className="px-6 lg:px-10 py-6 text-xs lg:text-sm font-inter font-medium text-gray-600">{acc.email}</td>
                        <td className="px-6 lg:px-10 py-6 text-center">
                          <span className={`inline-block px-3 lg:px-4 py-1 rounded-full text-[9px] lg:text-[10px] font-inter font-black uppercase tracking-wider ${acc.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            {acc.status}
                          </span>
                        </td>
                        <td className="px-6 lg:px-10 py-6">
                          <div className="space-y-1">
                            <a
                              href={`${window.location.protocol}//${window.location.hostname}:3005/?storeId=${acc.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1.5 text-xs lg:text-sm font-inter font-medium text-[#fd780f] hover:text-[#e46a0a] hover:underline transition-colors"
                            >
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                              <span>店舗管理</span>
                            </a>
                            <a
                              href={`${window.location.protocol}//${window.location.hostname}:3007/?storeId=${acc.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1.5 text-xs lg:text-sm font-inter font-medium text-[#082752] hover:text-[#0a3366] hover:underline transition-colors"
                            >
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                              <span>キオスク</span>
                            </a>
                            <a
                              href={`${window.location.protocol}//${window.location.hostname}:3006/?storeId=${acc.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1.5 text-xs lg:text-sm font-inter font-medium text-gray-500 hover:text-gray-700 hover:underline transition-colors"
                            >
                              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                              <span>顧客ポータル</span>
                            </a>
                          </div>
                        </td>
                        <td className="px-6 lg:px-10 py-6 text-xs lg:text-sm text-gray-400 font-inter font-medium">{acc.createdAt?.slice(0, 10)}</td>
                        <td className="px-6 lg:px-10 py-6 text-right">
                          <div className="flex justify-end space-x-1 lg:space-x-2">
                            <button onClick={() => handleEdit(acc)} className="p-2.5 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition text-gray-400 hover:text-[#fd780f]">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2.5 2.5 0 113.536 3.536L12 20.414H8v-4.414L17.586 3.586z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(acc)} className="p-2.5 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition text-gray-400 hover:text-red-500">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-4">
                {accounts.map((acc) => (
                  <div key={acc.id} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-avenir font-semibold text-lg text-gray-900 leading-none mb-1">{acc.id}</p>
                        <p className="text-xs text-gray-400 font-bold">{acc.storeName}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-inter font-black uppercase tracking-wider ${acc.status === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {acc.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Email Address</p>
                      <p className="text-sm font-inter font-medium text-gray-600">{acc.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-50">
                      <a
                        href={`${window.location.protocol}//${window.location.hostname}:3005/?storeId=${acc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#fd780f]/10 text-[#fd780f] text-xs font-bold"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        <span>店舗管理</span>
                      </a>
                      <a
                        href={`${window.location.protocol}//${window.location.hostname}:3007/?storeId=${acc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#082752]/10 text-[#082752] text-xs font-bold"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <span>キオスク</span>
                      </a>
                      <a
                        href={`${window.location.protocol}//${window.location.hostname}:3006/?storeId=${acc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        <span>顧客</span>
                      </a>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <p className="text-[10px] font-inter font-bold text-gray-300">{acc.createdAt?.slice(0, 10)}</p>
                      <div className="flex space-x-2">
                        <button onClick={() => handleEdit(acc)} className="p-3 rounded-xl bg-gray-50 text-gray-400 active:bg-orange-50 active:text-[#fd780f] transition">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2.5 2.5 0 113.536 3.536L12 20.414H8v-4.414L17.586 3.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(acc)} className="p-3 rounded-xl bg-gray-50 text-gray-400 active:bg-red-50 active:text-red-500 transition">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <p className="text-[10px] lg:text-xs text-gray-300 font-avenir font-bold uppercase tracking-widest">CIRCLX DATABASE: {accounts.length} units recorded</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {deleteTarget && (
        <GlassModal
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          title="アカウントを削除しますか？"
          message={`「${deleteTarget.storeName}」（${deleteTarget.id}）を完全に削除します。この操作は取り消せません。`}
          confirmText="削除を確定"
          isDangerous
        />
      )}
    </div>
  );
};

export default AdminView;
