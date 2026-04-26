import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { WAIT_TIME_FILTERS, type WaitTimeFilterId } from "../../lib/exploreCategories";

interface Props {
  value: WaitTimeFilterId;
  onChange: (id: WaitTimeFilterId) => void;
}

const iconClass = "h-5 w-5 shrink-0";

const MagnifyingGlassIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg className={`${iconClass} ${active ? "text-white" : "text-[#ff6b00]"}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const MapPinIcon: React.FC<{ active: boolean }> = ({ active }) => (
  <svg className={`${iconClass} ${active ? "text-white" : "text-[#ff6b00]"}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

/** 時計SVGアイコン */
const ClockIcon: React.FC<{ fillLevel: number; active: boolean }> = ({ fillLevel, active }) => {
  const color = active ? "#fff" : "#ff6b00";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <line x1="12" y1="12" x2="12" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line
        x1="12" y1="12"
        x2={fillLevel <= 1 ? "15" : fillLevel === 2 ? "16" : "17"}
        y2={fillLevel <= 1 ? "10" : fillLevel === 2 ? "12" : "14"}
        stroke={color} strokeWidth="2" strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="1.5" fill={color} />
    </svg>
  );
};

const FILL_LEVELS: Record<string, number> = { soon: 1, within30: 2, within60: 3 };

const SearchToggleTabs: React.FC<Props> = ({ value, onChange }) => {
  const router = useRouter();
  const isMapPage = router.pathname === "/map";

  return (
    <div className="px-5 pb-2 pt-4">
      {/* 一覧 / マップ 切り替え */}
      <div className="flex gap-3">
        <Link
          href="/"
          className={[
            "flex flex-1 items-center justify-center gap-2 rounded-full border py-3",
            !isMapPage
              ? "border-[#ff6b00] bg-[#ff6b00] shadow-md"
              : "border-[#e5e5e5] bg-white shadow-[0px_2px_6px_rgba(0,0,0,0.08)]",
          ].join(" ")}
        >
          <MagnifyingGlassIcon active={!isMapPage} />
          <span className={`text-[15px] font-semibold ${!isMapPage ? "text-white" : "text-[#111]"}`}>
            一覧で探す
          </span>
        </Link>
        <Link
          href="/map"
          className={[
            "flex flex-1 items-center justify-center gap-2 rounded-full border py-3",
            isMapPage
              ? "border-[#ff6b00] bg-[#ff6b00] shadow-md"
              : "border-[#e5e5e5] bg-white shadow-[0px_2px_6px_rgba(0,0,0,0.08)]",
          ].join(" ")}
        >
          <MapPinIcon active={isMapPage} />
          <span className={`text-[15px] font-semibold ${isMapPage ? "text-white" : "text-[#111]"}`}>
            マップで探す
          </span>
        </Link>
      </div>

      {/* 待ち時間フィルター */}
      <div className="mt-3 flex gap-2">
        {WAIT_TIME_FILTERS.filter((w) => w.id !== "any").map((w) => {
          const isSelected = w.id === value;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => onChange(isSelected ? "any" : w.id)}
              className={[
                "flex flex-1 flex-col items-center gap-1 rounded-2xl border py-2.5 transition-colors",
                isSelected
                  ? "border-[#ff6b00] bg-[#ff6b00] shadow-md"
                  : "border-[#e5e5e5] bg-white shadow-[0px_2px_6px_rgba(0,0,0,0.08)]",
              ].join(" ")}
            >
              <ClockIcon fillLevel={FILL_LEVELS[w.id] ?? 0} active={isSelected} />
              <span
                className={[
                  "text-[12px] font-semibold leading-tight",
                  isSelected ? "text-white" : "text-[#111]",
                ].join(" ")}
              >
                {w.label}
              </span>
              {w.sublabel && (
                <span
                  className={[
                    "text-[10px] leading-tight",
                    isSelected ? "text-white/80" : "text-[#999]",
                  ].join(" ")}
                >
                  {w.sublabel}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SearchToggleTabs;
