import { NextPage } from 'next';

import { Spinner } from '@/common/components/ui/spinner';

const CompareLoading: NextPage = () => {
  return (
    <div className="m-2 mt-24 p-2 md:m-10 md:p-10">
      <div className="mx-auto flex h-96 max-w-7xl items-center justify-center">
        <Spinner size="lg" />
      </div>
    </div>
  );
};

export default CompareLoading;
