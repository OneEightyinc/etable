import Link from "next/link";

export default function SurveyThanksPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex w-full max-w-[393px] min-h-screen flex-col items-center justify-center bg-white px-6 shadow-sm">
        {/* Green checkmark icon */}
        <div className="mb-6">
          <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="40" cy="40" r="40" fill="#22C55E" />
            <path
              d="M24 40L35 51L56 30"
              stroke="white"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-[20px] font-bold text-[#082752] mb-3 text-center">
          ご回答ありがとうございました！
        </h1>

        <p className="text-[14px] text-[#666] leading-relaxed text-center mb-10">
          貴重なご意見をいただきありがとうございます。
          <br />
          サービスの向上に活用させていただきます。
        </p>

        <Link
          href="/"
          className="inline-block rounded-xl bg-[#FD780F] px-10 py-3.5 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-[#e56b08] active:bg-[#d4600a]"
        >
          お店に戻る
        </Link>
      </div>
    </div>
  );
}
