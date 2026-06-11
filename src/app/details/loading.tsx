import { NextPage } from 'next';

import { Spinner } from '@/common/components/ui/spinner';

const DetailLoading: NextPage = () => {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
};

export default DetailLoading;
