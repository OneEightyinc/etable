import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import CustomerView from '../components/CustomerView';

const CustomerPage: NextPage = () => {
  const router = useRouter();
  const storeId = (router.query.storeId as string) || 'shibuya-001';
  const entryId = router.query.entryId as string | undefined;

  return <CustomerView storeId={storeId} entryId={entryId} />;
};

export default CustomerPage;
