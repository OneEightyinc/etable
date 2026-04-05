/** 顧客ポータル用: ブラウザでリサイズ・JPEG 圧縮し data URL 化（DB に文字列で保存） */
const MAX_EDGE = 1280;
const MAX_DATA_URL_CHARS = 1_800_000;
const JPEG_QUALITY_START = 0.82;

export async function compressImageForPortal(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("画像ファイル（JPEG / PNG / WebP など）を選んでください");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("15MB 以下の画像にしてください");
  }

  const bitmap = await createImageBitmap(file);
  try {
    let w = bitmap.width;
    let h = bitmap.height;
    const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
    w = Math.round(w * scale);
    h = Math.round(h * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("画像の処理に失敗しました");
    ctx.drawImage(bitmap, 0, 0, w, h);

    let q = JPEG_QUALITY_START;
    let dataUrl = canvas.toDataURL("image/jpeg", q);
    while (dataUrl.length > MAX_DATA_URL_CHARS && q > 0.5) {
      q -= 0.07;
      dataUrl = canvas.toDataURL("image/jpeg", q);
    }
    if (dataUrl.length > MAX_DATA_URL_CHARS) {
      throw new Error("画像が大きすぎます。別の写真を試すか、解像度を下げてください。");
    }
    return dataUrl;
  } finally {
    bitmap.close();
  }
}
