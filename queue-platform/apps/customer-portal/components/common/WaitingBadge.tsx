import React from "react";

interface WaitingBadgeProps {
  waitingGroups: number;
  className?: string;
}

const WaitingBadge: React.FC<WaitingBadgeProps> = ({ waitingGroups, className }) => {
  if (waitingGroups === 0) return null;

  const colorClass = waitingGroups <= 3 ? "bg-[#ff6b00]" : "bg-[#ff4b2b]";

  return (
    <div
      className={[
        colorClass,
        "flex h-[24px] items-center justify-center rounded-full px-[10px] text-[11px] font-semibold leading-none text-white",
        "shadow-[0_2px_6px_rgba(0,0,0,0.15)]",
        className ?? "",
      ].join(" ")}
    >
      {waitingGroups}組待ち
    </div>
  );
};

export default WaitingBadge;
