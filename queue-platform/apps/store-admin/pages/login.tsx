import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-6">
      <div className="w-full max-w-sm flex-1 flex flex-col items-start pt-[12.5rem]">
        {/* Logo */}
        <span className="text-4xl font-bold tracking-tight block mt-[42px] mb-3">
          <span className="text-[#FD780F]">E</span>
          <span className="text-[#082752]">TABLE</span>
        </span>

        {/* Subtitle */}
        <p className="text-[9px] tracking-[0.35em] text-gray-300 mb-10 text-left uppercase font-black">
          PREMIUM WAITLIST APP
        </p>

        {/* Form Section */}
        <div className="space-y-4 w-full">
          {/* Email/Phone Input */}
          <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 h-[64px]">
            <svg
              className="w-5 h-5 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Z" />
              <path d="M6 20c0-2.21 2.686-4 6-4s6 1.79 6 4" />
            </svg>
            <div className="relative flex-1">
              {!email && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300 text-sm pointer-events-none whitespace-nowrap font-black">
                  電話番号 または メールアドレス
                </span>
              )}
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm text-gray-700 outline-none bg-transparent pr-2"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 h-[64px]">
            <svg
              className="w-5 h-5 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div className="relative flex-1">
              {!password && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300 text-sm pointer-events-none whitespace-nowrap font-black">
                  パスワード
                </span>
              )}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm text-gray-700 outline-none bg-transparent pr-2"
              />
            </div>
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full mt-6 bg-[#FD780F] text-white font-semibold h-[64px] rounded-full flex items-center justify-center gap-3 active:scale-[0.99] transition-transform"
        >
          ログイン
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M5 12h14" stroke="currentColor" strokeWidth="2" />
            <path d="m13 18 6-6-6-6" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mb-8 mt-auto w-full">
          © 2025 ETABLE. All Rights Reserved.
        </div>
      </div>
    </div>
  );
}
