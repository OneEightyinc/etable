import React from "react";
import Image from "next/image";

const AppHeader: React.FC = () => (
  <header className="fixed top-0 left-0 right-0 z-10 bg-white">
    <div className="mx-auto flex h-[69.965px] w-full max-w-[393px] items-end justify-center pb-[11.99px]">
      <Image
        src="/etable_orange.svg"
        alt="ETABLE"
        width={120}
        height={24}
        className="h-[20px] w-auto"
        priority
      />
    </div>
  </header>
);

export default AppHeader;
