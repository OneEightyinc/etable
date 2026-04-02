# Queue Platform (Monorepo)

店舗整理券システムを4つのインターフェースで分離して開発するための土台です。

## 推奨構成

- `apps/store-admin`: 店舗スタッフ向け待機管理画面
- `apps/customer-portal`: ユーザー向け整理券ポータル画面
- `apps/kiosk`: 店頭タブレット向け整理券発行画面
- `apps/master-admin`: マスター権限向けアカウント発行画面
- `packages/ui`: 共通UIコンポーネント（今後）
- `packages/config`: ESLint/TS設定共通化（今後）

## 既存デザインの移行先

- `circlx-frontend-main/components/StoreView.tsx` -> `apps/store-admin`
- `circlx-frontend-main/components/CustomerView.tsx` -> `apps/customer-portal`
- `circlx-frontend-main/components/AdminView.tsx` -> `apps/master-admin`
- `tablet/index.html` + `tablet/script.js` -> `apps/kiosk`

## 技術選定

- `store-admin` / `customer-portal` / `master-admin`:
  - Next.js + TypeScript + Tailwind CSS
  - 理由: 既存デザイン資産がReact/TSX中心で流用しやすい
- `kiosk`:
  - Next.js (静的表示 + API連携) へ統一
  - 理由: 多言語・ステップUI・将来のリアルタイム連携を型安全に保守しやすい

## 進め方の推奨

1. 各 app を Next.js で初期化
2. デザインを app 単位で移植
3. API層を共通バックエンドに接続
4. 認証/権限（master, store, customer）を分離
