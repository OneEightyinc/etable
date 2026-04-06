import { useEffect } from "react";
import { useRouter } from "next/router";

/** 参照サイト互換: /mypage/profile → 編集モード */
export default function MypageProfileRedirect() {
  const router = useRouter();
  useEffect(() => {
    void router.replace("/mypage?edit=1", "/mypage?edit=1", { shallow: false });
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-[14px] text-[#666]">
      読み込み中…
    </div>
  );
}
