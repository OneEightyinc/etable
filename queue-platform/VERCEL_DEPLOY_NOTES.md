# Vercel デプロイ経緯まとめ

## プロジェクト概要
- **リポジトリ**: https://github.com/OneEightyinc/etable
- **モノレポ構成**: `queue-platform/` 配下に4つのNext.jsアプリ
  - `apps/master-admin` (管理者画面) - port 3008
  - `apps/store-admin` (店舗管理画面) - port 3005
  - `apps/customer-portal` (ユーザー画面) - port 3006
  - `apps/kiosk` (キオスク) - port 3007
- **技術スタック**: Next.js 16.1.6 (Pages Router), React 19, TypeScript 5, Tailwind CSS v4, npm workspaces

## デプロイ済みの状況

### store-admin ✅ 成功
- URL: https://etable-1yex.vercel.app/
- 正常に動作中

### master-admin ⚠️ 要再デプロイ（コード側は修正済み）
- URL: https://etable-h8mj.vercel.app/（例）
- **過去の原因1**: Root Directory を `queue-platform/apps/master-admin` にしたとき、**そのディレクトリだけで `npm install` するとワークスペース `@queue-platform/api` が解決されず**、API が動かない / ビルド失敗になり得る。
- **過去の原因2**: Vercel の「URL import」は自動デプロイ非対応のため、修正が本番に乗らないことがある。
- **今回のコード修正**: `apps/master-admin/vercel.json` で **モノレポルート（`queue-platform`）から `npm install` / `build`** するように変更。あわせて `outputFileTracingRoot`・Cookie `Secure`・`fetch credentials: 'include'`・ログイン画面の SVG を `<img>` に変更。

### kiosk / customer-portal ⏳ 未デプロイ
- 各アプリごとに個別のVercelプロジェクトが必要

## Vercel対応で実施したコード修正（GitHub pushは済み）

### 修正3: master-admin の Vercel ビルド（モノレポ）
**`apps/master-admin/vercel.json`**
- `installCommand`: `cd ../.. && npm install` — `queue-platform` ルートで workspaces を解決
- `buildCommand`: `cd ../.. && npm run build -w apps/master-admin`

**`apps/master-admin/next.config.ts`**
- `outputFileTracingRoot` / `turbopack.root` を `queue-platform` ルートに設定（`@queue-platform/api` をサーバーレスに正しく含める）

**`packages/api/src/auth.ts`**
- 本番（`NODE_ENV=production` または `VERCEL=1`）ではセッション Cookie に **`Secure`** を付与
- Cookie 値は `encodeURIComponent` / 読み取り時に `decodeURIComponent`（安全にパース）

**`packages/api/src/api-client.ts`**
- すべての `fetch` に **`credentials: 'include'`**（クロスオリジンやプロキシ環境でも Cookie を送る）
- `getMe()` は **401 のとき `null` を返す**（未ログインを例外にしない）

**`apps/master-admin/components/LoginView.tsx`**
- ロゴ SVG は **`next/image` ではなく `<img>`**（Vercel / Turbopack での SVG まわりの不具合を避ける）

### 修正1: ファイルシステム対応 (commit: `736ffc2`)
Vercelはread-onlyファイルシステムのため、`data/db.json` への書き込みがENOENTエラーになる。

**`packages/api/src/db.ts`の変更点:**
- `saveDb()` を try/catch で囲み、書き込み失敗時はサイレントスキップ
- `loadDb()` の catch ブロックで `saveDb()` を呼ばないように変更
- `getDbPath()` で `fs.existsSync()` チェックを追加

### 修正2: HMAC トークン認証 (commit: `9768684`)
Vercelのサーバーレス関数はステートレスのため、サーバーサイドセッション（メモリ内 or ファイル内）が使えない。HMAC-SHA256署名付きCookieトークン方式に変更。

**新規ファイル: `packages/api/src/auth.ts`**
- `signToken()` / `verifyToken()` — HMAC-SHA256でトークン署名・検証
- `createSessionToken()` — ユーザーID/ロール/storeIdをトークンに埋め込み
- `setSessionCookie()` / `clearSessionCookie()` — HttpOnly Cookie操作
- `getSessionFromRequest()` — Cookie or Authorizationヘッダーからセッション取得
- `requireAuth()` — ロールベースの認証ガード
- 環境変数 `TOKEN_SECRET` でシークレット設定可能（デフォルト値あり）

**変更ファイル:**
- `apps/master-admin/pages/api/auth/login.ts` — `createSession()`(DB書き込み) → `createSessionToken()`(HMAC)に変更
- `apps/master-admin/pages/api/auth/me.ts` — auth.ts + db.ts から直接インポートに変更
- `apps/master-admin/pages/api/auth/logout.ts` — Cookie削除のみに簡略化
- `packages/api/src/server.ts` — `createSessionToken` をエクスポートに追加、旧セッション関数の外部エクスポートは残存

## 次にやるべきこと（優先順）

### 1. master-admin を再デプロイ
- **Root Directory**: `queue-platform/apps/master-admin`（変更なしでよい）
- リポジトリを GitHub と連携している場合: 本ブランチを **push 後、Vercel で Redeploy**
- URL import のみのプロジェクト: **再インポート** または `vercel --prod`（`apps/master-admin` をカレントに）
- **環境変数**: `TOKEN_SECRET` = 任意の長いランダム文字列（未設定でもデフォルトで動くが本番では必須推奨）
- ログインテスト: `admin@circlex.jp` / `password`
- デプロイ後、`vercel.json` により **インストールとビルドは自動でモノレポルートから実行**される

### 2. kiosk と customer-portal をデプロイ
同じ手順で、Root Directoryをそれぞれ変えて新規プロジェクト作成:
- kiosk: Root Directory = `queue-platform/apps/kiosk`
- customer-portal: Root Directory = `queue-platform/apps/customer-portal`

### 3. store-admin にも同じ認証修正を適用
store-adminのログインAPIも同様にHMAC認証に変更が必要（現在はdb.json書き込み方式のまま動いている可能性あり）

### 4. 本番DB移行
JSON file DB → Upstash Redis 等のクラウドDBへ移行（Vercelではファイル書き込み不可のため、データ永続化には必須）

## 重要な注意点
- **OneEightyinc は GitHub 個人アカウント**（Organization ではない）。Vercel連携時に組織一覧に出ないため、URL直接インポートが必要。
- **Vercel URL import は自動デプロイ非対応**。コード更新後は毎回手動で再インポートするか、Vercel CLI (`vercel --prod`) を使う。
- **ETABLE カラー**: orange=#FD780F/#ff6b00, navy=#082752, green=#22C55E

## Git コミット履歴
```
9768684 fix: switch to HMAC token auth for Vercel serverless compatibility
736ffc2 fix: make db layer work on Vercel read-only filesystem
87bad20 feat: etable queue management platform
```
