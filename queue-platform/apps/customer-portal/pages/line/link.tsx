import { useEffect, useState } from "react";
import { useRouter } from "next/router";

/**
 * LIFF アプリのエントリーポイント。
 *
 * フロー:
 *   1. customer-portal の status ページから `https://liff.line.me/{LIFF_ID}?entryId=...` を起動
 *   2. ここで liff.init → liff.login → liff.getProfile() で userId を取得
 *   3. /api/line/link に POST して queueEntry に lineUserId を紐付け
 *   4. 成功したら status ページに戻す（liff.closeWindow か router.replace）
 *
 * 必要 ENV:
 *   - NEXT_PUBLIC_LIFF_ID
 */
export default function LineLinkPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"init" | "linking" | "done" | "error">("init");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!router.isReady) return;
    let cancelled = false;

    (async () => {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

      if (!liffId) {
        setErrorMessage("LIFF ID が設定されていません。管理者にご連絡ください。");
        setStatus("error");
        return;
      }

      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId });
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        // LIFF リダイレクト後は entryId が router.query / liff.state / URL hash 等に分散するためすべてから探す
        let entryId = typeof router.query.entryId === "string" ? router.query.entryId : "";
        if (!entryId) {
          // liff.state にエンコードされたクエリから取得
          const liffState = typeof router.query["liff.state"] === "string" ? router.query["liff.state"] : "";
          if (liffState) {
            try {
              const stateParams = new URLSearchParams(liffState.replace(/^[?/]/, ""));
              entryId = stateParams.get("entryId") ?? "";
            } catch {}
          }
        }
        if (!entryId) {
          // フォールバック: 現在の URL 全体からパース
          try {
            const fullUrl = new URL(window.location.href);
            entryId = fullUrl.searchParams.get("entryId") ?? "";
          } catch {}
        }

        if (!entryId) {
          setErrorMessage("受付情報が見つかりません。順番待ちページから再度お試しください。");
          setStatus("error");
          return;
        }

        const profile = await liff.getProfile();
        if (cancelled) return;
        setStatus("linking");

        const res = await fetch("/api/line/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId, lineUserId: profile.userId }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(typeof body.error === "string" ? body.error : "通知設定に失敗しました");
        }
        if (cancelled) return;
        setStatus("done");

        // LIFF 内ブラウザならウィンドウを閉じる、外部ブラウザなら戻り先へ
        if (liff.isInClient()) {
          setTimeout(() => liff.closeWindow(), 1200);
        } else {
          // ストレージから戻り先を取れる場合は使う、なければ受付一覧へ
          setTimeout(() => router.replace("/my-reservations"), 1200);
        }
      } catch (err: any) {
        if (cancelled) return;
        setErrorMessage(err?.message ?? "エラーが発生しました");
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router.isReady, router.query.entryId]);

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-8 shadow-sm max-w-sm w-full text-center">
        {status === "init" && (
          <>
            <div className="animate-spin h-8 w-8 border-4 border-[#FD780F] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-[#082752]">LINE と接続しています...</p>
          </>
        )}
        {status === "linking" && (
          <>
            <div className="animate-spin h-8 w-8 border-4 border-[#FD780F] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-[#082752]">受付情報に紐付けています...</p>
          </>
        )}
        {status === "done" && (
          <>
            <div className="text-3xl mb-3">✓</div>
            <p className="text-sm font-semibold text-[#082752]">LINE 通知の準備ができました</p>
            <p className="text-xs text-gray-500 mt-2">順番が近づいたら LINE でお知らせします。</p>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-sm font-semibold text-red-600">エラー</p>
            <p className="text-xs text-gray-600 mt-2">{errorMessage}</p>
          </>
        )}
      </div>
    </div>
  );
}
