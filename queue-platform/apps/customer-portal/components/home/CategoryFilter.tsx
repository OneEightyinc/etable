import React, { useRef } from "react";

interface CategoryFilterProps {
  value: string;
  onChange: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ value, onChange }) => {
  const categories = [
    "すべて",
    "和食",
    "寿司",
    "焼肉",
    "ラーメン",
    "カフェ",
    "イタリアン",
    "中華",
    "居酒屋",
    "スイーツ",
  ];

  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full px-4 py-4">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollBehavior: "smooth" }}
      >
        {categories.map((category) => {
          const isActive = value === category;
          return (
            <button
              key={category}
              onClick={() => onChange(category)}
              className="flex flex-col items-center gap-2 flex-shrink-0"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isActive ? "bg-[#FD780F]" : "bg-[#f5f5f5]"
                }`}
              >
                <span className={`text-[12px] font-medium ${isActive ? "text-white" : "text-[#666]"}`}>
                  {category}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default CategoryFilter;
