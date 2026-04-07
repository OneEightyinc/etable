import React, { useCallback, useRef, useState } from "react";


type Props = {
  onStarted: () => void;
};

const ReceptionStartScreen: React.FC<Props> = ({ onStarted }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offsetX, setOffsetX] = useState(0);
  const draggingRef = useRef(false);
  const offsetRef = useRef(0);

  const maxSlide = useCallback(() => {
    const el = containerRef.current;
    if (!el) return 220;
    return Math.max(120, el.clientWidth - 56);
  }, []);

  const finishIfThreshold = useCallback(
    (x: number) => {
      const max = maxSlide();
      if (x > max * 0.82) {
        setOffsetX(0);
        offsetRef.current = 0;
        draggingRef.current = false;
        onStarted();
      } else {
        setOffsetX(0);
        offsetRef.current = 0;
        draggingRef.current = false;
      }
    },
    [maxSlide, onStarted]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const max = maxSlide();
    const x = Math.max(0, Math.min(e.clientX - rect.left - 28, max));
    offsetRef.current = x;
    setOffsetX(x);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    finishIfThreshold(offsetRef.current);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="header-logo flex justify-center px-6 pt-8 pb-4">
        <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/etable-logo-orange.svg`} alt="ETABLE" width={180} height={40} className="h-10 w-auto" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-full bg-[#FFF7ED]">
          <svg className="h-14 w-14 text-[#FD780F]" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
        <h2 className="mb-4 text-center text-3xl font-bold text-[#082752]">受付停止中</h2>
        <p className="text-center text-sm leading-relaxed text-gray-400">
          今日もたくさんのお客様に
          <br />
          美味しい体験を届けましょう。
        </p>
      </div>
      <div className="px-6 pb-12">
        <div
          ref={containerRef}
          className="relative flex h-16 items-center overflow-hidden rounded-full bg-gray-100"
        >
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-400">
            スライドして開店
          </span>
          <div
            role="slider"
            aria-valuenow={offsetX}
            className="absolute left-1 top-1 flex h-14 w-14 cursor-grab touch-none items-center justify-center rounded-full bg-white shadow-lg active:cursor-grabbing"
            style={{ transform: `translateX(${offsetX}px)` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <svg className="h-6 w-6 text-[#FD780F]" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionStartScreen;
