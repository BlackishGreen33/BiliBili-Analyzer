'use client';

import { recentTransactions } from '@/common/assets/dummy';
import { Button, LineChart } from '@/common/components/elements';
import useStore from '@/common/hooks/useStore';

import DropDown from './DropDown';

const Transactions: React.FC = () => {
  const { currentColor, currentMode } = useStore();

  return (
    <div className="m-4 flex flex-wrap justify-center gap-10">
      <div className="rounded-2xl bg-white p-6 dark:bg-secondary-dark-bg dark:text-gray-200">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xl font-semibold">Recent Transactions</p>
          <DropDown currentMode={currentMode} />
        </div>
        <div className="mt-10 w-72 md:w-400">
          {recentTransactions.map((item) => (
            <div key={item.title} className="mt-4 flex justify-between">
              <div className="flex gap-4">
                <button
                  type="button"
                  style={{
                    color: item.iconColor,
                    backgroundColor: item.iconBg,
                  }}
                  className="rounded-lg p-4 text-2xl hover:drop-shadow-xl"
                >
                  {item.icon}
                </button>
                <div>
                  <p className="text-md font-semibold">{item.title}</p>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              </div>
              <p className={`text-${item.pcColor}`}>{item.amount}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between border-t-1 border-color">
          <div className="mt-3">
            <Button
              color="white"
              bgColor={currentColor}
              text="Add"
              borderRadius="10px"
            />
          </div>

          <p className="text-sm text-gray-400">36 Recent Transactions</p>
        </div>
      </div>
      <div className="w-96 rounded-2xl bg-white p-6 dark:bg-secondary-dark-bg dark:text-gray-200 md:w-760">
        <div className="mb-10 flex items-center justify-between gap-2">
          <p className="text-xl font-semibold">Sales Overview</p>
          <DropDown currentMode={currentMode} />
        </div>
        <div className="overflow-auto md:w-full">
          <LineChart />
        </div>
      </div>
    </div>
  );
};

export default Transactions;
