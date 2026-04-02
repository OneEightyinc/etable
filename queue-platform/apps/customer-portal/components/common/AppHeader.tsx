import React from "react";

const AppHeader: React.FC = () => (
  <header className="fixed top-0 left-0 right-0 z-10 bg-white">
    <div className="mx-auto w-full max-w-[393px] h-[70px] flex items-end justify-center pb-3">
      <h1 className="text-[22px] font-bold tracking-tight">
        <span className="text-[#FD780F]">E</span><span className="text-[#082752]">TABLE</span>
      </h1>
    </div>
  </header>
);

export default AppHeader;
