import React from "react";
import Link from "next/link";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";

interface MypageBackHeaderProps {
  title: string;
  backHref?: string;
}

const MypageBackHeader: React.FC<MypageBackHeaderProps> = ({ title, backHref = "/mypage" }) => (
  <header className="sticky top-0 z-20 border-b border-[#f2f2f2] bg-white">
    <div className="relative flex h-[56px] items-center justify-center px-4">
      <Link
        href={backHref}
        className="absolute left-4 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f5f5f5]"
      >
        <ChevronLeftIcon className="h-5 w-5 text-[#333]" />
      </Link>
      <h1 className="text-[20px] font-bold text-[#ff6b00]">ETABLE</h1>
    </div>
    <div className="border-b border-[#f2f2f2] px-4 pb-2">
      <h2 className="text-[18px] font-bold text-[#111]">{title}</h2>
    </div>
  </header>
);

export default MypageBackHeader;
