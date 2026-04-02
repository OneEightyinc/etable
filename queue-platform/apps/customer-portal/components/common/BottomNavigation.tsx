import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const BottomNavigation: React.FC = () => {
  const router = useRouter();
  const currentPath = router.pathname;

  const navItems = [
    { label: "探す", path: "/", icon: "home" },
    { label: "マイ予約", path: "/my-reservations", icon: "calendar" },
    { label: "お気に入り", path: "/favorites", icon: "bookmark" },
    { label: "マイページ", path: "/mypage", icon: "user" },
  ];

  const isActive = (path: string) => currentPath === path;

  const getIcon = (iconType: string, active: boolean) => {
    const color = active ? "#FD780F" : "#999999";

    switch (iconType) {
      case "home":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill={color} />
          </svg>
        );
      case "calendar":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" fill={color} />
          </svg>
        );
      case "bookmark":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 3H5c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" fill={color} />
          </svg>
        );
      case "user":
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill={color} />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200">
      <div className="mx-auto w-full max-w-[393px] h-[76px] flex items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link key={item.path} href={item.path}>
              <div className="flex flex-col items-center justify-center w-16 h-16 cursor-pointer relative">
                {getIcon(item.icon, active)}
                <span className={`text-[11px] mt-1 font-medium ${active ? "text-[#FD780F]" : "text-[#999999]"}`}>
                  {item.label}
                </span>
                {active && (
                  <div className="absolute bottom-0 w-1 h-1 bg-[#FD780F] rounded-full"></div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
