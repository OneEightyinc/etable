import React from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";

interface SectionHeaderProps {
  title: string;
  highlight?: string;
  sortOption?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, highlight, sortOption }) => (
  <div className="flex items-center justify-between bg-white px-[23.991px] pb-[15.99px] pt-[11.99px]">
    <h2 className="text-[18px] font-bold leading-[28px] text-[#0a0a0a]">
      {title}
      {highlight ? <span className="text-[#ff6b00]"> {highlight}</span> : null}
    </h2>
    {sortOption ? (
      <button
        type="button"
        className="flex items-center gap-[3.993px] text-[12px] font-medium leading-[16px] text-[#0a0a0a] opacity-70"
      >
        <span>{sortOption}</span>
        <Bars3Icon className="size-[11.99px]" />
      </button>
    ) : null}
  </div>
);

export default SectionHeader;
