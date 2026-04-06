import type { GetServerSideProps } from "next";
import { resolvePublicUrlToken } from "@queue-platform/api/src/server";
import KioskPage from "../../components/KioskPage";

type Props = { storeId: string };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const raw = ctx.params?.token;
  const token = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  const storeId = await resolvePublicUrlToken("kiosk", token);
  if (!storeId) return { notFound: true };
  return { props: { storeId } };
};

export default function KioskEntryPage({ storeId }: Props) {
  return <KioskPage storeId={storeId} />;
}
