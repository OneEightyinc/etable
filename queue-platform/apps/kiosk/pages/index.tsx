export default function KioskIndex() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-6 text-center text-[#082752]">
      <p className="max-w-md text-lg font-bold">この端末用のキオスクURLからアクセスしてください</p>
      <p className="mt-4 max-w-md text-sm text-slate-600">
        マスター管理画面で発行された店舗専用URL（/k/ のあとに長い英数字が続く形式）をブラウザに設定してください。
      </p>
    </main>
  );
}
