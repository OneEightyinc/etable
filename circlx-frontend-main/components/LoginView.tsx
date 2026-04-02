
import React, { useState } from 'react';
import Image from 'next/image';
import GlassModal from './GlassModal';
import { login } from '../lib/api-client';

interface LoginViewProps {
  onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@circlex.jp');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotForm, setShowForgotForm] = useState(false);
  const [forgotEmail, setForgotEmail] = useState(email);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 bg-[#F8FAFC] font-noto overflow-y-auto pb-[100px]">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#082752]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#fd780f]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pt-16 lg:pt-24">
        {/* Logo Area - CIRCLX Style */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="select-none">
            <Image
              src="/circlx_black.svg"
              alt="CIRCLX"
              width={240}
              height={80}
              priority
            />
          </div>
          <p className="mt-5 text-[10px] font-avenir font-bold uppercase tracking-[0.4em] text-slate-400">
            MANAGEMENT SYSTEM
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-gray-100 p-8 lg:p-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm font-bold px-5 py-3 rounded-2xl border border-red-100">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">メールアドレス</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@circlex.jp"
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-[#082752] outline-none transition-all text-gray-900 font-medium placeholder:text-gray-300"
                  required
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" /></svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">パスワード</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white focus:border-[#082752] outline-none transition-all text-gray-900 font-inter placeholder:text-gray-300"
                  required
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#082752] focus:ring-[#082752]" />
                <span className="text-xs font-bold text-gray-400 group-hover:text-gray-600 transition-colors">ログイン状態を保持</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setShowForgotForm(true);
                }}
                className="text-[10px] font-bold text-gray-400 hover:text-[#fd780f] transition-colors"
              >
                パスワードを忘れた場合
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 rounded-2xl bg-[#082752] text-white font-black text-lg shadow-2xl shadow-[#082752]/25 hover:bg-[#061d3e] hover:-translate-y-1 transition-all active:scale-95 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center space-x-3"
            >
              {isLoading ? (
                <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <span>ログイン</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-xs font-bold text-gray-400">
          © 2024 Circlex Inc. All rights reserved.
        </p>

        {showForgotForm && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-6">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
              onClick={() => !isSendingReset && setShowForgotForm(false)}
            />
            <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/60 overflow-hidden">
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  パスワードをお忘れの場合
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  登録済みのメールアドレスを入力すると、パスワード再設定用のリンクをお送りします。
                </p>
                <form
                  className="space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (isSendingReset) return;
                    setIsSendingReset(true);
                    setTimeout(() => {
                      setIsSendingReset(false);
                      setShowForgotForm(false);
                      setShowForgotPasswordModal(true);
                    }, 800);
                  }}
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="example@circlex.jp"
                      className="w-full px-5 py-3.5 rounded-2xl border-2 border-gray-50 bg-gray-50/80 focus:bg-white focus:border-[#082752] outline-none transition-all text-gray-900 placeholder:text-gray-300"
                    />
                  </div>
                  <div className="flex flex-col space-y-3 mt-4">
                    <button
                      type="submit"
                      disabled={isSendingReset}
                      className="w-full py-4 rounded-2xl bg-[#fd780f] text-white font-bold shadow-lg shadow-[#fd780f]/25 hover:bg-[#e46a0a] transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                    >
                      {isSendingReset ? '送信中...' : '送信'}
                    </button>
                    <button
                      type="button"
                      disabled={isSendingReset}
                      onClick={() => setShowForgotForm(false)}
                      className="w-full py-3 rounded-2xl text-xs font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100/60 transition-all disabled:opacity-60"
                    >
                      閉じる
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showForgotPasswordModal && (
          <GlassModal
            onClose={() => setShowForgotPasswordModal(false)}
            onConfirm={() => setShowForgotPasswordModal(false)}
            title="パスワード再設定リンクを送信しました"
            message="ご登録のメールアドレス宛に、パスワード再設定用のリンクを送信しました。メールボックスをご確認ください。"
            confirmText="OK"
          />
        )}
      </div>
    </div>
  );
};

export default LoginView;
