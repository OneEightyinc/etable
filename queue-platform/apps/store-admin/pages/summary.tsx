import React from 'react';
import Link from 'next/link';

export default function Summary() {
  return (
    <div className="min-h-screen bg-white text-[#22304A]">
      <div className="max-w-[420px] mx-auto px-[18px] pt-[50px] pb-[30px]">
        {/* Hero Section */}
        <div className="relative flex justify-center mb-4">
          {/* Badge */}
          <div className="absolute -top-[10px] px-3 py-1.5 rounded-full bg-[#22304A] text-white text-xs font-bold tracking-wide shadow-md">
            達成！
          </div>

          {/* Icon Container */}
          <div className="w-[110px] h-[110px] grid place-items-center">
            {/* Ring */}
            <div className="w-[106px] h-[106px] rounded-full bg-white shadow-[0_10px_26px_rgba(0,0,0,0.06),inset_0_0_0_6px_#F0F2F6] grid place-items-center">
              {/* Core */}
              <div className="w-[88px] h-[88px] rounded-full bg-[#FD780F] grid place-items-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)]">
                {/* Checkmark SVG */}
                <svg
                  className="w-10 h-10 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M8 12.5l2 2 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-center text-[30px] font-extrabold tracking-tight mt-1.5 mb-2.5 text-[#22304A]">
          本日の営業実績
        </h1>

        {/* Subtitle */}
        <p className="text-center text-sm font-bold text-[#FD780F] mb-[22px]">
          ❤️ 今日も一日お疲れ様でした！
        </p>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-2 gap-[14px] mb-4">
          {/* 案内組数 Card */}
          <div className="rounded-[22px] p-[14px] pb-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-[rgba(253,120,15,0.18)] bg-[#FFF1E7]">
            {/* Label Row */}
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#98A2B3] mb-2.5">
              {/* Icon Container */}
              <div className="w-[18px] h-[18px] rounded-[7px] bg-[rgba(253,120,15,0.16)] grid place-items-center">
                {/* Checkmark SVG */}
                <svg
                  className="w-[14px] h-[14px] text-[#FD780F]"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M8 12.5l2 2 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
              <span>案内組数</span>
            </div>

            {/* Metric */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-[38px] font-extrabold tracking-tight leading-none text-[#FD780F]">
                42
              </span>
              <span className="text-sm font-bold text-[#98A2B3]">組</span>
            </div>
          </div>

          {/* 離脱組数 Card */}
          <div className="rounded-[22px] p-[14px] pb-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-[#E5E7EB] bg-[#F3F4F6]">
            {/* Label Row */}
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#98A2B3] mb-2.5">
              {/* Icon Container */}
              <div className="w-[18px] h-[18px] rounded-[7px] bg-[rgba(8,39,82,0.08)] grid place-items-center">
                {/* X SVG */}
                <svg
                  className="w-[14px] h-[14px] text-[rgba(8,39,82,0.55)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M15 9l-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 9l6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span>離脱組数</span>
            </div>

            {/* Metric */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-[38px] font-extrabold tracking-tight leading-none text-[#22304A]">
                3
              </span>
              <span className="text-sm font-bold text-[#98A2B3]">組</span>
            </div>
          </div>
        </div>

        {/* Wide Card (平均待ち時間) */}
        <div className="flex items-center justify-between gap-3 bg-[#F9FAFB] rounded-[26px] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-[#EEF1F5] mt-2.5 mb-5">
          {/* Left Side */}
          <div className="flex-1">
            {/* Label */}
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#98A2B3] mb-2.5">
              {/* Icon Container */}
              <div className="w-[18px] h-[18px] rounded-[7px] bg-[rgba(8,39,82,0.08)] grid place-items-center">
                {/* Clock SVG */}
                <svg
                  className="w-[14px] h-[14px] text-[rgba(8,39,82,0.55)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M12 7v5l3 2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span>平均待ち時間</span>
            </div>

            {/* Value and Unit */}
            <div className="flex items-baseline gap-2">
              <span className="text-[40px] font-[850] tracking-tight leading-none text-[#22304A]">
                12.5
              </span>
              <span className="text-sm font-bold text-[#98A2B3]">分 / 組</span>
            </div>
          </div>

          {/* Right Side */}
          <div className="w-[54px] h-[54px] rounded-[18px] bg-[#f6efe7] grid place-items-center shadow-[inset_0_0_0_1px_rgba(253,120,15,0.08)]">
            {/* Clock SVG */}
            <svg
              className="w-6 h-6 text-[#FD780F]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" />
              <path
                d="M12 6v6l4 2"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {/* Analyze Button */}
          <Link href="/analytics">
            <button className="w-full h-14 rounded-full inline-flex items-center justify-center gap-3 font-extrabold text-[15px] tracking-tight shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-transparent active:translate-y-px transition-all bg-[#FD780F] text-white">
              {/* Chart Icon SVG */}
              <svg
                className="w-[22px] h-[22px]"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
                <path d="M18 17V9"></path>
                <path d="M13 17V5"></path>
                <path d="M8 17v-3"></path>
              </svg>
              <span>さらに詳しく分析する</span>
            </button>
          </Link>

          {/* Save Report Button */}
          <button className="w-full h-14 rounded-full inline-flex items-center justify-center gap-3 font-extrabold text-[15px] tracking-tight shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-[#EEF1F5] active:translate-y-px transition-all bg-white text-[#22304A]">
            {/* File Icon SVG */}
            <svg
              className="w-[22px] h-[22px]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path>
              <path d="M14 2v5a1 1 0 0 0 1 1h5"></path>
              <path d="M10 9H8"></path>
              <path d="M16 13H8"></path>
              <path d="M16 17H8"></path>
            </svg>
            <span>レポートを保存</span>
          </button>

          {/* Home Button */}
          <Link href="/">
            <button className="w-full h-14 rounded-full inline-flex items-center justify-center gap-3 font-extrabold text-[15px] tracking-tight shadow-[0_4px_12px_rgba(0,0,0,0.04)] border border-[#E5E7EB] active:translate-y-px transition-all bg-transparent text-[#98A2B3]">
              {/* Home Icon SVG */}
              <svg
                className="w-[22px] h-[22px]"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>
                <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
              <span>ホームへ戻る</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
