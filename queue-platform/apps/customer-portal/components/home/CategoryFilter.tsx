import React from "react";
import Image from "next/image";
import { EXPLORE_CATEGORIES, type ExploreCategoryId } from "../../lib/exploreCategories";

interface CategoryFilterProps {
  value: ExploreCategoryId;
  onChange: (id: ExploreCategoryId) => void;
}

/** デザインモック同様: 横スクロール・アイコンタイル・選択時オレンジ背景＋白アイコン */
const CategoryFilter: React.FC<CategoryFilterProps> = ({ value, onChange }) => {
  return (
    <div
      className="scrollbar-hide flex gap-[15.994px] overflow-x-auto px-[23.991px] pb-[11.99px] pt-[9.99px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="カテゴリー"
    >
      {EXPLORE_CATEGORIES.map((c) => {
        const isSelected = c.id === value;
        return (
          <button
            key={c.id}
            type="button"
            className={[
              "flex h-[79.991px] w-[63.997px] shrink-0 flex-col items-center gap-[7.997px]",
              !isSelected ? "opacity-60" : "",
            ].join(" ")}
            onClick={() => onChange(c.id)}
          >
            <div
              className={[
                "grid size-[56px] shrink-0 place-items-center rounded-[20px]",
                isSelected ? "bg-[#ff6b00]" : "bg-[#f5f5f5]",
              ].join(" ")}
            >
              <Image
                src={c.icon}
                alt={c.label}
                width={24}
                height={24}
                className={isSelected ? "brightness-0 invert" : ""}
              />
            </div>
            <span
              className={[
                "text-center text-[12px] font-medium leading-[16px]",
                isSelected ? "text-[#ff6b00]" : "text-[#999]",
              ].join(" ")}
            >
              {c.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
