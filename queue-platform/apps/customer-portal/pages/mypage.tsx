import React from "react";
import Link from "next/link";
import AppHeader from "../components/common/AppHeader";
import BottomNavigation from "../components/common/BottomNavigation";

const MyPage: React.FC = () => {
  const GiftIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FD780F" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <polyline points="20 12 20 2 4 2 4 12" />
      <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
      <path d="M12 7v10" />
      <path d="M7 12h10" />
    </svg>
  );

  const SettingsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 0l4.24-4.24M1 12h6m6 0h6m-1.78 7.78l-4.24-4.24m-5.08 0l-4.24 4.24" />
    </svg>
  );

  const HelpIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4m0-4h.01" />
    </svg>
  );

  const ChevronRightIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );

  return (
    <>
      <AppHeader />
      <main className="flex-grow pt-16 pb-24">
        <div className="mx-auto w-full max-w-[393px] bg-white">
          <div className="px-4 py-4">
            <h1 className="text-[18px] font-bold text-[#222] mb-6">マイページ</h1>

            {/* Member Card */}
            <div className="bg-gradient-to-r from-[#FD780F] to-[#ff6b00] rounded-lg p-6 text-white mb-6">
              <h2 className="text-[14px] font-bold mb-4">ETABLEメンバーカード</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-[11px] text-white/80 mb-1">会員名</p>
                  <p className="text-[16px] font-bold">山田太郎</p>
                </div>

                <div className="flex justify-between pt-4 border-t border-white/20">
                  <div>
                    <p className="text-[11px] text-white/80 mb-1">会員レベル</p>
                    <p className="text-[14px] font-bold">ゴールド</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-white/80 mb-1">ポイント</p>
                    <p className="text-[14px] font-bold">2,450 pts</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recently Visited */}
            <div className="mb-6">
              <h3 className="text-[14px] font-bold text-[#222] mb-3">最近訪れたお店</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-[#f9f9f9] rounded-lg">
                  <p className="text-[13px] text-[#222]">究極の極太麺 札幌ラーメン一座</p>
                  <span className="text-[12px] text-[#999]">2024/04/01</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#f9f9f9] rounded-lg">
                  <p className="text-[13px] text-[#222]">自家焙煎 カフェ・ラパン</p>
                  <span className="text-[12px] text-[#999]">2024/03/28</span>
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-[13px] font-bold text-[#999] mb-3">アカウント設定</h3>

              <div className="space-y-2 mb-6">
                <Link href="/settings/account">
                  <button className="w-full flex items-center justify-between p-3 hover:bg-[#f9f9f9] rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <SettingsIcon />
                      <span className="text-[13px] text-[#222]">プロフィール設定</span>
                    </div>
                    <ChevronRightIcon />
                  </button>
                </Link>

                <Link href="/settings/notifications">
                  <button className="w-full flex items-center justify-between p-3 hover:bg-[#f9f9f9] rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <SettingsIcon />
                      <span className="text-[13px] text-[#222]">通知設定</span>
                    </div>
                    <ChevronRightIcon />
                  </button>
                </Link>

                <Link href="/settings/payment">
                  <button className="w-full flex items-center justify-between p-3 hover:bg-[#f9f9f9] rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <SettingsIcon />
                      <span className="text-[13px] text-[#222]">支払い方法</span>
                    </div>
                    <ChevronRightIcon />
                  </button>
                </Link>
              </div>

              {/* Support Section */}
              <h3 className="text-[13px] font-bold text-[#999] mb-3">サポート</h3>

              <div className="space-y-2">
                <Link href="/faq">
                  <button className="w-full flex items-center justify-between p-3 hover:bg-[#f9f9f9] rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <HelpIcon />
                      <span className="text-[13px] text-[#222]">よくある質問</span>
                    </div>
                    <ChevronRightIcon />
                  </button>
                </Link>

                <Link href="/contact">
                  <button className="w-full flex items-center justify-between p-3 hover:bg-[#f9f9f9] rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <HelpIcon />
                      <span className="text-[13px] text-[#222]">お問い合わせ</span>
                    </div>
                    <ChevronRightIcon />
                  </button>
                </Link>

                <Link href="/privacy">
                  <button className="w-full flex items-center justify-between p-3 hover:bg-[#f9f9f9] rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <HelpIcon />
                      <span className="text-[13px] text-[#222]">プライバシーポリシー</span>
                    </div>
                    <ChevronRightIcon />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <BottomNavigation />
    </>
  );
};

export default MyPage;
