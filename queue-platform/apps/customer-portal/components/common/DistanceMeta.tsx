import React from "react";
import { MapPinIcon } from "@heroicons/react/24/solid";

interface DistanceMetaProps {
  rating: number;
  distance: string;
}

const DistanceMeta: React.FC<DistanceMetaProps> = ({ rating, distance }) => (
  <div className="flex h-[15px] items-center gap-[11.99px]">
    <div className="flex items-center gap-[3.993px]">
      <span className="text-[10px] font-bold leading-[15px] text-[#ff8904]">★</span>
      <span className="text-[10px] font-bold leading-[15px] text-[#666]">{rating.toFixed(1)}</span>
    </div>
    <div className="flex items-center gap-[3.993px]">
      <MapPinIcon className="size-[9.993px] text-[#666]" />
      <span className="text-[10px] font-bold leading-[15px] text-[#666]">{distance}</span>
    </div>
  </div>
);

export default DistanceMeta;
