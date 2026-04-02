import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import StoreView from '../components/StoreView';

const StorePage: NextPage = () => {
  const router = useRouter();
  const storeId = (router.query.storeId as string) || 'shibuya-001';

  return <StoreView storeId={storeId} />;
};

export default StorePage;
