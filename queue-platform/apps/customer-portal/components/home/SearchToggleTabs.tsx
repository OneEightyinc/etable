import React from "react";
import Link from "next/link";

const iconClass = "h-5 w-5 shrink-0 text-[#ff6b00]";

const MagnifyingGlassIcon = () => (
  <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const MapPinIcon = () => (
  <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

const SearchToggleTabs: React.FC = () => (
  <div className="px-5 pb-2 pt-4">
    <div className="flex gap-3">
      <Link
        href="/"
        className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#e5e5e5] bg-white py-4 shadow-[0px_2px_6px_rgba(0,0,0,0.08)]"
      >
        <MagnifyingGlassIcon />
        <span className="text-[15px] font-semibold text-[#111]">一覧で探す</span>
      </Link>
      <Link
        href="/map"
        className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#e5e5e5] bg-white py-4 shadow-[0px_2px_6px_rgba(0,0,0,0.08)]"
      >
        <MapPinIcon />
        <span className="text-[15px] font-semibold text-[#111]">マップで探す</span>
      </Link>
    </div>
  </div>
);

export default SearchToggleTabs;
