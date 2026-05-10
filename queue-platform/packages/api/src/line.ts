/**
 * LINE Messaging API クライアント。
 *
 * 必要な ENV:
 *   - LINE_CHANNEL_ACCESS_TOKEN: long-lived channel access token
 *
 * 開発時に ENV 未設定でもエラーにせず no-op で進む（LIFF 連携前のローカル動作を壊さない）。
 */

const LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";

export type LinePushMessage =
  | { type: "text"; text: string }
  | { type: "flex"; altText: string; contents: unknown };

function getAccessToken(): string | undefined {
  const t = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  return typeof t === "string" && t.length > 0 ? t : undefined;
}

/** 単一ユーザーへ push 送信。失敗してもアプリ全体を落とさない。成功時 true。 */
export async function pushLineMessage(
  to: string,
  messages: LinePushMessage[]
): Promise<boolean> {
  const token = getAccessToken();
  if (!token) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[line] LINE_CHANNEL_ACCESS_TOKEN not set; skipping push");
    }
    return false;
  }
  if (!to || messages.length === 0) return false;

  try {
    const res = await fetch(LINE_PUSH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to, messages }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[line] push failed: ${res.status} ${body}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[line] push error:", err);
    return false;
  }
}

/** 呼び出しメッセージのテンプレート展開（{number} → ticket）。 */
export function formatCallMessage(template: string, ticketNumber: number): string {
  const t = (template ?? "").trim() || "番号 {number} のお客様、ご来店をお願いいたします。";
  return t.replace(/\{number\}/g, String(ticketNumber));
}
