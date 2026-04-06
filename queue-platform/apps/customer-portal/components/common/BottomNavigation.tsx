import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { BookmarkIcon, CalendarDaysIcon, HomeIcon, UserIcon } from "@heroicons/react/24/outline";

const navItems = [
  { name: "探す", href: "/", icon: HomeIcon },
  { name: "マイ予約", href: "/my-reservations", icon: CalendarDaysIcon },
  { name: "お気に入り", href: "/favorites", icon: BookmarkIcon },
  { name: "マイページ", href: "/mypage", icon: UserIcon },
];

const BottomNavigation: React.FC = () => {
  const router = useRouter();
  const pathname = router.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-[#e5e5e5] bg-white">
      <div className="mx-auto flex h-[76px] w-full max-w-[393px] items-start justify-between px-[37px] pt-[12px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`) ||
            (item.href === "/mypage" && ["/faq", "/contact", "/privacy"].includes(pathname));
          return (
            <Link key={item.href} href={item.href} className="flex w-[60px] flex-col items-center">
              <Icon className={isActive ? "size-[22px] text-[#ff6b00]" : "size-[22px] text-[#999]"} />
              <span
                className={
                  isActive
                    ? "mt-[4px] text-center text-[12px] font-medium text-[#ff6b00]"
                    : "mt-[4px] text-center text-[12px] font-medium text-[#999]"
                }
              >
                {item.name}
              </span>
              {isActive ? <span className="mt-[6px] block size-[4px] rounded-full bg-[#ff6b00]" /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
