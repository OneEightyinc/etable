/**
 * SendGrid メール送信クライアント。
 *
 * 必要な ENV:
 *   - SENDGRID_API_KEY: SendGrid API キー
 *   - SENDGRID_FROM_EMAIL: 送信元メールアドレス（例: noreply@etable.net）
 *
 * ENV 未設定時は no-op で進む（開発環境用）。
 */

function getApiKey(): string | undefined {
  const k = process.env.SENDGRID_API_KEY;
  return typeof k === "string" && k.length > 0 ? k : undefined;
}

function getFromEmail(): string {
  return process.env.SENDGRID_FROM_EMAIL || "noreply@etable.net";
}

/** メール送信。失敗してもアプリ全体を落とさない。成功時 true。 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const apiKey = getApiKey();
  if (!apiKey) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[email] SENDGRID_API_KEY not set; skipping send");
    }
    return false;
  }
  if (!to) return false;

  try {
    const sgMail = (await import("@sendgrid/mail")).default;
    sgMail.setApiKey(apiKey);
    await sgMail.send({
      to,
      from: getFromEmail(),
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("[email] send error:", err);
    return false;
  }
}

/** 呼び出しメールのテンプレート展開。 */
export function formatCallEmail(
  ticketNumber: number,
  storeName?: string
): { subject: string; html: string } {
  const name = storeName || "ETABLE";
  return {
    subject: `【${name}】順番のお知らせ`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #FD780F; margin-bottom: 16px;">${name}</h2>
        <p style="font-size: 16px; color: #333;">
          番号 <strong style="font-size: 24px; color: #082752;">No.${ticketNumber}</strong> のお客様
        </p>
        <p style="font-size: 16px; color: #333; margin-top: 12px;">
          お席の準備ができました。店舗までお越しください。
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 12px; color: #999;">
          このメールは ${name} の順番待ちシステムから自動送信されています。
        </p>
      </div>
    `,
  };
}
