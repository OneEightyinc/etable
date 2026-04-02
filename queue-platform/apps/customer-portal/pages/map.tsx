import React from "react";
import Link from "next/link";
import BottomNavigation from "../components/common/BottomNavigation";

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" xmlns="http://www.w3.org/2000/svg"><polyline points="15 18 9 12 15 6" /></svg>
);
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);
const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
const FilterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" xmlns="http://www.w3.org/2000/svg"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
);

const mapRestaurants = [
  { id: "1", name: "究極の極太麺 札幌ラーメン一番", category: "ラーメン", distance: "6.9km", wait: "10組待ち", top: "22%", left: "58%" },
  { id: "2", name: "自家焙煎 カフェ・ラパン", category: "カフェ", distance: "7.1km", wait: "0組待ち", top: "36%", left: "38%" },
  { id: "3", name: "江戸前 鮨 拓海", category: "寿司", distance: "1.1km", wait: "3組待ち", top: "56%", left: "64%" },
  { id: "5", name: "本格焼肉 黄金の牛", category: "焼肉", distance: "2.5km", wait: "5組待ち", top: "68%", left: "28%" },
];

const MapPage: React.FC = () => {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[393px] bg-white pb-[24px]">
      <header className="sticky top-0 z-20 bg-white">
        <div className="relative flex h-[58px] items-center justify-center border-b border-[#f2f2f2] px-4">
          <Link href="/" className="absolute left-4 flex h-8 w-8 items-center justify-center">
            <ChevronLeftIcon />
          </Link>
          <h1 className="text-[18px] font-bold text-[#111]">マップで探す</h1>
        </div>
      </header>

      <section className="px-5 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-[#e5e5e5] bg-white px-4 py-3 shadow-[0px_2px_6px_rgba(0,0,0,0.08)]">
            <SearchIcon />
            <span className="text-[14px] font-medium text-[#999]">エリア・店名で探す</span>
          </div>
          <button type="button" className="flex h-[48px] w-[48px] items-center justify-center rounded-full border border-[#e5e5e5] bg-white shadow-[0px_2px_6px_rgba(0,0,0,0.08)]">
            <FilterIcon />
          </button>
        </div>
      </section>

      {/* Map Area (CSS illustration) */}
      <section className="px-5 pt-4">
        <div className="relative h-[520px] overflow-hidden rounded-[28px] border border-[#ececec] bg-[#f6f6f6] shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.85)_0%,_rgba(240,240,240,1)_100%)]" />
          <div className="absolute inset-0 opacity-70">
            <div className="absolute left-[18%] top-[10%] h-[1px] w-[64%] bg-[#dfdfdf]" />
            <div className="absolute left-[8%] top-[28%] h-[1px] w-[78%] bg-[#dfdfdf]" />
            <div className="absolute left-[16%] top-[47%] h-[1px] w-[70%] bg-[#dfdfdf]" />
            <div className="absolute left-[10%] top-[66%] h-[1px] w-[76%] bg-[#dfdfdf]" />
            <div className="absolute left-[28%] top-[6%] h-[78%] w-[1px] bg-[#dfdfdf]" />
            <div className="absolute left-[52%] top-[12%] h-[72%] w-[1px] bg-[#dfdfdf]" />
            <div className="absolute left-[74%] top-[18%] h-[62%] w-[1px] bg-[#dfdfdf]" />
          </div>
          <div className="absolute bottom-5 left-5 z-10 rounded-full bg-white px-4 py-2 shadow-[0_6px_14px_rgba(0,0,0,0.12)]">
            <span className="text-[13px] font-semibold text-[#111]">近くの店舗 12件</span>
          </div>
          {mapRestaurants.map((r) => (
            <Link
              key={r.id}
              href={`/restaurant/${r.id}`}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ top: r.top, left: r.left }}
            >
              <div className="rounded-[18px] bg-[#ff6b00] px-3 py-2 text-white shadow-[0_10px_18px_rgba(255,107,0,0.28)]">
                <div className="flex items-center gap-1">
                  <MapPinIcon />
                  <span className="text-[12px] font-bold">{r.category}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Restaurant List */}
      <section className="px-5 pt-4">
        <div className="space-y-3">
          {mapRestaurants.map((r) => (
            <Link key={r.id} href={`/restaurant/${r.id}`} className="block rounded-[22px] border border-[#ececec] bg-white px-4 py-4 shadow-[0_6px_16px_rgba(0,0,0,0.05)]">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-[8px] bg-[#f5f5f5] px-3 py-1 text-[12px] font-medium text-[#888]">{r.category}</span>
                <span className="text-[13px] font-semibold text-[#ff6b00]">{r.wait}</span>
              </div>
              <h2 className="mb-2 text-[16px] font-bold leading-[1.5] text-[#111]">{r.name}</h2>
              <div className="flex items-center gap-2 text-[13px] font-medium text-[#8a8f98]">
                <MapPinIcon />
                <span>{r.distance}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <BottomNavigation />
    </main>
  );
};

export default MapPage;
