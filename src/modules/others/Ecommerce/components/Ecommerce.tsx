import React from 'react';

import Earnings from './Earnings';
import Periodically from './Periodically';
import Revenue from './Revenue';
import Transactions from './Transactions';

const Ecommerce: React.FC = React.memo(() => {
  return (
    <div className="mt-24">
      <Earnings />
      <Revenue />
      <Transactions />
      <Periodically />
    </div>
  );
});

export default Ecommerce;
