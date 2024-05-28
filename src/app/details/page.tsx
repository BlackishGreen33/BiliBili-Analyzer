import { NextPage } from 'next';
import { Suspense } from 'react';

import Detail from '@/modules/Detail';

const Page: NextPage = () => {
  return (
    <>
      <Suspense>
        <Detail />
      </Suspense>
    </>
  );
};

export default Page;
